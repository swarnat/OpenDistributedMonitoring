/** IMPORTS **/

import express from 'express'
import http from 'http';
import chalk from "chalk";
import crypto from 'crypto';

import cors from 'cors'
import check from './check.js';
import dayjs from 'dayjs'


import configuration from '../config.js';
import queue from './bullmq/queue.js';
import errorlog from './errorlog.js';
import mysql from './mysql.js';

import parser from 'cron-parser';
import apitoken from './apitoken.js';

/** INITIALIZE **/
const app = express();
app.use(cors())
app.use(express.json());

var httpServer = http.createServer(app);

/** Authentication **/
app.use(async function (req, res, next) {
    var connection = mysql.getConnection();
    if(req.url, req.url.match(/check\/.+\/report/)) {
        next();
        return;
    }

    if(typeof req.headers.auth == 'undefined') {
        var err = new Error('Token not Found');
        err.status = 404;
        next(err);
    } else {
        var hash = crypto.createHash('sha256').update(req.headers.auth).digest('hex');
        
        connection.query('SELECT id FROM apitoken WHERE token = ? AND (expire IS NULL OR expire > NOW())', [hash], (error, results, fields) => {
            if(results.length == 0) {
                var err = new Error('Token not Found');
                err.status = 404;
                next(err);
            } else {
                next();
            }
        });

        //console.log(result);
    }
    //console.log(req.headers.auth);

  });
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.send(err.message);
  });

/** ROUTES **/

app.get('/ping', (request, response) => {
    response.send('pong');
    response.end();
});

app.route('/apitoken')
    .post(function(req, res) {
        try {
            if(typeof req.body.token == 'undefined' || req.body.token.length < 7) {
                res.json({'succcess': false, 'error': 'Please set a token with at least 7 chars.'});
                res.end();
                return;
            }

            apitoken.addToken(req.body.token, req.body.expire).then(() => {
                res.json({success:true});
                res.end();
            });
        } catch (e) {
            console.log(e);
        }
    })
    .delete(function(req, res) {
        try {
            if(typeof req.body.token == 'undefined' || req.headers.auth == req.body.token) {
                res.json({'succcess': false, 'error': 'Please set a token, you want to delete within request payload. You cannot delete the token, which authenticate this request.'});
                res.end();

                return;
            }

            var hash = crypto.createHash('sha256').update(req.body.token).digest('hex');            

            apitoken.deleteToken(hash).then(() => {
                res.json({success:true});
                res.end();
            });
        } catch (e) {
            console.log(e);
        }
    });

app.route('/check')
    .get(function(req, res) {
        let checks = check.getChecks().then((checks) => {
            for(var i in checks) {
                checks[i].repeat_job_key = undefined;
            }

            res.json(checks);
            res.end();
        });
    })

    .post(function(req, res) {
        try {
            check.addCheck(req.body).then((checkId) => {
                check.getCheck(checkId).then((check) => {
                    check.repeat_job_key = undefined;
                    res.json(check);
                    res.end();

                    queue.addSingleCheck(req.params.id);

                    queue.registerCheck(checkId);
                });
            }, (error) => {
                res.json({success: false, error: error});
                res.end();
            });
        } catch (e) {
            console.log(e);
        }
    })
    ;


app.route('/check/:id')
    .get(function(req, res) {
        
        let checks = check.getCheck(req.params.id).then((check) => {
            check.id = undefined;
            check.repeat_job_key = undefined;

            res.json(check);
            res.end();
        });
    })
    .delete(async function(req, res) {
        await queue.deregisterCheck(req.params.id);

        let checks = check.deleteCheck(req.params.id).then(() => {
            res.json({'success': true});
            res.end();
        });
    })
    .patch(async function(req, res) {
        try {
            var interval = parser.parseExpression(req.body.interval);
            interval.next().toString();
        } catch (e) {
            errorlog(req.params.id, 'Error during Update: ' + e);

            res.json({result: false, error: e.toString() });
            res.end();

            return;
        }

        try {
            await queue.deregisterCheck(req.params.id);
        } catch (e) {
            errorlog(req.params.id, 'Error during Update: ' + e);
            return;
        }

        check.updateCheck(req.params.id, req.body).then(() => {

            check.getCheck(req.params.id).then(async (check) => {
                check.repeat_job_key = undefined;

                res.json(check);
                res.end();

                queue.addSingleCheck(req.params.id);

                queue.registerCheck(req.params.id);
            });

        });
    })
    ;

app.route('/check/:id/report')
    .get(function(req, res) {
        var checkId = req.params.id;

        check.getCheck(req.params.id).then(async (checkData) => {

            check.getHistory(req.params.id).then(history => {
                var historyList = '';

                var x = [];
                var y = [];
                for(var row of history) {
                    historyList += "<tr><td>" + dayjs(row.created).format('YYYY-MM-DD HH:mm:ss') + "</td><td>" + row.latency + "ms</td><td style='background-color:"+(row.status == "success" ? "#99cc66" : "#f8d7da") + ";'>" + row.status + "</td><td>" + row.text + "</td></tr>";
                    x.push(row.created);
                    y.push(row.latency);
                }

                var html = `<!doctype html>
                <html lang="en">
                  <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>Bootstrap demo</title>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.0-beta1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-0evHe/X+R7YkIZDRvuzKMRqM+OrBnVFBL6DOitfPri4tjfHxaWutUpFmBp4vmVor" crossorigin="anonymous">
                  </head>
                  <body>
                    <div class="container">
                        <h1>Report ${checkData.type.toUpperCase()} Check ${checkData.title}</h1>
                        <div class="alert alert-${checkData.status == 'success' ? 'success' : 'danger'}">Aktueller Status: ${checkData.status}</div>
                        <div id="chart" style="width:100%;height:330px;border:2px solid #eee;"></div>
                        <table class="table table-condensed">
                            <thead></thead><tr><td>Date / Time</td><td>Latency</td><td>Status</td><td></td></tr></thead>
                            <tbody>${historyList}</tbody>
                        </table>
                    </div>
                    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.0-beta1/dist/js/bootstrap.bundle.min.js" integrity="sha384-pprn3073KE6tl6bjs2QrFaJGz5/SUsLqktiwsUTF55Jfv3qYSDhgCecCxMW52nD2" crossorigin="anonymous"></script>
                    <script src="https://cdn.plot.ly/plotly-2.12.1.min.js"></script>
                    <script>
                        var chart = document.getElementById('chart');
                        Plotly.newPlot( chart, [{
                            x: ${JSON.stringify(x)},
                            y: ${JSON.stringify(y)}, }], {
                            yaxis: {
                                ticksuffix: "ms"
                            },
                            type: 'bar',
                            height: 300,
                            width: 1250,
                            margin: { t: 0, b:80, l:80, r:0, pad:10 } 
                        });
                    </script>                    
                  </body>
                </html>`;
        
                res.send(html);
                res.end();
    
            });
        });

    });



/** STARTUP **/
httpServer.listen(configuration.http_port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }

    console.log(chalk.bgGreenBright.black(`[OK] HTTP Server is listening on Port ${configuration.http_port}`));
});


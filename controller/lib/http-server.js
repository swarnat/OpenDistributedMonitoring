/** IMPORTS **/

import express from 'express'
import http from 'http';
import chalk from "chalk";
import crypto from 'crypto';

import cors from 'cors'
import check from './check.js';


import configuration from '../config.js';
import queue from './bullmq/queue.js';
import errorlog from './errorlog.js';
import mysql from './mysql.js';

/** INITIALIZE **/
const app = express();
app.use(cors())
app.use(express.json());

var httpServer = http.createServer(app);

/** Authentication **/
app.use(async function (req, res, next) {
    var connection = mysql.getConnection();

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

                await queue.registerCheck(req.params.id);
            });

        });
    })
    ;




/** STARTUP **/
httpServer.listen(configuration.http_port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }

    console.log(chalk.bgGreenBright.black(`[OK] HTTP Server is listening on Port ${configuration.http_port}`));
});


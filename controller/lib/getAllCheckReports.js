import dayjs from "dayjs";
import check from "./check.js";

export default async function() {
    return new Promise(resolve =>  {
        check.getChecks().then(allChecks => {
    
            let checkList = '';
            for(let singleCheck of allChecks) {
                checkList += "<tr><td>" + singleCheck.type.toUpperCase() + "</td><td><a href='/check/" + singleCheck.id + "/report'>" + singleCheck.title + "</a></td><td>" + (singleCheck.last_check != '0000-00-00 00:00:00' ? dayjs(singleCheck.last_check).format('YYYY-MM-DD HH:mm:ss') : 'nie') + "</td><td style='background-color:"+(singleCheck.status == "success" ? "#99cc66" : "#f8d7da") + ";'>" + singleCheck.status + "</td></tr>";
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
                    <h1>Open Distributed Monitoring Overview</h1>
                    <table class="table table-condensed">
                        <thead></thead><tr><td style="width:100px;"></td><td>Test</td><td>last Check</td><td>Status</td></tr></thead>
                        <tbody>${checkList}</tbody>
                    </table>
                </div>
                <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.0-beta1/dist/js/bootstrap.bundle.min.js" integrity="sha384-pprn3073KE6tl6bjs2QrFaJGz5/SUsLqktiwsUTF55Jfv3qYSDhgCecCxMW52nD2" crossorigin="anonymous"></script>
              </body>
            </html>`;

            resolve(html);
            console.log(allChecks);
        });

    });
        check.getHistory(req.params.id).then(history => {
            var historyList = '';

            var x = [];
            var y = [];
            for(var row of history) {
                
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
                        width: 4,              
                        x: ${JSON.stringify(x)},
                        y: ${JSON.stringify(y)}, }], {
                        yaxis: {
                            ticksuffix: "ms"
                        },
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
}
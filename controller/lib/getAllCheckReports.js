import dayjs from "dayjs";
import check from "./check.js";

export default async function() {
    return new Promise(resolve =>  {
        check.getChecks().then(allChecks => {
            let checkList = '';
            
            try {
                for(let singleCheck of allChecks) {
                    let statusField;
                    
                    if(singleCheck.active == 1) {
                        switch(singleCheck.status) {
                            case 'success':
                                statusField = "<td style='background-color:#99cc66;'>OK</td>";
                                break;
                            case 'fail':
                                statusField = "<td style='background-color:#f8d7da;'>Fehler</td>";
                                break;
                        }
                    } else {
                        statusField = "<td style='background-color:#e2e2e2;color:#bcbcbc'><em>Inaktiv</em></td>";
                    }

                    checkList += "<tr><td>" + singleCheck.type.toUpperCase() + "</td><td><a href='/check/" + singleCheck.id + "/report'>" + singleCheck.title + "</a></td><td>" + (singleCheck.last_check != '0000-00-00 00:00:00' && singleCheck.last_check != '' ? dayjs(singleCheck.last_check).format('YYYY-MM-DD HH:mm:ss') : 'nie') + "</td>" + statusField + "</tr>";
                }

            } catch (e) {
                console.log(e);
            }

            const html = `<!doctype html>
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
        });

    });
}
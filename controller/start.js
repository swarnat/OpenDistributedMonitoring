import dayjs from 'dayjs'
import check from './lib/check.js';
import mysql from './lib/mysql.js';

import localizedFormat from 'dayjs/plugin/localizedFormat.js'
import relativeTime from 'dayjs/plugin/relativeTime.js'
dayjs.extend(localizedFormat)
dayjs.extend(relativeTime)

import './lib/http-server.js';
import './lib/bullmq/results.js';
import dailySummary from './lib/bullmq/daily-summary.js';
import queue from './lib/bullmq/queue.js';

queue.clear().then(() => {

  mysql.connect().then(() => {
    check.getChecks().then((checks) => {
      console.log(checks);            
  
      for(let singleCheck of checks) {
  
        queue.registerCheck(singleCheck.id);
      }
    })

    dailySummary.reset();
  });
  
});



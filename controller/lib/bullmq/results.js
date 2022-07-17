import { Worker } from 'bullmq';
import check from '../check.js';
import logger from '../log.js';
import dayjs from 'dayjs'

import configuration from '../../config.js';

new Worker('results', async job => {
    try {
        let data = {
          'id': job.name,
          'created': dayjs(job.data.timestamp).format('YYYY-MM-DD HH:mm:ss'),
          'status': job.data.data.success == true ? 'success' : 'fail',
          'latency': job.data.data.latency,
          'text': job.data.data.text ? job.data.data.text : '',
        };
  
        // console.log(data);
      // execute the insert statment
      check.addHistory(data);  
  
      logger(job.name, job.data.data.latency + ' ms ' + (job.data.data.success ? "Success" : "Fail"));
  
      if(data.status == 'fail') {
        check.markFailed(data.id, job.data);  
      } else {
        check.markSuccess(data.id, job.data);  
      }
    } catch(e) {
      console.log(e);
    }
  }, { connection: configuration.redis });
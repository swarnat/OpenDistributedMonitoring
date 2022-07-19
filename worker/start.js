import { Worker } from 'bullmq';
import checks from './lib/checks.js';

import successCb from './lib/successCb.js';
import errorCb from './lib/errorCb.js';
import configuration from './config.js';

const queueName = configuration.topic_prefix + 'monitor';

console.log('[' + new Date().toISOString().split('.')[0] + '] Listen to BullMQ Queue: ' + queueName);

new Worker(queueName, async job => {

  if(checks[job.data.check] !== 'undefined') {
        const jobData = {
            'name': job.name,
            'options': job.data.options
        };

        checks[job.data.check](
            jobData, function(result) {
                result.success = true;
                successCb(job.name, result);
            }, function(result) {
                result.success = false;
                errorCb(job.name, result);
            });
    }

}, { 
    connection: configuration.redis, 
    concurrency: configuration.concurrency 
});


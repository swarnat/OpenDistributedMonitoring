import { Queue } from 'bullmq';
import configuration from '../config.js';

const resultQueue = new Queue(configuration.topic_prefix + 'results',  { connection: configuration.redis });

export default function(jobName, results) {

    resultQueue.add(jobName, {
        timestamp: new Date().getTime(),
        data: results
    });

}
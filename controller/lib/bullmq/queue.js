import { Queue, QueueScheduler } from 'bullmq';

import configuration from '../../config.js';
import check from '../check.js';
import logger from '../log.js';

var connection = {
    host: "localhost",
    port: 6379
};

const myQueueScheduler = new QueueScheduler('monitor',  { connection: configuration.redis });
const myQueue = new Queue('monitor',  { connection: configuration.redis });


export default {
    async clear() {
        logger('GLOBAL', 'Clear Queue');
        await myQueue.drain();
    },
    async deregisterCheck(checkId) {
        return new Promise((resolve, reject) => {
            check.getCheck(checkId).then(async (checkData) => {
                if(checkData === undefined) {
                    reject('Check ID not found');
                    return;
                }

                logger(checkId, 'Deregister Check');
                
                if(checkData.repeat_job_key == '') return;

                await myQueue.removeRepeatableByKey(checkData.repeat_job_key);

                await check.updateRepeatJobKey(checkId, '');

                resolve();
            });
        });
    },
    async registerCheck(checkId) {
        check.getCheck(checkId).then(async checkData => {
            if(checkData.active == '1') {

                logger(checkId, 'Register Check');

                var checkData = await myQueue.add(
                    checkId,
                    { 
                    check: checkData.type,
                    options: checkData.options, 
                    },
                    {
                        repeat: {
                            cron: checkData.interval,
                            limit: 10,
                        },
                    },
                ); 

                await check.updateRepeatJobKey(checkId, checkData.repeatJobKey);
            }

        })
    }
}
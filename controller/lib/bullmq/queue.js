import { Queue, QueueScheduler } from 'bullmq';
import chalk from 'chalk';
import dayjs from 'dayjs';

import configuration from '../../config.js';
import check from '../check.js';
import logger from '../log.js';

console.log(chalk.bgGreenBright.black('Connect to BullMQ Queue: ' + configuration.topic_prefix + 'monitor'));

const myQueueScheduler = new QueueScheduler(configuration.topic_prefix + 'monitor',  { connection: configuration.redis });
const myQueue = new Queue(configuration.topic_prefix + 'monitor',  { connection: configuration.redis });


export default {
    async clear() {
        logger('GLOBAL', 'Clear Queue');
        await myQueue.drain(true);
    },
    async deregisterCheck(checkId) {
        return new Promise((resolve, reject) => {
            check.getCheck(checkId).then(async (checkData) => {
                if(checkData === undefined) {
                    reject('Check ID not found');
                    return;
                }

                logger(checkId, 'Deregister Check');

                if(checkData.repeat_job_key == '') {
                    resolve();
                    return;
                }

                await myQueue.removeRepeatableByKey(checkData.repeat_job_key);

                await check.updateRepeatJobKey(checkId, '');

                resolve();
            });
        });
    },

    async addSingleCheck(checkId) {
        check.getCheck(checkId).then(async checkData => {
            console.log(checkData);
            if(checkData.active == '1') {

                logger(checkId, 'Register Check');

                myQueue.add(
                    'single-' + checkId,
                    { 
                        check: checkData.type,
                        options: checkData.options, 
                    }
                ); 
            }

        })

    },

    async registerCheck(checkId) {
        check.getCheck(checkId).then(async singleCheck => {
            if(singleCheck.active == '1') {

                logger(checkId, 'Register Check');

                const checkData = await myQueue.add(
                    checkId,
                    { 
                        check: singleCheck.type,
                        options: singleCheck.options, 
                    },
                    {
                        repeat: {
                            cron: singleCheck.interval,
                            limit: 10,
                        },
                    },
                ); 

                logger(checkId, 'Next execution: ' + dayjs(checkData.opts.timestamp + checkData.opts.delay).format('lll'));
                
                await check.updateRepeatJobKey(checkId, checkData.repeatJobKey);
            }

        })
    }
}
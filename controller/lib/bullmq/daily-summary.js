import { Queue, QueueScheduler, Worker } from 'bullmq';
import configuration from '../../config.js';
import mysql from '../mysql.js';
import dayjs from 'dayjs'
import log from '../log.js';
import axios from 'axios';
import chalk from 'chalk';

console.log(chalk.bgGreenBright.black('Connect to BullMQ Daily Queue: ' + configuration.topic_prefix + 'daily'));

const dailyQueueScheduler = new QueueScheduler(configuration.topic_prefix + 'daily',  { connection: configuration.redis });
const dailyQueue = new Queue(configuration.topic_prefix + 'daily',  { connection: configuration.redis });
  
dailyQueue.drain().then(() => {

    new Worker(configuration.topic_prefix + 'daily', () => {
        const connection = mysql.getConnection();
    
        try {
            const expire = dayjs().subtract(24, 'hours')
    
            let until = expire.format('YYYY-MM-DD HH:mm:ss');
    
            connection.query('SELECT COUNT(*) as num FROM history WHERE created > ?', [until], (_error, results, _fields) => {
                log('SUMMARY', 'Send daily report about ' + results[0].num + ' history records');
    
                axios.post(configuration.slack.webhook, {
                  "text": "<em>[Summary]</em> With last 24 hours, there was <b>" + results[0].num + ' checks</b> done',
                  //"text": "<b>Recover check</b> " + checkData[checkId].title + '<br/>after ' + timeRange,
                  "format": "html",
                  "displayName": configuration.slack.displayName,
              });                 
            });
        } catch (e) {
            console.log(e);
        }
        //
    
    
        //
      }, { connection: configuration.redis });
    
});


export default {
    reset: function() {
        if(configuration.enable_daily_reports) {
            log('GLOBAL', 'Register daily summary');

            dailyQueue.add(
                'daily-summary',
                {},
                {
                    repeat: {
                        cron: '0 0 0 * * *',
                        limit: 1,
                    },
                },
            )
        }
    }
}


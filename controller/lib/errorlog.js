import chalk from 'chalk';
import dayjs from 'dayjs'

export default function(jobName, log) {
    console.log(
        chalk.bgRedBright.black(        
            'ERROR [' + jobName + '] - ' + dayjs().format('YYYY-MM-DD HH:mm:ss') + ' - ' + log
        )
    );
}
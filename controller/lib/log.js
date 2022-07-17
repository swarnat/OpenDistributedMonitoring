import dayjs from 'dayjs'

export default function(jobName, log) {
    console.log('[' + jobName + '] - ' + dayjs().format('YYYY-MM-DD HH:mm:ss') + ' - ' + log);
}
import addResults from './add-results.js';

export default function(jobName, errorData) {
    console.log('[' + jobName + '][' + new Date().toISOString().split('T')[0] + '] Error');
    console.log(errorData);

   addResults(jobName, errorData);

};
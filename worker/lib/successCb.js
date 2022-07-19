import addResults from './add-results.js';

export default function(jobName, results) {
    console.log('[' + jobName + '][' + new Date().toISOString().split('T')[0] + '] Success');
    
    addResults(jobName, results);

}
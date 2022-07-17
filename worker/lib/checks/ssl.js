import { parse as urlParse } from 'url';
import { connect } from 'tls';
import { Console } from 'console';

var localJobinfo = {
    timeout: 10000,
    url: '',
    // days: 100,    
    days: 32,    
};

export default function(jobData, successCb, errorCb) {
    //console.log(jobData);
    let options = Object.assign({}, localJobinfo, jobData.options);

    let checkResult = {
        success: false,
        valid: false,
        domainmatch: false,
        latency: 0,
        text: '',
    };

    if(typeof options.url == 'undefined') {
        errorCb('No Url Provided');
        return;
    }

    let destination = urlParse(options.url);

    if(!destination.port){
        destination.port = 443;
    }    

    let connectOptions = {
        servername: destination.hostname,
        host: destination.hostname,
        port: destination.port
    };

    console.log('Start SSL Check ' + destination.hostname);

    var startTime = new Date().getTime();

    let socket = connect(connectOptions, function(err, response) {
        checkResult.latency = ((new Date().getTime())  - startTime);

        if(socket.authorized === true) {

            let certificate = socket.getPeerCertificate();

            if(certificate && certificate.subject) {
                checkResult.valid = true;

                let mainCertDomain = certificate.subject.CN.toLowerCase();

                if(destination.hostname.toLowerCase() != mainCertDomain){

                    if(certificate.subjectaltname) {
                        let certAlternativeNames = certificate.subjectaltname.toLowerCase();

                        if(certAlternativeNames.indexOf(destination.hostname) >= 0) {
                            checkResult.domainmatch = true;
                        }
                    }
                
                } else {
                    checkResult.domainmatch = true;
                }
            }

            if(checkResult.domainmatch === false) {
                checkResult.text = 'Domain does not match';
                return errorCb(checkResult);
            }

            if(options.days) {
                if(certificate.valid_to) {
                    var certificateExpirationTimestamp = new Date(certificate.valid_to).getTime();
                    var maxAlloweExpirationTimestamp = new Date().getTime() + (+options.days * 86400 * 1000);

                    checkResult.text = 'Certificate expire ' + certificate.valid_to;
                                        
                    if(maxAlloweExpirationTimestamp >= certificateExpirationTimestamp) {
                        return errorCb(checkResult);
                    } else {
                        return successCb(checkResult);
                    }
                }
            } {
                return successCb(checkResult);
            }
        } else {
            checkResult.text = 'Invalid certificate';
            return errorCb(checkResult);
        }
    });
}
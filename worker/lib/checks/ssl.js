import { parse as urlParse } from 'url';
import { connect } from 'tls';

const localJobinfo = {
    timeout: 10000,
    url: '',
    // days: 100,    
    days: 32,    
};


/**
 * Check if the certificate data you set with the domain Name
 * 
 * @param {PeerCertificate} certificate 
 * @param {string} domainName 
 */
function checkDomainsMatchCertificate(certificate, checkDomainName) {
    checkDomainName = checkDomainName.toLowerCase();

    let mainCertDomain = certificate.subject.CN.toLowerCase();

    if(checkDomainName.toLowerCase() != mainCertDomain){

        if(certificate.subjectaltname) {
            let certAlternativeNames = certificate.subjectaltname.toLowerCase();

            if(certAlternativeNames.indexOf(checkDomainName) >= 0) {
                return true;
            }
        }
    
    } else {
        return true;
    }

    return false;
}

export default function(jobData, successCb, errorCb) {

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

    const startTime = new Date().getTime();

    try {
        let socket = connect(connectOptions, () => {
            checkResult.latency = ((new Date().getTime())  - startTime);

            if(socket.authorized === true) {
                let certificate = socket.getPeerCertificate();

                if(certificate && certificate.subject) {
                    checkResult.valid = true;

                    checkResult.domainmatch = checkDomainsMatchCertificate(certificate, destination.hostname);
                }

                if(checkResult.domainmatch === false) {
                    checkResult.text = 'Domain does not match';
                    return errorCb(checkResult);
                }

                if(options.days) {
                    if(certificate.valid_to) {
                        const certificateExpirationTimestamp = new Date(certificate.valid_to).getTime();
                        const maxAlloweExpirationTimestamp = new Date().getTime() + (+options.days * 86400 * 1000);

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
    } catch (e) {
        checkResult.text = e.toString();
        return errorCb(checkResult);
}
}
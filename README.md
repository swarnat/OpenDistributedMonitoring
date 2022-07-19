
# Open Distributed Monitoring

```
This project is a Proof of Concept and a playground for some nodejs libraries. Regardless it is fully usable.
```

This is a distributed Monitoring Software based on NodeJS, [BullMQ](https://github.com/taskforcesh/bullmq) and Redis.  
It allows to easily connect multiple monitoring workers to a central Redis, which is managed by phantastic [BullMQ](https://github.com/taskforcesh/bullmq).  

This repository contains controller and workers. The controller only needs to executed once. Worker can executed multiple times.  

Currenctly only a notification into a slack/matrix channel over webhooks is implemented.  
Also there is currently only one check type: ssl certificate verification  

## Features

### Currenctly available checks

  - **ssl** - SSL Certificateion verification
  
### Currenctly available notifications
  
  - Slack / Matrix Webhooks
    
### Admin API Docs

https://github.com/swarnat/OpenDistributedMonitoring/wiki

## Report View

You can open the following URL within your Browser to get an overview about all checks: {host}:{port}/check/all/report  
The credentials to access this page, can be configured within config.js.


## Setup Controller

Clone the repository and go into **controller**. There you need to clone config.dist.js to config.js and fill required information for mysql database, redis server and slack webhook.  
Optionally you can change UUID_NAMESPACE, for all generated v5 UUIDs and listing http_port for HTTP admin API.
If you want to have HTTPs support, please use a reverse proxy in front of the HTTP Api.

After configuration was done, execute one time `node install.js` to configure database or import database.sql into database.  

## Setup Worker

Clone the repository and go into **worker**. There you need to clone config.dist.js to config.js and fill required information for redis server.  
This is needed to send the results of checks back to controller.  

## Roadmap

  - Additional check types like SMTP, HTTPContent, IMAP, Ping, DNS
  - Additional notification types like E-Mail, Pushover

import mysql from './mysql.js';
import configuration from '../config.js';
import dayjs from 'dayjs'

import axios from 'axios';
import logger from './log.js';
import { v5 as uuidv5 } from 'uuid';
import randomString from './randomString.js';

let checkData = {};

export default {
  async updateRepeatJobKey(checkId, repeatJobKey) {
    let connection = mysql.getConnection();

    let sql = 'UPDATE checks SET repeat_job_key = ? WHERE id = ?';

    return connection.query(sql, [repeatJobKey, checkId]);
  },

  async markFailed(checkId, checkResponse) {
    let connection = mysql.getConnection();
    
    if(typeof checkData[checkId] == 'undefined') return;

    if(checkData[checkId].status !== 'fail') {
      console.log('Set failed ' + checkId);
      checkData[checkId].status = 'fail';

      let updateSql = 'UPDATE checks SET status = "fail", failed = NOW() WHERE id = ?';
      connection.query(updateSql, [checkId]);

      axios.post(configuration.slack.webhook, {
          "text": "<b>Failed " + checkData[checkId].type.toUpperCase() + " check</b> " + checkData[checkId].title + ' at ' + dayjs(checkResponse.timestamp).format('lll') + "<br/>" + checkResponse.data.text,
          "format": "html",
          "displayName": configuration.slack.displayName,
      });
    }

    let sql = 'UPDATE checks SET last_check = ? WHERE id = ?';
    connection.query(sql, [dayjs(checkResponse.timestamp).format('YYYY-MM-DD HH:mm:ss'), checkId]);
  },

  markSuccess(checkId, checkResponse) {
    let connection = mysql.getConnection();
    if(typeof checkData[checkId] == 'undefined') return;

    if(checkData[checkId].status !== 'success') {
      console.log('Set success ' + checkId + ' from status ' +checkData[checkId].status );

      if(checkData[checkId].status == 'fail') {
        const timeRange = dayjs(checkData[checkId].failed).fromNow(true);

        console.log('recover ' + checkId + ' after ' + timeRange);

        axios.post(configuration.slack.webhook, {
          "text": "<b>Recover " + checkData[checkId].type.toUpperCase() + " check</b> " + checkData[checkId].title + ' at ' + dayjs(checkResponse.timestamp).format('lll') + " after being down for " + timeRange,
          //"text": "<b>Recover check</b> " + checkData[checkId].title + '<br/>after ' + timeRange,
          "format": "html",
          "displayName": configuration.slack.displayName,
      });        
      }
      checkData[checkId].status = 'success';

      let updateSQL = 'UPDATE checks SET status = "success", failed = NULL WHERE id = ?';
      connection.query(updateSQL, [checkId]);
    }

    let sql = 'UPDATE checks SET last_check = ? WHERE id = ?';
    connection.query(sql, [dayjs(checkResponse.timestamp).format('YYYY-MM-DD HH:mm:ss'), checkId]);

  },

  addHistory(event) {
    let connection = mysql.getConnection();

    let sql = 'INSERT IGNORE INTO history(checkid, `created`, `status`, `latency`,  `text`) VALUES ?';

    let data = [[
      event.id,
      event.created,
      event.status,
      event.latency,
      event.text
    ]];

    connection.query(sql, [data]);  
  },

  updateCheck(checkId, update) {
    let connection = mysql.getConnection();

    return new Promise((resolve) => {
      let updatableColumns = ['title', 'options', 'interval', 'active'];

      let updateColumns = {};

      for(let i of updatableColumns) {
        if(typeof update[i] != 'undefined') updateColumns[i] = update[i];
      }
      
      if(typeof updateColumns.options != 'undefined') {
        updateColumns.options = JSON.stringify(updateColumns.options);
      }

      logger(checkId, 'Update Check');

      connection.query('UPDATE checks SET ? WHERE id = ?', [updateColumns, checkId], 
        (error) => {
          if (error) throw error;

          resolve();
      });
         
    })
  },

  registerJob(checkId) {
    return new Promise((reject) => {
      if(typeof checkData[checkId] == 'undefined') {
        reject('Check ID not found');
      }
    });
  },

  addCheck(update) {
      let connection = mysql.getConnection();

      return new Promise((resolve, reject) => {
        try {        
          let updatableColumns = ['title', 'options', 'interval', 'active', 'type'];

          let updateColumns = {
            title: 'New Check',
            active: 0,
            interval: "0 0 0 * * *",
            options: {},
            repeat_job_key: '',
          };

          for(let i of updatableColumns) {
            if(typeof update[i] != 'undefined') updateColumns[i] = update[i];
          }
          
          if(typeof updateColumns.type === 'undefined') {
            reject('No type set');
            return;
          }

          updateColumns.options = JSON.stringify(updateColumns.options);

          updateColumns.id = uuidv5(randomString(), configuration.UUID_NAMESPACE);
          
          logger(updateColumns.id, 'Add Check');

          connection.query('INSERT INTO checks SET ?', [updateColumns], 
            async (error) => {
              if (error) throw error;

              resolve(updateColumns.id);
          });
        } catch (e) {
          console.log(e);
        }
      })

  },

  deleteCheck(checkId) {
    let connection = mysql.getConnection();

    logger(checkId, 'Delete Check');

    return new Promise((resolve) => {
      let sql = `DELETE FROM checks WHERE id = ?`;

      connection.query(sql, [checkId], (error) => {
        if (error) {
          return console.error(error.message);
        }

        resolve();
      });          
    })

  },

  getHistory(checkId) {
    let connection = mysql.getConnection();

    return new Promise((resolve) => {
      let sql = `SELECT * FROM history WHERE checkid = ? ORDER BY created DESC LIMIT 500`;

      connection.query(sql, [checkId], (error, results) => {
        if (error) {
          return console.error(error.message);
        }

        resolve(results);
      });          
    })

  },

  getCheck(checkId) {
    let connection = mysql.getConnection();

    return new Promise((resolve) => {
      let sql = `SELECT * FROM checks WHERE id = ?`;

      connection.query(sql, [checkId], (error, results) => {
        if (error) {
          return console.error(error.message);
        }

        for(let check of results) {
          check.options = JSON.parse(check.options);
          checkData[check.id] = check;
        }
        
        resolve(checkData[checkId]);
      });          
    })

  },

  getChecks() {
    let connection = mysql.getConnection();

      return new Promise((resolve) => {
        let sql = `SELECT * FROM checks ORDER BY title`;

        connection.query(sql, (error, results) => {
          if (error) {
            return console.error(error.message);
          }

          for(let check of results) {
            check.options = JSON.parse(check.options);
            checkData[check.id] = check;
          }
          
          resolve(results);
        });          
      })
  }
}
import mysql from "./mysql.js";
import { v5 as uuidv5 } from 'uuid';
import crypto from 'crypto';

import configuration from '../config.js';
import randomString from "./randomString.js";
import dayjs from "dayjs";
import logger from "./log.js";

export default {
    
    addToken(token, expire) {
        let connection = mysql.getConnection();

        return new Promise(resolve => {
            let data = {
                id: uuidv5(randomString(), configuration.UUID_NAMESPACE),
                token: crypto.createHash('sha256').update(token).digest('hex'),
            };

            if(typeof expire != 'undefined') {
                data.expire = dayjs(expire).format('YYYY-MM-DD HH:mm:ss');
            }

            logger('AUTH', 'Add Tokenhash ' + data.token);

            connection.query('INSERT INTO apitoken SET ?', [data], (error) => {
                    if (error) throw error;
      
                    resolve();
                });
      
      });

    },
    
    deleteToken(hash) {
        let connection = mysql.getConnection();

        return new Promise(resolve => {
            if(typeof expire != 'undefined') {
                data.expire = dayjs(expire).format('YYYY-MM-DD HH:mm:ss');
            }

            logger('AUTH', 'Delete Token ' + hash);
            connection.query('DELETE FROM apitoken WHERE token = ?', [hash], (error) => {
                    if (error) throw error;
      
                    resolve();
                });
      
      });

    },

}
import configuration from '../config.js';
import mysql from 'mysql';


let connection = mysql.createConnection(configuration.database);

export default {
      
  connect() {
    return new Promise((resolve) => {
      connection.connect(function(err) {
        if (err) {
          return console.error('error: ' + err.message);
        }
      
        console.log('Connected to the MySQL server.');
        resolve();
      });
    });
  },

  getConnection() {
    return connection;
  }

}
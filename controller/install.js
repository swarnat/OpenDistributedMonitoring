import mysql from "./lib/mysql.js";

mysql.connect().then(function() {
    let connection = mysql.getConnection();

    console.log('# Install Database Tables');

    console.log('  - Table: checks');

    connection.query(`CREATE TABLE IF NOT EXISTS \`checks\` (
        \`id\` char(37) NOT NULL,
        \`status\` enum('open','success','fail') NOT NULL,
        \`type\` varchar(20) NOT NULL,
        \`title\` varchar(255) NOT NULL,
        \`options\` text NOT NULL,
        \`interval\` varchar(40) NOT NULL,
        \`failed\` datetime NOT NULL,
        \`active\` tinyint(4) NOT NULL,
        \`repeat_job_key\` varchar(100) NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`);

      console.log('  - Table: history');      

      connection.query(`CREATE TABLE IF NOT EXISTS \`history\` (
        \`checkid\` char(37) NOT NULL,
        \`created\` datetime NOT NULL,
        \`status\` enum('success','fail') NOT NULL,
        \`latency\` mediumint(8) unsigned NOT NULL,
        \`text\` varchar(60) NOT NULL,
        PRIMARY KEY (\`checkid\`,\`created\`),
        CONSTRAINT \`history_ibfk_1\` FOREIGN KEY (\`checkid\`) REFERENCES \`checks\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB`);      

      console.log('  - Table: apitoken');      
      
      connection.query(`CREATE TABLE IF NOT EXISTS \`apitoken\` (
        \`id\` varchar(42) NOT NULL,
        \`token\` varchar(66) NOT NULL,
        \`expire\` datetime DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`token\` (\`token\`)
      ) ENGINE=InnoDB`);

      // Token: OpenDistributedMonitoring
      connection.query(`INSERT IGNORE INTO`apitoken` SET id = UUID(), token = "93c17c6d5319e19c34eeff5c9c03706ad53e5c08e8adc3c15eefcc5b0eb3d874", expire = NULL`);

      connection.end();
});
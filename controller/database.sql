CREATE TABLE `apitoken` (
  `id` varchar(42) NOT NULL,
  `token` varchar(66) NOT NULL,
  `expire` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `checks` (
  `id` char(37) NOT NULL,
  `status` enum('open','success','fail') NOT NULL,
  `type` varchar(20) NOT NULL,
  `title` varchar(255) NOT NULL,
  `options` text NOT NULL,
  `interval` varchar(40) NOT NULL,
  `failed` datetime NOT NULL,
  `active` tinyint(4) NOT NULL,
  `repeat_job_key` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `history` (
  `checkid` char(37) NOT NULL,
  `created` datetime NOT NULL,
  `status` enum('success','fail') NOT NULL,
  `latency` mediumint(8) UNSIGNED NOT NULL,
  `text` varchar(60) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `apitoken`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`);

ALTER TABLE `checks`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `history`
  ADD PRIMARY KEY (`checkid`,`created`);  

ALTER TABLE `history`
  ADD CONSTRAINT `history_ibfk_1` FOREIGN KEY (`checkid`) REFERENCES `checks` (`id`) ON DELETE CASCADE;

/**
 * Created by barrett on 8/28/14.
 */

var mysql = require('mysql');
var dbconfig = require('../config/database');

var connection = mysql.createConnection(dbconfig.connection);

//connection.query('CREATE DATABASE ' + dbconfig.database);

connection.query('\
CREATE TABLE `' + dbconfig.database + '`.`' + dbconfig.users_table + '` ( \
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    `username` VARCHAR(20) NOT NULL, \
    `password` CHAR(60) NOT NULL, \
        PRIMARY KEY (`id`), \
    UNIQUE INDEX `id_UNIQUE` (`id` ASC), \
    UNIQUE INDEX `username_UNIQUE` (`username` ASC) \
)');
connection.query('\
CREATE TABLE `' + dbconfig.database + '`.`' + dbconfig.scores_table + '` ( \
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    `user_id` INT NULL, \
    `win` INT NULL, \
    `tournament` TINYINT NULL, \
    `date` DATETIME NULL, \
        PRIMARY KEY (`id`) \
)');

console.log('Success: Database Created!');

connection.end();

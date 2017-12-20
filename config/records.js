var dbconfig = require('./database');
var mysql = require('mysql');
var connection = mysql.createConnection(dbconfig.connection);

connection.query('USE ' + dbconfig.database);

exports.save=function (user_id,win,tournamanet){
    var values=[user_id,win,tournamanet,new Date()];

    connection.query('INSERT INTO scores(user_id,win,tournament,date) VALUES(?,?,?,?)',values,function (err,result) {
        if (err) throw err;

    });
};
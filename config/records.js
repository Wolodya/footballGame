var dbconfig = require('.config/database.js');
var connection = mysql.createConnection(dbconfig.connection);

connection.query('USE ' + dbconfig.database);

exports.save=function (id,is_win,is_tournamanet,done){
    var values=[id,score,new Date().toISOString()];

    connection.query('INSERT INTO results(user_id,win,tournament,date) VALUES(?,?,?,?)',values,function (err,result) {
        if (err) throw err;
        done(null, result.insertId);
    });
};
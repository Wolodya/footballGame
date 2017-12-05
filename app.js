const express = require("express");
const http = require("http");
const path = require("path");
const events = require("events");

var socket = require("socket.io");

var app = express();
var server = http.createServer(app).listen(8080);
var io = socket.listen(server);
app.use("/static", express.static(__dirname + "/static"));
app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "index.html"));
});

let players = {};

io.on("connection", function (socket) {


    socket.on('create', function (name) {

        let gameid = (Math.random() * 100000 ) | 0;
        console.log(players);
        socket.room = gameid;
        //create player
        players[gameid] = {};
        players[gameid][socket.id] = new Player(100, 250, "red", name);

        //join to room
        socket.join(gameid);
        socket.emit('new_game', gameid, socket.id);

    });
    socket.on('join', function (gameid, name) {

        if (io.nsps["/"].adapter.rooms[gameid].length > 1) {
            socket.emit('full', 'room is full! create a new one');
        } else {

            players[gameid][socket.id] = new Player(600, 250, "blue", name);
            players[gameid].ball = new Ball(350, 250, "black");
            //join second player after join btn pressed
            socket.room = gameid;
            socket.join(gameid);
            socket.emit('join_game', gameid, socket.id);
            //send start to all sockets in room
            io.to(gameid).emit('start', gameid, players);
        }
    });
    socket.on('disconnect', function () {

        if (players[socket.room]) {
            socket.leave(socket.room);

            if (Object.keys(players[socket.room]).length < 3) {
                delete players[socket.room];
            } else {
                delete players[socket.room][socket.id];
                io.to(socket.room).emit('leave');
            }


            //if one player closes page another will automatially win
            io.to(socket.room).emit('leave');
            console.log(players);
        }

    });
    socket.on('leave_room', function () {

        socket.leave(socket.room);

        if (Object.keys(players[socket.room]).length < 3) {
            delete players[socket.room];
        } else {
            delete players[socket.room][socket.id];
            io.to(socket.room).emit('leave');
        }


    });
    //game logic
    socket.on('press', function (gameid, id, movement) {

        //check keyboard status
        if (movement.up) {
            if (players[gameid][id].yVel > -players[gameid][id].maxSpeed) {
                players[gameid][id].yVel -= players[gameid][id].accel;
            } else {
                players[gameid][id].yVel = -players[gameid][id].maxSpeed;
            }
         }
            else {
            if (players[gameid][id].yVel < 0) {
                players[gameid][id].yVel += players[gameid][id].decel;
                if (players[gameid][id].yVel > 0) players[gameid][id].yVel = 0;
            }
        }
        if (movement.down) {
            if (players[gameid][id].yVel < players[gameid][id].maxSpeed) {
                players[gameid][id].yVel += players[gameid][id].accel;
            } else {
                players[gameid][id].yVel = players[gameid][id].maxSpeed;
            }
        } else {
            if (players[gameid][id].yVel > 0) {
                players[gameid][id].yVel -= players[gameid][id].decel;
                if (players[gameid][id].yVel < 0) players[gameid][id].yVel = 0;
            }
        }
        if (movement.left) {
            if (players[gameid][id].xVel > -players[gameid][id].maxSpeed) {
                players[gameid][id].xVel -= players[gameid][id].accel;
            } else {
                players[gameid][id].xVel = -players[gameid][id].maxSpeed;
            }
        } else {
            if (players[gameid][id].xVel < 0) {
                players[gameid][id].xVel += players[gameid][id].decel;
                if (players[gameid][id].xVel > 0) players[gameid][id].xVel = 0;
            }
        }
        if (movement.right) {
            if (players[gameid][id].xVel < players[gameid][id].maxSpeed) {
                players[gameid][id].xVel += players[gameid][id].accel;
            } else {
                players[gameid][id].xVel = players[gameid][id].maxSpeed;
            }
        } else {
            if (players[gameid][id].xVel > 0) {
                players[gameid][id].xVel -= players[gameid][id].decel;
                if (players[gameid][id].xVel < 0) players[gameid][id].xVel = 0;
            }
        }
        //io.to(gameid).emit('move', gameid, players);

    });
    socket.on('p_bounds', function (gameid, id, w, h) {
        //check player bounds
        if (players[gameid][id].x + players[gameid][id].size > w) {
            players[gameid][id].x = w - players[gameid][id].size;
            players[gameid][id].xVel *= -0.5;
        }
        if (players[gameid][id].x - players[gameid][id].size < 0) {
            players[gameid][id].x = 0 + players[gameid][id].size;
            players[gameid][id].xVel *= -0.5;
        }
        if (players[gameid][id].y + players[gameid][id].size > h) {
            players[gameid][id].y = h - players[gameid][id].size;
            players[gameid][id].yVel *= -0.5;
        }
        if (players[gameid][id].y - players[gameid][id].size < 0) {
            players[gameid][id].y = 0 + players[gameid][id].size;
            players[gameid][id].yVel *= -0.5;
        }
    });
    socket.on('b_bounds', function (gameid, w, h) {
        var keys = Object.keys(players[gameid]);

        if (players[gameid].ball.x + players[gameid].ball.size > w) {
            if (players[gameid].ball.y > 150 && players[gameid].ball.y < 350) {
                players[gameid][keys[0]].score++;
                reset(keys, players[gameid]);
                return;
            }
            players[gameid].ball.x = w - players[gameid].ball.size;
            players[gameid].ball.xVel *= -1.5;
        }
        if (players[gameid].ball.x - players[gameid].ball.size < 0) {
            if (players[gameid].ball.y > 150 && players[gameid].ball.y < 350) {
                players[gameid][keys[1]].score++;
                reset(keys, players[gameid]);
                return;
            }
            players[gameid].ball.x = 0 + players[gameid].ball.size;
            players[gameid].ball.xVel *= -1.5;
        }
        if (players[gameid].ball.y + players[gameid].ball.size > h) {
            players[gameid].ball.y = h - players[gameid].ball.size;
            players[gameid].ball.yVel *= -1.5;
        }
        if (players[gameid].ball.y - players[gameid].ball.size < 0) {
            players[gameid].ball.y = 0 + players[gameid].ball.size;
            players[gameid].ball.yVel *= -1.5;
        }
    });
    socket.on('collision', function (gameid, id) {
        var p1_ball_distance = getDistance(players[gameid][id].x, players[gameid][id].y, players[gameid].ball.x, players[gameid].ball.y) - players[gameid][id].size - players[gameid].ball.size;
        if (p1_ball_distance < 0) {
            collide(players[gameid].ball, players[gameid][id]);
        }
        //check collision between players
        var keys = Object.keys(players[gameid]);

        var p_distance = getDistance(players[gameid][keys[0]].x, players[gameid][keys[0]].y, players[gameid][keys[1]].x, players[gameid][keys[1]].y) - players[gameid][keys[0]].size - players[gameid][keys[1]].size;
        if (p_distance < 0) {
            collide(players[gameid][keys[0]], players[gameid][keys[1]]);
        }

    });
    socket.on('p_move', function (gameid, id) {
        players[gameid][id].x += players[gameid][id].xVel;
        players[gameid][id].y += players[gameid][id].yVel;
    });
    socket.on('b_move', function (gameid) {
        if (players[gameid].ball.xVel !== 0) {
            if (players[gameid].ball.xVel > 0) {

                players[gameid].ball.xVel -= players[gameid].ball.decel;
                if (players[gameid].ball.xVel < 0) players[gameid].ball.xVel = 0;
            } else {
                players[gameid].ball.xVel += players[gameid].ball.decel;
                if (players[gameid].ball.xVel > 0) players[gameid].ball.xVel = 0;
            }
        }
        if (players[gameid].ball.yVel !== 0) {
            if (players[gameid].ball.yVel > 0) {
                players[gameid].ball.yVel -= players[gameid].ball.decel;
                if (players[gameid].ball.yVel < 0) players[gameid].ball.yVel = 0;
            } else {
                players[gameid].ball.yVel += players[gameid].ball.decel;
                if (players[gameid].ball.yVel > 0) players[gameid].ball.yVel = 0;
            }
        }
        players[gameid].ball.x += players[gameid].ball.xVel;
        players[gameid].ball.y += players[gameid].ball.yVel;
    });
    socket.on('win', function (gameid) {
        if (players[gameid][socket.id].score === 2) {
            io.to(gameid).emit('winner', players, gameid, socket.id);
            //   socket.broadcast.to(gameid).emit('looser',players,gameid,socket.id);

        }
    });
    socket.on('win_tournament',function (gameid,round) {
        if (players[gameid][socket.id].score === 5) {
            players[gameid][socket.id].win_rounds=1+ players[gameid][socket.id].win_rounds;
            console.log( players[gameid][socket.id].win_rounds);
            io.to(gameid).emit('winner_round', players, gameid, socket.id);
            //   socket.broadcast.to(gameid).emit('looser',players,gameid,socket.id);

        }
    })

});


setInterval(function () {
    io.sockets.emit("state", players);
}, 1000 / 60);

//classes
function Player(x, y, color, name) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = 20;
    this.xVel = 0;
    this.yVel = 0;
    this.score = 0;
    this.accel = 0.55;
    this.decel = 0.55;
    this.maxSpeed = 3;
    this.name = name;
    this.win_rounds=0;
}

function Ball(x, y, color) {
    this.x = x;
    this.y = y;
    this.xVel = 0;
    this.yVel = 0;
    this.decel = 0.1;
    this.size = 5;
    this.color = color;
}

function collide(cir1, cir2) {
    var dx = (cir1.x - cir2.x) / (cir1.size);
    var dy = (cir1.y - cir2.y) / (cir1.size);

    cir2.xVel = -dx;
    cir2.yVel = -dy;
    cir1.xVel = dx;
    cir1.yVel = dy;

}

function getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

function reset(keys, players) {

    let name1 = players[keys[0]].name;
    let sc1 = players[keys[0]].score;
    players[keys[0]] = new Player(100, 250, "red", name1);
    players[keys[0]].score = sc1;
    let name2 = players[keys[1]].name;
    let sc2 = players[keys[1]].score;
    players[keys[1]] = new Player(600, 250, "blue", name2);
    players[keys[1]].score = sc2;
    players.ball = new Ball(350, 250, "black");
}


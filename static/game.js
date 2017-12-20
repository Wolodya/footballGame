let socket = io();
window.game = 0;
window.win = false;
window.tournament = false;
window.round = 1;

$('#leave').hide();
//graphics
var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");

var movement = {
    up: false,
    down: false,
    left: false,
    right: false

};


initGame();

//create a new player and join it to a new room
$('#create').click(function () {
    let name = $('#nameCreate').val();
    let tournament = $('#is_tournament').is(':checked');

    socket.emit('create', name, tournament);

    $('#create').hide();
    $('#create_game_modal').hide();
    $('#is_tournament').hide();
    $('#check').hide();
    $('#join_game_modal').hide();
    $('#leave').show();

});


//leave current room and create new
$('#leave').click(function () {

    console.log('you left the room. Create or join a new one');
    socket.emit('leave_room');

    $('#create').show();
    $('#create_game_modal').show();
    $('#is_tournament').show();
    $('#check').show();
    $('#join_game_modal').show();
    $('#leave').hide();

    window.game = 0;
    window.tournament = false;
});


//join a player by id in input
$('#join').click(function () {
    let gameid = $('#id_room_join').val();
    let name = $('#nameJoin').val();

    $('#join').hide();
    $('#create_game_modal').hide();
    $('#is_tournament').hide();
    $('#check').hide();
    $('#join_game_modal').hide();
    $('#leave').show();
    socket.emit('join', gameid, name);
    //window.tournament=true;

});
//notify room that game started
socket.on('new_game', function (gameid, id) {
    $('#id_room').val(gameid);
    $('#id_room_tour').val(gameid);
    console.log("room " + gameid + "player " + id + ". game_started");


});

//notify that joined player connected
socket.on('join_game', function (gameid, id) {
    console.log("room " + gameid + "player " + id + ". game_joined");

});
//notify a user when requested room is full
socket.on('full', function (text) {
    console.log(text);
});

//start game after 2 player connected
socket.on('start', function (gameid, players) {
    console.log('game started');
    window.game = gameid;
    if (players[gameid].tournament) {
        window.tournament = true;
    }
    renderPlayers(gameid, players);
});
//end game when one of players leave
socket.on('leave', function () {
    console.log("you win!");
    window.game = 0;
    window.tournament = false;
    $('#p1').text("");
    $('#p2').text("");
    $('#round').text("");
});
socket.on('forbid_create', function (message) {

    console.log(message);

});

function initGame() {

    renderField();
    renderGates();

}

socket.on('winner', function (players, gameid, id) {
    alert(players[gameid][id].name + " win!!");
    window.game = 0;
    window.tournament = false;
    console.log(players[gameid][id].name + " win!!Score: " + players[gameid][id].score);
    $('#p1').text("");
    $('#p2').text("");
    $('#round').text("");
    //socket.emit('disconnect');
});
socket.on('winner_round', function (players, gameid, id) {
    console.log(players[gameid][id].name + " win round!!Score: " + players[gameid][id].score);
    window.round += 1;
});
socket.on('state', function (players) {
    clear();
    initGame();
    if (window.game !== 0) {

        //change velocity on wasd press
        socket.emit('press', window.game, socket.id, movement);
        //check player bounds
        socket.emit('p_bounds', window.game, socket.id, canvas.width, canvas.height);
        //check ball bounds
        socket.emit('b_bounds', window.game, canvas.width, canvas.height);
        //check collision between players and ball
        socket.emit('collision', window.game, socket.id);
        //move players
        socket.emit('p_move', window.game, socket.id);
        //move ball
        socket.emit('b_move', window.game);
        //check winner
        if (window.tournament === true) {
            socket.emit('win_tournament', window.game, window.round);

        } else {
            socket.emit('win', window.game);
        }

        //render all in room
        renderPlayers(window.game, players);
    }
//1000000$ per dAY /0
});

function renderField() {
    context.save();
    context.fillStyle = "#66aa66";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "rgba(255,255,255,0.6)";
    context.beginPath();
    context.arc(canvas.width / 2, canvas.height / 2, 150, 0, Math.PI * 2);
    context.closePath();
    context.lineWidth = 10;
    context.stroke();
    context.restore();
}

function renderGates() {
    context.save();
    context.beginPath();
    context.moveTo(0, 150);
    context.lineTo(0, 350);
    context.strokeStyle = "red";
    context.lineWidth = 10;
    context.stroke();
    context.closePath();
    context.beginPath();
    context.moveTo(canvas.width, 150);
    context.lineTo(canvas.width, 350);
    context.strokeStyle = "blue";
    context.lineWidth = 10;
    context.stroke();
    context.closePath();
    context.restore();
}

function clear() {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

function renderPlayers(gameid, players) {


    context.save();
    //render ball,players for room
    for (var player in players[gameid]) {
        context.fillStyle = players[gameid][player].color;
        context.beginPath();
        context.arc(players[gameid][player].x, players[gameid][player].y, players[gameid][player].size, 0, Math.PI * 2);
        context.fill();
        context.closePath();
    }


    context.restore();
    var keys = Object.keys(players[gameid]);
    //  console.log(players);
    if (window.tournament) {
        //show round
    }
    $('#p1').text("Player " + players[gameid][keys[0]].name + "  Score: " + players[gameid][keys[0]].score);
    $('#p2').text("Player " + players[gameid][keys[2]].name + " Score: " + players[gameid][keys[2]].score);
    if (window.tournament) {
        $('#round').text("round: " + window.round);
    }
    // out.innerHTML = "Player " + players[gameid][keys[0]].name + "  Score: " + players[gameid][keys[0]].score + "<br>Player " + players[gameid][keys[1]].name + " Score: " + players[gameid][keys[1]].score;
}


document.addEventListener("keydown", function (event) {
    switch (event.keyCode) {
        case 65:
            movement.left = true;
            break;
        case 87:
            movement.up = true;
            break;
        case 68:
            movement.right = true;
            break;
        case 83:
            movement.down = true;
            break;
    }
    if (game !== 0) {
        socket.emit('press', game, socket.id, movement);
    }
});

document.addEventListener("keyup", function (event) {
    switch (event.keyCode) {
        case 65:
            movement.left = false;
            break;
        case 87:
            movement.up = false;
            break;
        case 68:
            movement.right = false;
            break;
        case 83:
            movement.down = false;
            break;
    }
});

function showButton() {
    $('leave').css('display', 'block');
}

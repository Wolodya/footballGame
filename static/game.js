let socket = io();
window.game = 0;
window.win = false;
window.tournament = false;
window.round = 0;

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
    socket.emit('create', name);

});
//create tournamnent
$('#create_tournament').click(function () {
    let name = $('#nameTournament').val();
    socket.emit('create', name);
    window.tournament = true;
});

//leave current room and create new
$('#leave').click(function () {

    console.log('you left the room. Create or join a new one');

    socket.emit('leave_room');
    showAllButtons();

    window.game = 0;
});

function showAllButtons() {
    $('#leave').hide();
    $('#create').show();
    $('#create_game_modal').show();
    $('#join').show();
    $('#join_game_modal').show();
    $('#create_tournament').show();
    $('#create_tournament_modal').show();
}

function hideAllButtonsJoin() {
    $('#leave').show();
    $('#join').hide();
    $('#join_game_modal').hide();
    $('#create_game_modal').hide();
    $('#create_tournament_modal').hide();
}

function hideAllButtonsCreate() {
    $('#leave').show();
    $('#join').hide();
    $('#join_game_modal').hide();
    $('#create_game_modal').hide();
    $('#create').hide();
    $('#create_tournament_modal').hide();
    $('#create_tournament').hide();
}


//join a player by id in input
$('#join').click(function () {
    let gameid = $('#id_room_join').val();
    let name = $('#nameJoin').val();
    hideAllButtonsJoin();
    socket.emit('join', gameid, name);
    window.tournament=true;

});
//notify room that game started
socket.on('new_game', function (gameid, id) {
    $('#id_room').val(gameid);
    $('#id_room_tour').val(gameid);
    console.log("room " + gameid + "player " + id + ". game_started");

    hideAllButtonsCreate();

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

    renderPlayers(gameid, players);
});
//end game when one of players leave
socket.on('leave', function () {
    console.log("you win!");
    window.game = 0;
    window.tournament=false;
    $('#p1').text("");
    $('#p2').text("");
});
socket.on('forbid_create', function (message) {

    console.log(message);

});

function initGame() {

    renderField();
    renderGates();

}

socket.on('winner', function (players, gameid, id) {
    //$('#cn').hide();
    //  $('#out').hide();
    //   $('#main').innerHTML = "You win!!Your score: " + players[gameid][id].score;
    console.log(players[gameid][id].name + " win!!Score: " + players[gameid][id].score);
    window.game = 0;
    //socket.emit('disconnect');
});
socket.on('winner_round',function (players, gameid, id) {
    console.log(players[gameid][id].name + " win round!!Score: " + players[gameid][id].score);
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
            socket.emit('win_tournament', window.game);
            console.log('1 round');
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
    if (window.tournament) {
        //show round
    }
    $('#p1').text("Player " + players[gameid][keys[0]].name + "  Score: " + players[gameid][keys[0]].score);
    $('#p2').text("Player " + players[gameid][keys[1]].name + " Score: " + players[gameid][keys[1]].score);

    // out.innerHTML = "Player " + players[gameid][keys[0]].name + "  Score: " + players[gameid][keys[0]].score + "<br>Player " + players[gameid][keys[1]].name + " Score: " + players[gameid][keys[1]].score;
}

function checkWin(players, gameid) {


    for (var player in players[gameid]) {
        if (players[gameid][player].score === 2) {

        }
    }


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

var express = require('express');
var app = express();

app.use(express.static('public'))

var http = require('http').Server(app);
var port = process.env.PORT || 3000;

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/public/index.html');
});

http.listen(port, function() {
	console.log('listening on port '+port);
});


var io = require('socket.io')(http);

var playerQueue = [];
var unfilledRooms = [];
var fullRooms = [];
var currentGames = [];
var player = 0;
io.on('connection', function(socket) {
	console.log('new connection: ', socket.id);
	socket.on('move', function(msg) {
		let theRoom;
		for (const room of socket.rooms) {
			if (room.slice(0,5) == 'room-') theRoom = room;
		}
		socket.to(theRoom).emit('move', msg);
	});

	socket.on('play', function(msg) {
		if ((playerQueue.length > 0 && socket.id == playerQueue[0].player) || socket.rooms.size > 1) return
		if (playerQueue.length > 0) {
			let whitePlayer = playerQueue[0].player;
			let blackPlayer = socket.id;
			let time = playerQueue[0].timeControl;
			let incr = playerQueue[0].increment;
			currentGames.push({room: playerQueue[0].player, white: whitePlayer, black: blackPlayer, timeControl: time, increment: incr});
			let roomNumber = playerQueue.shift().player;
			socket.join('room-'+roomNumber);
			fullRooms.push('room-'+roomNumber);

			unfilledRooms = unfilledRooms.filter(function currentRoom(room) {room==('room-'+roomNumber)});
			io.to('room-'+roomNumber).emit('start', {room: ('room-'+roomNumber), white: whitePlayer, black: blackPlayer, timeControl: time, increment: incr});
		}
		else {
			socket.join('room-'+socket.id);
			playerQueue.push({player: socket.id, timeControl: msg.timeControl, increment: msg.increment});
			unfilledRooms.push('room-'+socket.id);
		}

	});

	socket.on('game_over', function(game_info) {
		fullRooms = fullRooms.filter(function currentRoom(room) {room==('room-'+socket.id)});
		currentGames = currentGames.filter(function currentGame(game) {game.white==socket.id});
	});

	socket.on('leave', function(room) {
		socket.leave(room);
	});

	socket.on('disconnecting', function() {
		playerQueue = playerQueue.filter(function isPlayer(disconnectingPlayer) {disconnectingPlayer.player == socket.id});
	});
});
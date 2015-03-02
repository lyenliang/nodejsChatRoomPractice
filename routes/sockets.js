var io = require('socket.io');
var userList = [];

function inArray(clients, target) {
	// for ( c in clients) {
	for(var i = 0; i < clients.length; i++) {
		if (clients[i] == target) {
			return true;
		}
	}
	return false;
}

function isNameDuplicated(room, name) {
	console.log('pRoom: ' + room);
	console.log('pName: ' + name);
	return inArray(userList['room_'+room], name);
}

exports.init = function(server) {
	console.log('Server initialized');
	io = io.listen(server);

	// run when a socket is created
	io.use(function(socket, next) {
		var data = socket.request;
		if(data.headers.cookie) {
			data.cookie = require('cookie').parse(data.headers.cookie);
			//data.sessionID = data.cookie['express.sid'].split('.')[0];
			data.sessionID = data.cookie['io'];
			data.nickname = data.cookie['nickname'];
		} else {
			console.log('no cookie');
			next(new Error('No cookie transmitted.'));
		}
		next();
	});
	var self = this;
	this.chatInfra = io.of('/');
	this.chatCom = io.of('/');

	this.chatInfra.on('connection', function(socket) {
		console.log('chatInfra on connection!');
		// #4

		socket.on('check_duplicate', function(data) {
			console.log('check_duplicate_name');		
			if(isNameDuplicated(data.room, data.name)) {
				socket.emit('name_duplicated', {
					name: data.name
				});
			} else {
				socket.emit('name_allowed', {});
			}
		});

		socket.on('join_room', function(room) {
			console.log('join_room name: ' + room.name);
			//console.log('socket.handshake: ' + Object.keys(socket.request));
			var userName = socket.request.nickname;
			//userList.push(userName);
			if(userList[room.name] == null) {
				userList[room.name] = [userName];
			} else {
				userList[room.name].push(userName); // room starts with "room_"
			}	
			// var userName = socket.username;
			//console.log('socket.handshake: ' + socket.handshake);
			socket.userName = userName;
			socket.emit('name_set', {
				name: userName
			});
			socket.send(JSON.stringify({
				type: 'serverMessage',
				message: 'Welcome to the chat room'
			}));
			socket.join(room.name); 	// _infra joins
			var comSocket = self.chatCom.connected[socket.id];
			//comSocket.join(room.name); 	// _com joins 
			comSocket.room = room.name;
			socket.in(room.name).broadcast.emit('user_entered', {
				name: userName
			});		
		});

		socket.on('get_rooms', function() {
			console.log('get_rooms received');
			var rooms = {};
			//console.log('io.sockets.adapter.rooms: ' + io.sockets.adapter.rooms);
			console.log('Object.keys(io.sockets.adapter.rooms): ' + Object.keys(io.sockets.adapter.rooms));
			//console.log('Object.keys(io.sockets.adapter.rooms)[0]: ' + Object.keys(io.sockets.adapter.rooms)[0]);
			for(var room in io.sockets.adapter.rooms) {
				// a filter 
				if(room.indexOf('room_') == 0) { // room_ room name must starts with "room_"
					// var roomName = room.replace("room_", "");
					// rooms[roomName] = io.sockets.adapter.rooms[room];
					rooms[room] = io.sockets.adapter.rooms[room];
				}
			}
			socket.emit('rooms_list', rooms);
		});

	});

	
	this.chatCom.on('connection', function(socket) {

		console.log('Server on connection');
		// handle client's messages

		socket.on('message', function(message) { // triggered by socket.send
			console.log('server received message');
			message = JSON.parse(message);
			// receive user's message
			if(message.type == 'userMessage') {
				console.log('message.type == userMessage');
				message.username = socket.request.nickname;
				console.log('message.username: ' + message.username);
				// send to all the other clients
				socket.in(socket.room).broadcast.send(JSON.stringify(message));
				// send back the message 
				message.type = 'myMessage';
				socket.send(JSON.stringify(message));
			}
		});

	});
}
var io = require('socket.io');

exports.init = function(server) {
	console.log('Server initialized');
	io = io.listen(server);
	var self = this;
	this.chatInfra = io.of('/chat_infra');
	this.chatCom = io.of('/chat_com');

	this.chatInfra.on('connection', function(socket) {
		
		// #2
		socket.on('set_name', function(data) {
			console.log('data.name: ' + data.name);
			self.chatCom.username = data.name;
			socket.emit('name_set', data); // why send back the message? No JSON.Stringify() ?!?!
			// send a welcome message to the connected client
			socket.send(JSON.stringify({ // handled by socket.on('message', ...
				type: 'serverMessage',
				message: 'Welcome to the chat room made with Express and Socket.io'	
			}));
			socket.broadcast.emit('user_entered', data);
		});

		// #4
		socket.on('join_room', function(room) {
			var userName = self.chatCom.username;
			socket.join(room.name); 	// _infra joins
			var comSocket = self.chatCom.connected[socket.id];
			comSocket.join(room.name); 	// _com joins 
			comSocket.room = room.name;
			socket.in(room.name).broadcast.emit('user_entered', {
				name: userName
			});
		});

		socket.on('get_rooms', function() {
			console.log('get_rooms received');
			var rooms = {};
			console.log('io.sockets.adapter.rooms: ' + io.sockets.adapter.rooms);
			console.log('Object.keys(rooms): ' + Object.keys(rooms));
			for(var room in io.sockets.adapter.rooms) {
				console.log('room: ' + room);
				// a filter 
				if(room.indexOf('/chat_infra/') == 0) { // /chat_infra/ is found
					var roomName = room.replace("/chat_infra/", "");
					rooms[roomName] = io.sockets.adapter.rooms[room];
				}
			}
			socket.emit('rooms_list', rooms);
		});

	});

	
	this.chatCom.on('connection', function(socket) {

		console.log('Server on connection');
		// handle client's messages

		socket.on('message', function(message) { // triggered by socket.send
			console.log('server received messagese');
			message = JSON.parse(message);
			// receive user's message
			if(message.type == 'userMessage') {
				message.username = self.chatCom.username;
				console.log('message.username: ' + message.username);
				// send to all the other clients
				socket.in(socket.room).broadcast.send(JSON.stringify(message));
				// send back the message 
				message.type = 'myMessage';
				socket.send(JSON.stringify(message));
			}
		});

	});

	// chatCom = io.of('/chat_com')

}
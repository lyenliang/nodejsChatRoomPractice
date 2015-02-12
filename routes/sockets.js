var io = require('socket.io');

exports.init = function(server) {
	console.log('Server initialized');
	io = io.listen(server);
	var chatInfra;
	var chatCom;

	chatInfra = io.of('/chat_infra').on('connection', function(socket) {
		socket.on('set_name', function(data) {
			console.log('data.name: ' + data.name);
			chatCom.username = data.name;
			socket.emit('name_set', data); // why send back the message? No JSON.Stringify() ?!?!
			// send a welcome message to the connected client
			socket.send(JSON.stringify({ // handled by socket.on('message', ...
				type: 'serverMessage',
				message: 'Welcome to the chat room made with Express and Socket.io'	
			}));
			socket.broadcast.emit('user_entered', data);
		});
	});

	chatCom = io.of('/chat_com').on('connection', function(socket) {
		console.log('Server on connection');
		// handle client's messages
		socket.on('message', function(message) { // triggered by socket.send
			console.log('server received messagese');
			message = JSON.parse(message);
			// receive user's message
			if(message.type == 'userMessage') {
				message.username = chatCom.username;
				console.log('message.username: ' + message.username);
				// send to all the other clients
				socket.broadcast.send(JSON.stringify(message));
				// send back the message 
				message.type = 'myMessage';
				socket.send(JSON.stringify(message));
			}
		});
	});

}
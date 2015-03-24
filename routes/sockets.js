var io = require('socket.io');
var redis = require('redis');
var redisStore = require('socket.io-redis');
var client = redis.createClient();

var default_db = 0;
var name_pass_db = 1;

var registered_account_key = 'regAccounts';
var guest_account_key = 'guestAccounts';
var accountPass_key = 'accountToPass';

client.on("error", function (err) {
	console.log("Redis Error: " + err);
});

Array.prototype.remove = function(target) {
	for(var i = 0; i < this.length; i++) {
		if(this[i] == target) {
			this.splice(i, 1);
		}
	}
};

function listUsers(group_key) {
	client.smembers(group_key, function(err, result) {
		if(err) {console.log('Error: ' + err)}
		return result;
	});
}

function showData(err, data) {
	if (err) {
		console.log("err:" + err);
	} else {
		console.log("reply:" + data);
	}
}

function removeUser(roomName, userName) {
	client.sismember('roomList', roomName, function(err, result) {
		if (err) {
			console.log('sismember err: ' + err);
			return;
		}
		// user userName is in room roomName
		if(result == 1) {
			client.srem(roomName, userName, redis.print);
			client.srem(guest_account_key, userName, redis.print);
			// ckeck the number of users in the room
			client.scard(roomName, function(err, result) {
				if (err) {
					console.log('scard err: ' + err);
					return;
				}
				if(result == 0) {
					// if the room is empty, remove the room from the list
					client.srem('roomList', roomName, redis.print);
				}
			});
		} 
	});

}

function addUser(roomName, userName) {
	console.log('user ' + userName + ' added to room ' + roomName );
	client.sadd(roomName, userName, redis.print);
	client.sadd('roomList', roomName, redis.print);
}

function validateUser(socket, pAccount, pPass) {
	client.select(name_pass_db, redis.print);
	client.sismember(registered_account_key, pAccount, function(err, result) {
		if(err) {
			console.log('isValidUser error: ' + err);
			return;
		}
		if(result == 1) {
			// check if the password is correct
			client.hget(accountPass_key, pAccount, function(err, result) {
				if(err) {
					console.log('isValidUser error: ' + err);
					return;
				}
				console.log('hget accountPass result: ' + result);
				if(result == pPass) {
					socket.emit('validUser', {
						account: pAccount
					});
				} else {
					socket.emit('invalidUser', {
						account: pAccount
					});
				}
			});
		} else {
			socket.emit('invalidUser', {
				account: pAccount
			});
			return false;
		}
	});
}

function tellEveryClient(socket, roomName, message) {
	socket.send(JSON.stringify(message));
	socket.in(roomName).broadcast.send(JSON.stringify(message));
}

function checkAccountDuplicate(pSocket, pAccount) {
	client.sismember(guest_account_key, pAccount, function(err, result) {
		if(err) {
			console.log('isValidUser error: ' + err);
			return;
		}
		if(result == 1) {
			// the user name is already in use
			pSocket.emit('invalidUser', {
				account: pAccount
			});
		} else {
			// check registered accounts
			client.sismember(registered_account_key, pAccount, function(err, result) {
				if(err) {
					console.log('isValidUser error: ' + err);
					return;
				}
				if(result == 1) {
					pSocket.emit('invalidUser', {
						account: pAccount
					});
				} else {
					client.sadd(guest_account_key, pAccount, redis.print);
					pSocket.emit('validUser', {
						account: pAccount
					});
				}
			});
		}
	});
}

exports.init = function(server) {
	client.flushdb(redis.print);
	console.log('Server initialized');
	io = io.listen(server);

	io.adapter(redisStore({
		host: 'localhost',
		port: '6379'
	}));

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

		socket.on('signin', function(data) {
			console.log('name: ' + data.name + ', pass: ' + data.pass);
			if(data.isGuest) {
				checkAccountDuplicate(socket, data.account);
			} else {
				validateUser(socket, data.account, data.pass);
			}	
		});

		// #4
		socket.on('check_duplicate', function(data) {
			client.sismember('room_' + data.room, data.name, function(err, result) {
				if(err) {
					console.log('Err: ' + err);
					return;
				} 
				console.log('result: ' + result);
				if(result == 1) {
					socket.emit('name_duplicated', {
						name: data.name
					});
				} else {
					socket.emit('name_allowed', {
						room: data.room
					});
				}
			});
		});

		socket.on('join_room', function(room) {
			console.log('join_room name: ' + room.name);
			//console.log('socket.handshake: ' + Object.keys(socket.request));
			var userName = socket.request.nickname;
			addUser(room.name, userName);
			// var userName = socket.username;
			//console.log('socket.handshake: ' + socket.handshake);
			socket.userName = userName;
			socket.emit('name_set', {
				name: userName
			});
			socket.send(JSON.stringify({
				type: 'WelcomeMessage',
				message: 'Welcome to the chat room'
			}));

			socket.join(room.name); 	// _infra joins
			var comSocket = self.chatCom.connected[socket.id];
			//comSocket.join(room.name); 	// _com joins 
			comSocket.room = room.name;
			socket.in(room.name).broadcast.emit('user_entered', {
				name: userName
			});	

			client.smembers(room.name, function(err, members) {
				if(err) {
					console.log('smembers err: ' + err);
					return;
				}
				var message = {
					type: 'UsersListMessage',
					userList: members
				}
				tellEveryClient(socket, room.name, message);
			});
		});

		socket.on('get_rooms', function() {
			console.log('get_rooms received');
			var rooms = {};
			for(var room in io.sockets.adapter.rooms) {
				// filter out rooms created by node.js
				if(room.indexOf('room_') == 0) { // room_ room name must starts with "room_"
					// var roomName = room.replace("room_", "");
					// rooms[roomName] = io.sockets.adapter.rooms[room];
					rooms[room] = io.sockets.adapter.rooms[room];
				}
			}
			socket.emit('rooms_list', rooms);
		});

		socket.on('disconnect', function() {
			// FIXME this function triggered when switching from the 1st page to the 2nd page.
			socket.in(socket.room).broadcast.emit('user_left', {
				name: socket.userName
			});
			removeUser(socket.room, socket.userName);
		});

		socket.on('signup', function(data) {
			console.log('account: ' + data.account + ' ,pass: ' + data.pass);
			client.select(name_pass_db, redis.print);
			client.sadd(registered_account_key, data.account, function(err, result) {
				if(err) {
					console.log('account ' + data.account + ' duplicated');
					client.select(default_db, redis.print);
					return;
				}
				if(result == 1) {
					client.hset(accountPass_key, data.account, data.pass);
					socket.emit('account_register_ok', {
						account: data.account
					});
				} else {
					socket.emit('acount_already_registerd', {
						account: data.account
					});
				}
				client.select(default_db, redis.print);
			});
			
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
var debug = require('debug')('chatroom');  // chatroom is the name of the logger
var io = require('socket.io');
var redis = require('redis');
var redisStore = require('socket.io-redis');
var crypto = require('crypto');
var sigTool = require('cookie-signature');
var util = require('./utilServer');
var express = require('express');
var router = express.Router();

var client = redis.createClient();

var default_db = 0;
var name_pass_db = 1;

var registered_account_key = 'regAccounts';
var guest_account_key = 'guestAccounts';
var accountPass_key = 'accountToPass';

//var chatInfra = io.connect('/');
//var chatCom = io.connect('/');

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

function removeUser(userName, roomName) {
	client.sismember('roomList', roomName, function(err, result) {
		if (err) {
			console.log('sismember err: ' + err);
			return;
		}
		// user userName is in room roomName
		client.srem(guest_account_key, userName, redis.print);
		client.srem(registered_account_key, userName, redis.print);
		if(result == 1) {
			client.srem(roomName, userName, redis.print);
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
	debug('user ' + userName + ' added to room ' + roomName );
	client.sadd(roomName, userName, redis.print);
	client.sadd('roomList', roomName, redis.print);
}

function signInValidateUser(socket, pAccount, pPass) {
	debug('signInValidateUser');
	client.select(name_pass_db, redis.print);
	// check if the account exists in the database
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
				debug('hget accountPass result: ' + result);
				debug('hget accountPass pPass: ' + pPass);
				if(result == pPass) {
					debug('result == pPass');
					var signedCookie = sigTool.sign(pAccount, util.key);
					socket.emit('validUser', {
						userID: signedCookie
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

function signInCheckAccountDuplicate(pSocket, pAccount) {
	client.sismember(guest_account_key, pAccount, function(err, result) {
		if(err) {
			console.log('isValidUser error: ' + err);
			return;
		}
		if(result == 1) {
			// the user name is already in use
			pSocket.emit('invalidUser', {
				account: pAccount,
				msg: 'The name ' + pAccount + ' is already in use.' 
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
					debug('ready to emit validUser');
					client.sadd(guest_account_key, pAccount, redis.print);
					var signedCookie = sigTool.sign(pAccount, util.key);
					pSocket.emit('validUser', {
						userID: signedCookie
					});
				}
			});
		}
	});
}

module.exports.router = router;

exports.authenticate = function(req, res) {
	debug('cookie: ' + req.body.userID);
	var userName = util.extractUserName(req.body.userID);
	removeUser(userName);
	if (sigTool.unsign(req.body.userID, util.key) == false) {
		debug('auth_fail');	
		res.send({
			msg: 'auth_fail'
		});
	} else {
		debug('auth_success');
		res.send({
			msg: 'auth_success',
			name: userName
		});
	}
}

exports.init = function(server) {
	client.flushdb(redis.print);
	debug('Server initialized');
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
			data.userID = data.cookie['userID'];
		} else {
			next(new Error('No cookie transmitted.'));
		}
		next();
	});
	var self = this;
	//this.chatInfra = io.of('/');
	//this.chatCom = io.of('/');

	//this.chatInfra.on('connection', function(socket) {
	io.sockets.on('connection', function(socket) {
		socket.on('signup', function(data) {
			debug('account: ' + data.account + ' ,pass: ' + data.pass);
			client.select(name_pass_db, redis.print);
			client.sadd(registered_account_key, data.account, function(err, result) {
				if(err) {
					console.log('account ' + data.account + ' duplicated');
					client.select(default_db, redis.print);
					return;
				}
				if(result == 1) {
					var signedCookie = sigTool.sign(data.account, util.key);
					client.hset(accountPass_key, data.account, data.pass);		
					socket.emit('account_register_ok', {
						userID: signedCookie
					});
				} else {
					socket.emit('acount_already_registerd', {
						account: data.account
					});
				}
				client.select(default_db, redis.print);
			});
			
		});

		socket.on('signin', function(data) {
			debug('name: ' + data.name + ', pass: ' + data.pass);
			if(data.isGuest) {
				debug('isGuest');
				signInCheckAccountDuplicate(socket, data.account);
			} else {
				signInValidateUser(socket, data.account, data.pass);
			}	
		});

		socket.on('authenticate', function(data) {
			debug('cookie: ' + data.userID);
			if (sigTool.unsign(data.userID, util.key) == false) {
				debug('auth_fail');
				removeUser(util.extractUserName(data.userID));
				socket.emit('auth_fail', {});
			} else {
				console.log('data.callback: ' + data.callback);
				debug('auth_success');
				socket.emit('auth_success', {
					callback: data.callback
				})
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
			debug('headers cookie: ' + socket.handshake.headers.cookie);
			var userName = util.extractUserName(socket.request.userID);
			addUser(room.name, userName);
			// var userName = socket.username;
			socket.userName = userName;
			socket.emit('name_set', {
				name: userName
			});
			socket.send(JSON.stringify({
				type: 'WelcomeMessage',
				message: 'Welcome to the chat room'
			}));

			socket.join(room.name); 	// _infra joins
			//var comSocket = self.chatCom.connected[socket.id];
			socket.room = room.name;
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
			debug('get_rooms received');
			var rooms = {};
			for(var room in io.sockets.adapter.rooms) {
				// filter out rooms created by node.js
				if(room.indexOf('room_') == 0) { // room_ room name must starts with "room_"
					// var roomName = room.replace("room_", "");
					// rooms[roomName] = io.sockets.adapter.rooms[room];
					rooms[room] = io.sockets.adapter.rooms[room];
				}
			}
			debug('rooms: ' + rooms);
			socket.emit('rooms_list', rooms);
		});

		socket.on('disconnect', function() {
			// FIXME this function triggered when switching from the 1st page to the 2nd page.
			debug('client ' + socket.userName + ' disconnected');
			socket.in(socket.room).broadcast.emit('user_left', {
				name: socket.userName
			});
			removeUser(socket.userName, socket.room);
		});

		// handle client's messages
		socket.on('message', function(message) { // triggered by socket.send
			debug('server received message');
			message = JSON.parse(message);
			// receive user's message
			if(message.type == 'userMessage') {
				debug('message.type == userMessage');
				message.username = util.extractUserName(socket.request.userID);
				debug('message.username: ' + message.username);
				// send to all the other clients
				socket.in(socket.room).broadcast.send(JSON.stringify(message));
				// send back the message 
				message.type = 'myMessage';
				socket.send(JSON.stringify(message));
			}
		});
	});
}


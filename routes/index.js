var express = require('express');
var router = express.Router();

var debug = require('debug')('chatroom');
var sigTool = require('cookie-signature');
var util = require('./utilServer');
/* GET home page. */

router.get('/', function(req, res, next) {
	res.render('index', { title: 'Express' });
});

// module.exports = router;
exports.router = router;

exports.chatroom = function(req, res) {
	res.render('chatroom', {
		title: 'Chat Room Practice'});
}

exports.rooms = function(req, res) {
	res.render('rooms', {
		title: 'Express Chat'
	});
}

exports.signup = function(req, res) {
	res.render('signup', {
		title: 'Sign Up'
	});
}

exports.authenticate = function(req, res) {
	debug('cookie: ' + req.body.userID);
	if (sigTool.unsign(req.body.userID, util.key) == false) {
		debug('auth_fail');
		var userName = util.extractUserName(req.body.userID);
		removeUser(userName);	 // this is not the removeUser defined in sockets
		res.send({msg: 'auth_fail'});
	} else {
		debug('auth_success');
		res.send({msg: 'auth_success'});
		//socket.emit('auth_success', {
		//	callback: data.callback
		//})
	}
}
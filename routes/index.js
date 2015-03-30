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
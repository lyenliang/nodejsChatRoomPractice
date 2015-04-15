(function($){
	var socket = io.connect('/');

	var NICK_MAX_LENGTH = 15,
		ROOM_MAX_LENGTH = 10,
		lockShakeAnimation = false,
		nickname = null,

		serverDisplayName = 'Server';
		
	tmplt = {
		room: [
			'<li data-roomId="${room}">',
				'<span class="icon"></span> ${room}',
			'</li>'
		].join(""),
		client: [
			'<li data-clientId="${clientId}" class="cf">',
				'<div class="fl clientName"><span class="icon"></span> ${nickname}</div>',
				'<div class="fr composing"></div>',
			'</li>'
		].join(""),
		message: [
			'<li class="cf">',
				'<div class="fl sender">${sender}: </div><div class="fl text">${text}</div><div class="fr time">${time}</div>',
			'</li>'
		].join("")
	};

	function handleMessage() {
		// user sends the message
		var data = {};
		var words = $('.chat-input input').val();
		if(words == '') {
			return;
		}
		// handle commands
		if(words.slice(0, 2) == '/p') {
			// private message
			var target = null;
			var endIdx = null;
			if(words.charAt(3) == '\"') {
				endIdx = words.indexOf('\"', 4);
				target = words.slice(4, endIdx);
			} else {
				endIdx = words.indexOf(' ', 3);
				target = words.slice(3, endIdx);
			}
			data = {
				message: words.slice(endIdx+1),
				type: 'userMessage',
				target: target
			}
		} else {
			data = {
				message: words,
				type: 'userMessage'
			}	
		}
		console.log('data: ' + words)
		socket.send(JSON.stringify(data)); // handled by socket.on('message', ...
		// empty the value of #message
		$('.chat-input input').val(''); 
	}

	function bindDOMEvents() {
		
		$('.chat-input input').on('keydown', function(e){
			var key = e.which || e.keyCode;
			if(key == 13) { 
				handleMessage(); 
			}
		});

		$('.chat-submit button').on('click', function(){
			handleMessage();
		});

		$('#nickname-popup .input input').on('keydown', function(e){
			var key = e.which || e.keyCode;
			if(key == 13) { handleNickname(); }
		});
		
		$('#addroom-popup .input input').on('keydown', function(e){
			var key = e.which || e.keyCode;
			if(key == 13) { createRoom(); }
		});

		$('#addroom-popup .create').on('click', function(){
			createRoom();
		});

		$('.big-button-green.start').on('click', function() {
			console.log('click listener entered');
			$('#nickname-popup .input input').val('');
			Avgrund.show('#nickname-popup');
			window.setTimeout(function(){
		    	$('#nickname-popup .input input').focus();
		    },100);
		});

		$('.chat-rooms .title-button').on('click', function(){
			$('#addroom-popup .input input').val('');
			Avgrund.show('#addroom-popup');
			window.setTimeout(function(){
	        	$('#addroom-popup .input input').focus();
	        },100);
		});

		$('.chat-rooms ul').on('scroll', function(){
			$('.chat-rooms ul li.selected').css('top', $(this).scrollTop());
		});

		$('.chat-messages').on('scroll', function(){
			var self = this;
			window.setTimeout(function(){
				if($(self).scrollTop() + $(self).height() < $(self).find('ul').height()){
					$(self).addClass('scroll');
				} else {
					$(self).removeClass('scroll');
				}
			}, 50);
		});

		$('.chat-rooms ul li').on('click', function(){
			var room = $(this).attr('data-roomId');
			if(room != currentRoom){
				socket.emit('unsubscribe', { room: currentRoom });
				socket.emit('subscribe', { room: room });
			}
		});

		$('#nickname-popup .begin').on('click', function(){
			login(true);
		});

		$('#signin-popup .btn').on('click', function() {
			login(false);
		})

		$('#signup-popup .btn').on('click', function() {
			signup();
		})

		$('.big-button-green.small.signin').on('click', function() {
			Avgrund.hide();
			Avgrund.show('#signin-popup');
		});

		$('.big-button-green.small.signup').on('click', function(){
			console.log('signup clicked');
			Avgrund.hide();
			Avgrund.show('#signup-popup');
		});
	}

	function checkCookie() {
		var cookie = getCookie('userID');
		if(cookie != "") {
			// authenticate this userID
			authenticateUser(cookie);
		}
	}

	function bindSocketEvents() {

		socket.on('validUser', function(data) {
			setCookie('userID', data.userID, 180*24*60*60);
			var useName = data.userID.slice(0, data.userID.lastIndexOf('.'));
			$('.chat-shadow').animate({ 'opacity': 0 }, 200, function(){
				$(this).hide();
				$('.chat input').focus();
			});
		});

		socket.on('invalidUser', function(data) {
			if(data.msg) {
				alert(data.msg);
			} else {
				alert('Sign in fails');
			}
		});

		socket.on('account_register_ok', function(data) {
			console.log('account_register_ok');
			setCookie('userID', data.userID, 180*24*60*60);
			startChatting(data.userID);
		});

		socket.on('acount_already_registerd', function(data) {
			// TODO notify the user that the account has been registered
		});

		socket.on('message', function(data) {
			data = JSON.parse(data);
			if(data.type == 'WelcomeMessage') {
				console.log('WelcomeMessage');
				//$('#messages').append('<div class="' + data.type + '">' + data.message + '</div>');
				insertMessage(serverDisplayName, data.message, true, false, true);
			} else if(data.type == 'UsersListMessage') {
				document.getElementById('userList').innerHTML = "";
				for (var i = 0 ; i < data.userList.length; i++) {
					$('#userList').append('<div class="' + data.type + '">' + data.userList[i] + '</div>');
				}
			} else if (data.type == 'private_myMessage') {

				$('#messages').append('<div class="' + data.type + 
					'"><span class="name"><b>' + data.username + "</b> pm <b>" + data.target + "</b>:</span>" + data.message + '</div>');
			} else if(data.type == 'private_message') {
				console.log('private_message received');
				$('#messages').append('<div class="' + data.type + 
					'"><span class="name"><b>' + data.username + "</b> pm <b>" + data.target + "</b>:</span>" + data.message + '</div>');
			} else {
				insertMessage(data.username, data.message, true, false, false);
				//$('#messages').append('<div class="' + data.type + 
				//	'"><span class="name"><b>' + data.username + "</b>:</span>" + data.message + '</div>');
			}	
		});
	}

	function signup() {
		var pass = $('#signup-popup .passwd').val().trim();
		var pass2 = $('#signup-popup .passwd2').val().trim();

		if (pass != pass2) {
			console.log('passwords mismatch');
			return;
		}
		var name = $('#signup-popup .input .nickname').val().trim();
		
		socket.emit('signup',  {
			account: name,
			pass: pass
		});
	}

	function login(isGuest) {
		var name = null;
		if(isGuest) {
			name = $('#nickname-popup .input input').val().trim();	
		} else {
			name = $('#signin-popup .input .nickname').val().trim();		
		}
		if(name && name.length <= NICK_MAX_LENGTH){
			Avgrund.hide();
			//connect();
			socket.emit('signin', {
				account: name,
				pass: $('#signin-popup .passwd').val(),
				isGuest: isGuest
			});	
		} else {
			shake('#nickname-popup', '#nickname-popup .input input', 'tada', 'yellow');
			$('#nickname-popup .input input').val('');
		}	
	}

	function shake(container, input, effect, bgColor){
		if(!lockShakeAnimation){
			lockShakeAnimation = true;
			$(container).addClass(effect);
			$(input).addClass(bgColor);
			window.setTimeout(function(){
				$(container).removeClass(effect);
				$(input).removeClass(bgColor);
				$(input).focus();
				lockShakeAnimation = false;
			}, 1500);
		}
	}

	function getTime(){
		var date = new Date();
		return (date.getHours() < 10 ? '0' + date.getHours().toString() : date.getHours()) + ':' +
				(date.getMinutes() < 10 ? '0' + date.getMinutes().toString() : date.getMinutes());
	}

	function insertMessage(sender, message, showTime, isMe, isServer){
		var $html = $.tmpl(tmplt.message, {
			sender: sender,
			text: message,
			time: showTime ? getTime() : ''
		});

		// if isMe is true, mark this message so we can
		// know that this is our message in the chat window
		if(isMe){
			$html.addClass('marker');
		}

		// if isServer is true, mark this message as a server
		// message
		if(isServer){
			$html.find('.text').css('color', serverDisplayColor);
		}
		$html.appendTo('.chat-messages ul');
		$('.chat-messages').animate({ scrollTop: $('.chat-messages ul').height() }, 100);
	}

	function createRoom(){
		var room = $('#addroom-popup .input input').val().trim();
		if(room && room.length <= ROOM_MAX_LENGTH && room != currentRoom){
			
			// show room creating message
			$('.chat-shadow').show().find('.content').html('Creating room: ' + room + '...');
			$('.chat-shadow').animate({ 'opacity': 1 }, 200);
			
			// unsubscribe from the current room
			socket.emit('unsubscribe', { room: currentRoom });

			// create and subscribe to the new room
			socket.emit('subscribe', { room: room });
			Avgrund.hide();
		} else {
			shake('#addroom-popup', '#addroom-popup .input input', 'tada', 'yellow');
			$('#addroom-popup .input input').val('');
		}
	}

	function authenticateUser(cookie) {
	    var data = {
	        userID: cookie
	    }
	    console.log('util cookie: ' + data.userID);
	    $.post('/authenticate', data, function(result) {
	        console.log('authenticate result received');
	        if(result.msg == 'auth_success') {
	        	console.log('auth_success');
	           	// login with this account
	           	startChatting(cookie);
	        } 
	    });
	}

	function startChatting(uid) {
		//Avgrund.hide();
		// take user to the lobby
		nickname = uid.slice(0, uid.lastIndexOf('.'));
		// hide the shadow at the front
		$('.chat-shadow').animate({ 'opacity': 0 }, 200, function(){
			$(this).hide();
			$('.chat input').focus();
		});
	}

	$(function() {
		bindDOMEvents();
		bindSocketEvents();
		checkCookie();
	});

})(jQuery);
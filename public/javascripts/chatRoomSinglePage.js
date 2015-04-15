(function($){
	var socket = io.connect('/');

	var NICK_MAX_LENGTH = 15,
		ROOM_MAX_LENGTH = 10,
		lockShakeAnimation = false;

	$('.big-button-green.start').on('click', function() {
		console.log('click listener entered');
		$('#nickname-popup .input input').val('');
		Avgrund.show('#nickname-popup');
		window.setTimeout(function(){
	    	$('#nickname-popup .input input').focus();
	    },100);
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

	socket.on('validUser', function(data) {
		setCookie('userID', data.userID, 180*24*60*60);
		var useName = data.userID.slice(0, data.userID.lastIndexOf('.'));
	});

	socket.on('invalidUser', function(data) {
		if(data.msg) {
			alert(data.msg);
		} else {
			alert('Sign in fails');
		}
	});

	socket.on('account_register_ok', function(data) {
		setCookie('userID', data.userID, 180*24*60*60);
		// take user to the lobby
		var userName = data.userID.slice(0, data.userID.lastIndexOf('.'));
		//enterLobby(userName);
	});

	socket.on('acount_already_registerd', function(data) {
		// TODO notify the user that the account has been registered
	});

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
})(jQuery);
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

$('.big-button-green.small.signin').on('click', function() {
	console.log('signin clicked');
	Avgrund.hide();
	Avgrund.show('#signin-popup');
});

$('#nickname-popup .signup').on('click', function(){
	
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

function login(isGuest) {
	var name = $('#nickname-popup .input input').val().trim();
	if(name && name.length <= NICK_MAX_LENGTH){
		nickname = name;
		Avgrund.hide();
		//connect();
		socket.emit('signin', {
			account: name,
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
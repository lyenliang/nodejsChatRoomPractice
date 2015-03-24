var socket = io.connect('/');

document.addEventListener('DOMContentLoaded', function() {
	document.querySelector('#loginAsGuest').addEventListener('change', loginAsGuestListener);
});

function loginAsGuestListener() {
	if(loginAsGuest.checked) {
		$('#passwd').val('');
		$('#passwd').prop('disabled', true);
	} else {
		$('#passwd').prop('disabled', false);
	}
}

function enterLobby(pAccount) {
	var now = new Date();
	var time = now.getTime();
	var expireTime = time + 180*24*60*60*1000; // 180 days
	now.setTime(expireTime);

	document.cookie = 'nickname=' + pAccount + ';expires=' + now.toGMTString() + ';path=/';
	window.location = '/rooms?name=' + pAccount;	
}

socket.on('validUser', function(data) {
	enterLobby(data.account);
});

socket.on('invalidUser', function(data) {
	alert('Sign in fails');
});

$(function() {
	$('#signUpBtn').popup();
	if(getCookie('nickname') != "") {
		window.location = 'rooms';
	}

	$('#startchat').click(function() {
		var name = $('#nickname').val();
		if(name == '') {
			alert('Nickname is required.');
			return;
		}
		socket.emit('signin', {
			account: name,
			pass: $('#passwd').val(),
			isGuest: document.getElementById('loginAsGuest').checked
		});		
	});
});
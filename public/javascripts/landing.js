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
	window.location = '/rooms?name=' + pAccount;	
}

socket.on('validUser', function(data) {
	setCookie('userID', data.userID, 180*24*60*60);
	var useName = data.userID.slice(0, data.userID.lastIndexOf('.'));
	enterLobby(useName);
});

socket.on('invalidUser', function(data) {
	if(data.msg) {
		alert(data.msg);
	} else {
		alert('Sign in fails');
	}
});

socket.on('account_register_ok', function(data) {
	console.log('account_register_ok: ' + data.account);
	setCookie('userID', data.account, 180*24*60*60);
	// take user to the lobby
	var userName = data.userID.slice(0, data.userID.lastIndexOf('.'));
	enterLobby(userName);
});

socket.on('acount_already_registerd', function(data) {
	console.log('acount_already_registerd: ' + data.account);
});

socket.on('auth_success', function(data) {
	data.callback();
});

$(function() {
	$('#signUpBtn').popup();
	
	if(share_session) {
		var cookie = getCookie('userID');
		if(cookie != "") {
			// authenticate this userID
			authenticateUser();
		}	
	}

	$('#startchat').click(function() {
		var isGuest = document.getElementById('loginAsGuest').checked;
		var name = $('#nickname').val();
		var passwd = $('#passwd').val();

		if(name == '') {
			alert('Nickname is required.');
			return;
		}
		
		var pattern = /[^\u4e00-\u9fa5\w ]/g;
		
		if(pattern.test(name)) {
			alert('Nickname contains invalid characters');
			return;
		}

		if(!isGuest && passwd == '') {
			alert('Pass word is required.');
			return;
		}
		socket.emit('signin', {
			account: name,
			pass: $('#passwd').val(),
			isGuest: isGuest
		});		
	});
});
var socket = io.connect('/');

document.addEventListener('DOMContentLoaded', function() {
	document.querySelector('#loginAsGuest').addEventListener('change', loginAsGuestListener);
});


// from w3schools
function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        // while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
    }
    return "";
}

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
	var expireTime = time + 10*1000;
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
		/*
		if(document.getElementById('loginAsGuest').checked) {
			// login as a guest
			// TODO check if the user name is already taken
			enterLobby(name);
		} else {
			// use name and password to enter the chat room
			socket.emit('signin', {
				account: name,
				pass: $('#passwd').val()
			});
		}	
		*/
	});
/*
	$('#signUpBtn').click(function() {
		console.log('signUpBtn clicked');
		//$('#signUpBtn').popup();
		//$('a.popup').popup();
	});
*/
});
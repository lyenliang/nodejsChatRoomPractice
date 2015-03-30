var socket = io.connect('/');

$('#signupFormSubmit').click(function() {
	var pass = $('#passWordInput').val();
	var pass2 = $('#passWordInput2').val();

	if (pass != pass2) {
		console.log('passwords mismatch');
		return;
	}
	var account = $('#userNameInput').val();
	
	socket.emit('signup',  {
		account: account,
		pass: pass
	});

	console.log('signupFormSubmit clicked');
});

$(function() {
	authenticateUser();
});


var socket = io.connect('/');

$('#signupFormSubmit').click(function() {
	var pass = $('#passWordInput').val();
	var pass2 = $('#passWordInput2').val();

	if (pass != pass2) {
		console.log('passwords mismatch');
		return;
	}
	var account = $('#userNameInput').val();
	
	socket.emit('name_pass',  {
		account: account,
		pass: pass
	});

	console.log('signupFormSubmit clicked');
});

socket.on('account_register_ok', function(data) {
	console.log('account_register_ok: ' + data.account);
});

socket.on('acount_already_registerd', function(data) {
	console.log('acount_already_registerd: ' + data.account);
});
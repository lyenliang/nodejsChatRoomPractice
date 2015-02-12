// trigger connection event at the server side
var chatInfra = io.connect('/chat_infra');
var chatCom = io.connect('/chat_com');

chatInfra.on('name_set', function(data) {
	
	chatInfra.on('user_entered', function(user) {
		$('#messages').append('<div class="systemMessage"><b>' + 
			user.name + '</b> has joined the room.' + '</div>');
	});
	chatInfra.on('message', function(data) { // triggered by socket.send
		// show the received message to the client
		data = JSON.parse(data);
		$('#messages').append('<div class="' + data.type + 
			'">' + data.message + '</div>')
		
	});

	chatCom.on('message', function(data) {
		data = JSON.parse(data);
		$('#messages').append('<div class="' + data.type + 
				'"><span class="name"><b>' + data.username + "</b>:</span>" + data.message + '</div>');
	});

	$('#nameform').hide();
	$('#messages').append('<div class="systemMessage">' + 'Hello ' + data.name + '</div>');

	$('#send').click(function() {
		// user sends the message
		var data = {
			message: $('#message').val(),
			type: 'userMessage'
		}
		chatCom.send(JSON.stringify(data)); // handled by socket.on('message', ...
		// empty the value of #message
		$('#message').val(''); 
	});
});

$(function() {
	// execute the following code once the document is ready
	$('#setname').click(function() {
		// user sets his name
		chatInfra.emit('set_name', {
			name: $('#username').val()
		});
	});

	$('#message').keyup(function(e) {
		if(e.keyCode == 13) { // Enter key
			$('#send').click();
		}
	});
});
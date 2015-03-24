// trigger connection event at the server side
var chatInfra = io.connect('/');
var chatCom = io.connect('/');

// location.search equals "?room=roomName"
var roomName = decodeURI(RegExp("room=([\\w]+)").exec(location.search)[1]);

function removeUser(target) {
	var userList = document.getElementById('userList');
	for( var i = 0; i < userList.childElementCount; i++) {
		var user = userList.childNodes[i];
		if (user.innerHTML == target) {
			userList.removeChild(user);
		}
		break;
	}
}

if(roomName) {
	roomName = 'room_' + roomName;
	// #3
	chatInfra.emit('join_room', {
		name: roomName
	});
	chatInfra.on('name_set', function(data) {
		// #5
		chatInfra.on('user_entered', function(user) {
			$('#messages').append('<div class="systemMessage"><b>' + 
				user.name + '</b> has joined the room.' + '</div>');
		});

		chatInfra.on('user_left', function(user) {
			$('#messages').append('<div class="systemMessage"><b>' + 
				user.name + '</b> has left the room.' + '</div>');
			removeUser(user.name);
		});

		chatCom.on('message', function(data) {
			data = JSON.parse(data);
			if(data.type == 'WelcomeMessage') {
				$('#messages').append('<div class="' + data.type + '">' + data.message + '</div>');
			} else if(data.type == 'UsersListMessage') {
				document.getElementById('userList').innerHTML = "";
				for (var i = 0 ; i < data.userList.length; i++) {
					$('#userList').append('<div class="' + data.type + '">' + data.userList[i] + '</div>');
				}
			} else {
				$('#messages').append('<div class="' + data.type + 
					'"><span class="name"><b>' + data.username + "</b>:</span>" + data.message + '</div>');
			}
			
		});

		$('#nameform').hide();
		$('#messages').append('<div class="systemMessage">' + 'Hello ' + data.name + '</div>');

		$('#send').click(function() {
			// user sends the message
			var words = $('#message').val();
			if(words == '') {
				return;
			}
			var data = {
				message: words,
				type: 'userMessage'
			}
			chatCom.send(JSON.stringify(data)); // handled by socket.on('message', ...
			// empty the value of #message
			$('#message').val(''); 
		});
	});
}

$(function() {
	// execute the following code once the document is ready
	$('#setname').click(function() {
		// user sets his name
		// #1
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
var chatInfra = io.connect('/');

chatInfra.on('connect', function() {

	console.log('trigger get_rooms');
	chatInfra.emit('get_rooms', {
		
	});

	chatInfra.on('rooms_list', function(rooms) {
		console.log('receive a list of rooms from the server');
		for(var room in rooms) {
			room = room.replace("room_", "");
			console.log('rooms[room]: ' + rooms[room]);
			var roomDiv = '<div class="room_div"><span class="room_name">' + 
					room + '</span><span class="room_users">[ ' +  
					Object.keys(rooms['room_'+room]).length + 
					' Users ] </span><button type="button" onclick=enterRoom("' + 
					room + '")>Join</button></div>';
			$('#rooms_list').append(roomDiv);
		}
	});
});

function enterRoom(roomName) {
	window.location = '/chatroom?room=' + roomName;
}

function getURLParams(target) {
	var params = location.search;
	console.log('params: ' + params);
	if(params.length == 0) {
		return null;
	}
	params = params.substring(1); // remove the "?" sign at the beginning
	var params = params.split('&');
	for(var i = 0; i < params.length; i++) {		
		var p = params[i].split('=');
		if(p.length == 2) {
			if(p[0] == target) {
				return p[1];
			}
		}
	}
	return null;
}

$(function() {
	authenticateUser()
	//console.log('room page');

	$('#new_room_btn').click(function() {
		// check if the room name already exists
		window.location = '/chatroom?room=' + $('#new_room_name').val();
	});

	$('#logout_btn').click(function() {
		deleteCookie('userID');
		window.location = '/';
	});

	document.getElementById('welcomeMessage').innerHTML += getURLParams('name');
	//$('#welcomeMessage')
	
});
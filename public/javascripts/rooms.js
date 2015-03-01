var chatInfra = io.connect('/');

chatInfra.on('connect', function() {

	chatInfra.emit('get_rooms', {

	});

	chatInfra.on('rooms_list', function(rooms) {
		console.log('rooms_list received');
		
		console.log('rooms.length: ' + rooms.length);
		// $('#rooms_list').remove();
		for(var room in rooms) {
			room = room.replace("room_", "");
			//console.log('room: ' + room);
			//console.log('Object.keys(rooms): ' + Object.keys(rooms[room]));
			var name = getCookie('nickname');
			console.log('rooms[room]: ' + rooms[room]);
			var roomDiv = '<div class="room_div"><span class="room_name">' + 
					room + '</span><span class="room_users">[ ' +  
					Object.keys(rooms['room_'+room]).length + 
					' Users ] </span><button type="button" onclick=checkDuplicateName("' + 
					room + '","' + name + '")>Join</button></div>';
			$('#rooms_list').append(roomDiv);
		}
	});
	// document.getElementsByClassName("room_name")[0].innerHTML
	chatInfra.on('name_duplicated', function(data) {
		window.alert('The name ' + data.name + ' is currently in use');
	});
	chatInfra.on('name_allowed', function(data) {
		// $('.room_name')[0].innerHTML
		window.location = '/chatroom?room=' + $('#new_room_name').val();
	});
});

function checkDuplicateName(pRoom, pName) {
	console.log('checkDuplicateName');
	chatInfra.emit('check_duplicate', {
		room: pRoom,
		name: pName
	});
}


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

$(function() {

	$('#new_room_btn').click(function() {
		window.location = '/chatroom?room=' + $('#new_room_name').val();
	});
	
	/*
	$('.room').click(function() {
		chatInfra.emit('check_duplicate_name', {
			name: getCookie('nickname')
		})
	});
	*/
	
});
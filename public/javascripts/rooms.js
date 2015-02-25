var chatInfra = io.connect('/');



chatInfra.on('connect', function() {

	chatInfra.emit('get_rooms', {

	});

	chatInfra.on('rooms_list', function(rooms) {
		console.log('rooms_list received');
		for(var room in rooms) {
			console.log('room: ' + room);
			var roomDiv = '<div class="room_div"><span class="room_name">' + 
					room + '</span><span class="room_users">[ ' + rooms[room] + ' Users ] </span>' +
					'<a class="room" href="/chatroom?room=' + room + '">Join</a></div>';
			$('#rooms_list').append(roomDiv);
		}
	});

	chatInfra.on('name_duplicated', function(data) {
		window.alert('The name ' + data.name + ' is currently in use');
	});
	chatInfra.on('name_allowed', function(data) {
		// $('.room_name')[0].innerHTML
		// window.location = '/chatroom?room=' + $('#new_room_name').val();
	});
});
// from w3schools
function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
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
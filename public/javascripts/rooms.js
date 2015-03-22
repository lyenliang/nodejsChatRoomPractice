var chatInfra = io.connect('/');
var isNewRoom = false;
chatInfra.on('connect', function() {

	chatInfra.emit('get_rooms', {

	});

	chatInfra.on('rooms_list', function(rooms) {
		console.log('receive a list of rooms from the server');
		for(var room in rooms) {
			room = room.replace("room_", "");
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

	chatInfra.on('name_duplicated', function(data) {
		window.alert('The name ' + data.name + ' is currently in use');
	});

	chatInfra.on('name_allowed', function(data) {
		window.location = '/chatroom?room=' + data.room;
	});
});

function checkDuplicateName(pRoom, pName, action) {
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

function deleteCookie( name ) {
	document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
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

	$('#new_room_btn').click(function() {
		// check if the room name already exists
		window.location = '/chatroom?room=' + $('#new_room_name').val();
	});

	$('#logout_btn').click(function() {
		deleteCookie('nickname');
		window.location = '/';
	});

	document.getElementById('welcomeMessage').innerHTML += getURLParams('name');
	//$('#welcomeMessage')
	
});
var socket = io.connect('/');

// from w3schools
function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
         while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) {
        	return c.substring(name.length, c.length);
        }
    }
    return "";
}

function setCookie(key, value, validSec) {
    var now = new Date();
    var time = now.getTime();
    var expireTime = time + validSec*1000; // 180 days
    now.setTime(expireTime);
    document.cookie = key + '=' + value + ';expires=' + now.toGMTString() + ';path=/';    
}

function deleteCookie( name ) {
	document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function authenticateUser(cookie) {
    if(cookie == null) {
        cookie = getCookie('userID');
    }
	socket.emit('authenticate', {
		userID: cookie
	});
}

socket.on('auth_fail', function(data) {
    // log out?
    console.log('auth_fail');
    window.location = '/';
});

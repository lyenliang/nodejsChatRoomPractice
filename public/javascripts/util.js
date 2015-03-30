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
    //console.log('what is callback: ' + callback);
    if(cookie == null) {
        cookie = getCookie('userID');
    }
    var data = {
        userID: cookie
    }
    console.log('util cookie: ' + data.userID);
    $.post('/authenticate', data, function(result) {
        console.log('authenticate result received');
        if(result.msg == 'auth_success') {
            console.log('auth_success');
            if(window.location.pathname == '/') {
                window.location = '/rooms?name=' + result.name;
            }
        } else if (result.msg == 'auth_fail') {
            console.log('auth_fail');
            if(window.location.pathname != '/') {
                window.location = '/';  
            }
        }
    });
}

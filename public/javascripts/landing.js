document.addEventListener('DOMContentLoaded', function() {
	document.querySelector('#loginAsGuest').addEventListener('change', loginAsGuestListener);
});

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

function loginAsGuestListener() {
	if(loginAsGuest.checked) {
		$('#passwd').val('');
		$('#passwd').prop('disabled', true);
	} else {
		$('#passwd').prop('disabled', false);
	}
}

$(function() {
	
	if(getCookie('nickname') != "") {
		window.location = 'rooms';
	}

	$('#startchat').click(function() {
		var name = $('#nickname').val();
		if(name == '') {
			alert('Nickname is required.');
			return;
		}
		document.cookie = 'nickname=' + name + ';; path=/';
		window.location = '/rooms';
	});
});
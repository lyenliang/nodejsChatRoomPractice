$(function() {
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
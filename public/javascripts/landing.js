$(function() {
	$('#startchat').click(function() {
		document.cookie = 'nickname=' + $('#nickname').val() + ';; path=/';
		console.log('document.cookie: ' + document.cookie);
		window.location = '/rooms';
	});
});
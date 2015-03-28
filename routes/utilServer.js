module.exports = {
	key: 'asdf4kj5f98slkjGsbplbvkTZax',
	extractUserName: function(userID) {
		return userID.slice(0, userID.lastIndexOf('.'));
	}
};

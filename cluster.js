var cluster = require('cluster');

if (cluster.isMaster) {
	var noOfWorkers = process.env.NODE_WORKERS || require('os').cpus().length;
	console.log('require(os).cpus().length: ' + require('os').cpus().length);
	for (var i = 0; i < 2; i++) {
		cluster.fork();
	}
	cluster.on('exit', function(worker, code, signal) {
		console.log('worker ' + worker.process.pid + ' died');
	});
} else {
	require('./bin/www');
}
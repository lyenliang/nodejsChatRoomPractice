var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);

var routes = require('./routes/index');
var users = require('./routes/users');
var sockets = require('./routes/socketsSinglePage')


var app = express();

var sessionStore = new RedisStore();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//app.set('env', 'production');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(cookieParser('232rwegbssdfg23twsefazcbl'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    name: 'express.sid',
    // store: sessionstore.createSessionStore(),
    store: sessionStore,
    secret: '232rwegbssdfg23twsefazcbl',
    resave: false,
    saveUninitialized: false
}));


app.use(routes.router);
app.use('/users', users);
app.use('/chatroom', routes.chatroom);
app.use('/rooms', routes.rooms);
app.use('/signup', routes.signup);
app.use('/single', routes.chatroom_singlepage);
app.use('/authenticate', sockets.authenticate);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;

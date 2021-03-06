﻿
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var mongo = require('mongodb').MongoClient;

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

//http.createServer(app).listen(app.get('port'), function () {
//    console.log('Express server listening on port ' + app.get('port'));
//});

var serve = http.createServer();
var io = require('socket.io')(serve);

serve.listen(app.get('port'), function () {
    console.log('app servre is listening to the port' + app.get('port'));
});

io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('disconnect', function () {
        console.log('a user disconnected');
    });
    socket.on('chat', function (msg) { 
        socket.broadcast.emit('chat', msg);
    });
});

mongo.connect("mongodb://localhost/my_db", function (err, db) {
    var collection = db.collection('chat message');
    collection.insert({ content : msg }, function (error, o) {
        if (error) {
            console.log('Error occured while requesting process');
        }
        else
            console.log("chat message inserted into db: " + msg);
    });
});

mongo.connect("mongodb://localhost/my_db", function (err, db) {
    var collection = db.collection('chat messages');
    var stream = collection.find().sort({ _id : -1 }).limit(10).stream();
    stream.on('data', function (chat) { socket.emit('chat', chat.content); });
});

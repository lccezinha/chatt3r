var http    = require('http');
var socket  = require('socket.io');
var express = require('express');
var app     = express();
var server  = http.createServer(app);
var io      = socket.listen(server);
var redis   = require('redis');
var redisClient = redis.createClient();

io.set('log level', 1);
//use redis...
//TODO: Replace static methods for redis functions to persist data


//app.use(express.static(__dirname + '/assets'));

app.use("/stylesheets", express.static(__dirname + '/assets/stylesheets'));
app.use("/javascripts", express.static(__dirname + '/assets/javascripts'));
app.use("/images", express.static(__dirname + '/assets/images'));

app.get('/', function(req, res){
  res.sendfile("./views/chat.html");
});

function save_message(nick, message){
  message = JSON.stringify({ 
    author: nick,
    texto: message,
    when: new Date().toLocaleTimeString()
  });
  
  redisClient.lpush("messages", message, function(err, response) {
    redisClient.ltrim("messages", 0, 10);
  });
  return JSON.parse(message);
}

function send_old_messages(client) {
  redisClient.lrange("messages", 0, -1, function(err, messages) {
    msgs = messages.reverse();
    msgs.forEach(function(message){
      message = JSON.parse(message);
      client.emit('messages', { msg: message, clazz: 'info' })
    });
  });
}

function show_all_chatters(client){
  redisClient.smembers('names', function(err, nicks) {
    nicks.forEach(function(nick){
      client.emit('new-chatter', nick);
    });
  });
};

io.sockets.on('connection', function(client){
  console.log('client connected.');

  //set nick
  client.on('join', function(nick){
    client.set('nick', nick);
    console.log('setting nickname: %s', nick);
    client.emit('new-chatter', nick);
    client.broadcast.emit('new-chatter', nick);
    //when a new user logged, see all onlines users
    show_all_chatters(client);
    
    redisClient.sadd("chatters", nick);
    //when a new user logged, send him all old messages
    send_old_messages(client);
  });

  //new message
  client.on('new-message', function(message){ 
    client.get('nick', function(err, nick){
      var msg = save_message(nick, message);
      client.emit('messages', { msg: msg, clazz: 'success' });
      client.broadcast.emit('messages', { msg: msg, clazz: 'info' });
    });
  });

  //disconnect
  client.on('disconnect', function() {
    client.get('nick', function(err, nick){
      client.broadcast.emit('remove-chatter', nick);
      redisClient.srem('chatters', nick);
      console.log('Client %s disconnected', nick);
    });
  });

});

server.listen(8000);
console.log("server online. \n");

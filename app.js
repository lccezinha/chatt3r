var http    = require('http');
var socket  = require('socket.io');
var express = require('express');
var app     = express();
var server  = http.createServer(app);
var io      = socket.listen(server);
io.set('log level', 1);
//use redis...

app.use(express.static(__dirname + '/assets'));
app.get('/', function(req, res){
  res.sendfile("./chat.html");
});

messages = [];

function save_message(nick, message){
  message = { 
    author: nick,
    texto: message,
    when: new Date().toLocaleTimeString()
  }
  messages.push(message);
  return message;
}

io.sockets.on('connection', function(client){
  console.log('client connected.');

  //set nick
  client.on('join', function(nick){
    client.set('nick', nick);
    console.log('setting nickname: %s', nick);
    client.emit('new-chatter', nick);
    client.broadcast.emit('new-chatter', nick);
  });

  //new message
  client.on('new-message', function(message){ 
    client.get('nick', function(err, nick){
      var msg = save_message(nick, message);
      client.emit('messages', msg);
      client.broadcast.emit('messages', msg);
    });
  });


});

server.listen(8000);
console.log("server online. \n");
$(document).ready(function(){
  var server = io.connect();
  
  server.on('connect', function(){
    nick = prompt("What's your nickname ?");
    if(nick != '' || nick != null)
      server.emit('join', nick);
  });

  server.on('new-chatter', function(nick) {
    $("ul#chatters").append("<li>" + nick + "</li>")
  });

  server.on('messages', function(data){ 
    //$("ul#chat").append("<li>[ " + message.when + "] => " + message.author + ": " + message.texto + "</li>")
    console.log(data)
    $("ul#chat").append("<li><p><span class='badge badge-"+ data.clazz +"'>" + data.msg.author + 
                          "</span>&nbsp;" + data.msg.texto + 
                          "<small class='pull-right'>" + data.msg.when +"</small></p><hr /></li>")
  });

  $('#send').click(function(){
    message = $("input[name='new-message']").val();
    server.emit('new-message', message);
    $("input[name='new-message']").val('');
  });

});
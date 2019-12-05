var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var players = [];
var currentId = 1;

 
app.use(express.static(__dirname + '/public'));
 
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {


  console.log('a user connected');
  console.log(players);

players[socket.id]={
  jumping: false,
  number: currentId
}

currentId++;
 
socket.emit('yourId',socket.id);
socket.emit('currentPlayers',players);


socket.broadcast.emit('addPlayer', players[socket.id]);

  socket.on('disconnect', function () {
    console.log('user disconnected');
    socket.broadcast.emit('removePlayer', players[socket.id]);
    delete players[socket.id];
    io.emit('disconnect',socket.id);
  });

currentId++;

socket.on('jump',function(id){
  console.log("player "+id+" jumps");
  socket.broadcast.emit('playerJump',id);

})

});
 
server.listen(8081, function () {
  console.log(`Listening on ${server.address().port}`);
  
});
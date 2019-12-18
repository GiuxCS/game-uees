var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var players = [];
var currentId = 1;
var playerConnected = false;

var spikeInterval = 6000;
var bulletInterval = 4000;


var colors = [
  '0xffabab',
  '0xffcbab',
  '0xffe7ab',
  '0xebffab',
  '0xd5ffab',
  '0xbaffab',
  '0xabffd9',
  '0xabfbff',
  '0xabbaff',
  '0xc0abff',
  '0xd8abff',
  '0xfcabff',
  '0xffabcf'
]
 
app.use(express.static(__dirname + '/public'));
 
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});


setInterval(function(){

  console.log('Sending spike')

  spikeX = 1400 + Math.random()*600;
  spikeSpeed = 10 + Math.random()*14;

  io.emit('makeSpike',{ x: spikeX, speed: spikeSpeed});

  spikeInterval = 4000 + Math.random()*4000

},spikeInterval);


setInterval(function(){

  console.log('Sending bullet')

  bulletX = 1400 + Math.random()*600;
  bulletSpeed = 9 + Math.random()*8;

  io.emit('makeBullet',{ x: bulletX, speed: bulletSpeed});

  bulletInterval = 9000 + Math.random()*6000

},bulletInterval);


setInterval(updateScores,200);





io.on('connection', function (socket) {

  if(!playerConnected){
    playerConnected = true;
  }

  console.log('a user connected');
  console.log(players);

let randomColor = colors[Math.floor(Math.random() * colors.length)];
console.log(randomColor);

players[socket.id]={
  jumping: false,
  number: currentId,
  id: socket.id,
  x: 100,
  speed: 5,
  color: randomColor,
  name: 'Jugador '+currentId,
  score: 0
}

currentId++;
 
socket.on('connectToServer',function(){

  socket.emit('playerInfo',socket.id);


  socket.emit('currentPlayersInfo', players);

  Object.keys(players).forEach(function (id) {

    socket.emit('addPlayer',players[id]);
  })


});

socket.on('updatePlayer',function(playerUpdate){


  players[socket.id].x = playerUpdate.x;
  players[socket.id].speed = playerUpdate.speed;
  players[socket.id].score = playerUpdate.score;

  if(playerUpdate.name != ''){

    players[socket.id].name = playerUpdate.name;

  }

  let p = [];

  Object.keys(players).forEach(function (id) {
    //console.log('p:'+players[id])
    p.push(players[id]);
  })

  
  //console.log(p);
  socket.emit('updateAllPlayers',p);

})


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
  socket.emit('playerJump',id);

})

});


function updateScores(){

  let scores = [];

  Object.keys(players).forEach(function (id) {

    let s ={
      name: players[id].name,
      score: players[id].score
    }

    scores.push(s);
    
  })

  scores.sort(function(a, b){return b-a});
  io.emit('scoresUpdate',scores);



}
 
server.listen(process.env.PORT || 3000, function () {
  console.log(`Listening on ${server.address().port}`);
  
});
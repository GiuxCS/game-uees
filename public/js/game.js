
// Esta es la configuracion Phaser para las fisicas del juego
var config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 1280,
  height: 640,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 3000 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

var game = new Phaser.Game(config);

//Estas son las variables del juego

var acceleration = 1;
var jumpForce = 1500;
var keyJump;
var players = [];
var jumping = false;
var jumpTimer = 200;
var pointer;
var background1;
var background2;
var backgroundSpeed = 10;
var myId;
var jumpTimer = 100;
var playerConnect = false;

function preload() {

  //Aqui se cargan las imagenes del juego

  this.load.image('ship', 'assets/spaceShips_001.png');
  this.load.image('otherPlayer', 'assets/enemyBlack5.png');
  this.load.image('dinosaur', 'assets/dinosaur.png');
  this.load.image('background','assets/background.jpg');

}

function create() { 


  var self = this;

   background1 = this.add.image(640, 320, 'background'); 
   background2 = this.add.image(1920, 320, 'background'); 
  this.input.addPointer(1);

  this.cursors = this.input.keyboard.createCursorKeys();
  keyJump = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  pointer = this.input.activePointer;

  

   this.socket = io();
  //Lisener de Socket.io

  //Esta funcion recibe los jugadores existentes y los agrega al juego
   
  this.socket.on('currentPlayers',function(players){
    console.log('Adding Players');
      
    Object.keys(players).forEach(function (id) {
      console.log('p:'+players[id])
      addPlayer(self, players[id]);
    })
   })
  
  //Manda a agregar nuevo jugador
   this.socket.on('addPlayer',function(id){

     console.log('adding player');
     addPlayer(self,id);
   })

   //quita al jugador
   this.socket.on('removePlayer',function(id){

    removePlayer(this,id);
   })

   //recibes tu id
  this.socket.on('yourId',function(id){

    myId = id;
    console.log('your id is: '+myId);
  });

  //indica que un jugador ha saltado
  this.socket.on('playerJump',function(id){

    console.log('player '+id+' jumps');
    jump(id);


  })
   
}

function update() {
  if(!playerConnect){

    this.socket.emit('connectPlayer');
    playerConnect = true;
  }

  if(players){

    var i;
  for(i in players){

    if(players[i].body.y > 700){
      players[i].body.y = 640;
      players[i].body.stop();
    }

   

    if(pointer.isDown || keyJump.isDown || this.input.pointer1.isDown){

      
      if(jumpTimer < 0){
        console.log('sending Jump');
      this.socket.emit('jump',myId);
      jumpTimer = 100;
      }else{
        jumpTimer--;

      }
      
      if (players[i].body.velocity.y == 0 && players[i].body.y > 500) {
  
        //players[i].setVelocityY(-jumpForce);
        //jumping = true;
        //console.log("jumping");
        //this.socket.emit('jump',myId);
      
      }
    }
  }
  }


  background1.x-=backgroundSpeed;
  background2.x-=backgroundSpeed;

  if(background1.x <= -640){
    background1.x = 1920;
  }
  if(background2.x <= -640){
    background2.x = 1920;
  }




  if (this.ship) {

    if (this.ship.body.y > 700) {
     
      console.log(this.ship.body.y);
      this.ship.body.y = 640;
      this.ship.body.stop();
      jumping = false;

    }
    

    if(pointer.isDown || keyJump.isDown || Touch.isDown){

      jump(1);
    }
  }
}


function itemTouched(pointer) {
    // do something
}


function addPlayer(self, player) {

  console.log('Adding player sprite: ');

  let p;

  p = self.physics.add.image((100+(player.number*50)), 100, 'dinosaur').setOrigin(0.5, 0.5).setDisplaySize(42, 45);
  p.setCollideWorldBounds(true);

  if (2+2==4) {
    p.setTint(0x0000ff);
  } else {
    p.setTint(0xff0000);
  }
  p.id = player.id;
  p.jumping = false;
  console.log(p);
  players.push(p);

}

function removePlayer(self, pId){
  var i;
  for( i in players ){
    if(pId == players[i].id){
      players[i].destroy();
    }
  }
}

function jump(id){

  var num;
  for(num in players){
    console.log(players[num].id);
    if(players[num].id == id){

  if (players[num].body.velocity.y == 0 && players[num].body.y > 500) {

    players[num].setVelocityY(-jumpForce);
    players[num].jumping = true;
    console.log("jumping");
  }}
}
}



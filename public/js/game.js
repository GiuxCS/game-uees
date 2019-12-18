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
var maxSpeed = 200;
var runningSpeed = 1;
var jumpForce = 1500;
var keyJump;
var players = [];
var jumping = false;
var pointer;
var background1;
var background2;
var backgroundSpeed = 10;
var myId;
var jumpTimer = 80;
var jumpTimerInit = 60;
var phoneJump = false;
var playerConnected = false;
var gn;
var overlapAdded = false;
var updateInterval = 5;
var spikeSpeed = 12;
var bulletSpeed = 8;
var running = true;
var vibrationTimer = 60;
var myScore = 0;
var myName = '';
var scoreMultipler = 0.002;
var scoreText;
var nameInput;


function preload() {

  //Aqui se cargan las imagenes del juego

  this.load.image('ship', 'assets/spaceShips_001.png');
  this.load.image('otherPlayer', 'assets/enemyBlack5.png');
  this.load.image('dinosaur', 'assets/dinosaur.png');
  this.load.image('background', 'assets/background.jpg');
  this.load.image('spike', 'assets/spike.png');
  this.load.image('bullet', 'assets/bullet.png');

  this.load.spritesheet('player', 'assets/player-sprites.png', { frameWidth: 16, frameHeight: 16, endFrame: 6 });

}

function create() {

  //Gyroscope

  gn = new GyroNorm();

  gn.init().then(function () {

    gn.start(function (data) {

      console.log("Beta:" + data.do.beta);

      debug.innerHTML = data.do.beta;

      if (data.do.beta > 45 && jumpTimer < 0 && !phoneJump) {

        debug.innerHTML = 'jumping'

        self.socket.emit('jump', myId);

        jumpTimer = jumpTimerInit;

        phoneJump = true;

      }

      if (data.do.beta < 45 && phoneJump) {

        phoneJump = false;
      }

    });
  }).catch(function (e) {
  });

  var debug = document.getElementById('debug');

  var self = this;

  background1 = this.add.image(640, 320, 'background');
  background2 = this.add.image(1920, 320, 'background');
  this.input.addPointer(1);

  this.cursors = this.input.keyboard.createCursorKeys();
  keyJump = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  pointer = this.input.activePointer;


  // animations

  var animJump = {
    key: 'jump',
    frames: this.anims.generateFrameNumbers('player', { start: 4, end: 4, first: 4 }),
    frameRate: 20,
    repeat: -1
  };
  var animRun = {
    key: 'run',
    frames: this.anims.generateFrameNumbers('player', { start: 1, end: 3 }),
    frameRate: 20,
    repeat: -1
  };
  var animHit = {
    key: 'hit',
    frames: this.anims.generateFrameNumbers('player', { start: 5, end: 5, first: 5 }),
    frameRate: 20,
    repeat: -1
  };
  var animStand = {
    key: 'stand',
    frames: this.anims.generateFrameNumbers('player', { start: 0, end: 0, first: 0 }),
    frameRate: 20,
    repeat: -1
  };


  this.anims.create(animRun);
  this.anims.create(animJump);
  this.anims.create(animHit);
  this.anims.create(animStand);



  this.socket = io();

  this.socket.on('playerInfo', function (id) {
    myId = id;
  })

  this.socket.on('currentPlayersInfo', function (playersInfo) {
    console.log('Adding Players');
    //console.log(playersInfo);

    Object.keys(playersInfo).forEach(function (id) {
      console.log('p:' + playersInfo[id])
      addPlayer(self, playersInfo[id]);
    })
  })


  this.socket.on('addPlayer', function (id) {

    console.log('adding player');
    addPlayer(self, id);
  })


  this.socket.on('removePlayer', function (id) {

    removePlayer(self, id);
  })

  this.socket.on('yourId', function (id) {

    myId = id;
    console.log('your id is: ' + myId);
  });

  //indica que un jugador ha saltado
  this.socket.on('playerJump', function (id) {

    //console.log('player ' + id + ' jumps');
    jump(id);


  });

  this.socket.on('updateAllPlayers', function (p) {
    //console.log('updating players');
    //console.log(p);
    updatePlayers(p);

  });

  this.socket.on('makeSpike', function (data) {

    spike.x = data.x;
    spikeSpeed = data.speed;
  });

  this.socket.on('makeBullet', function (data) {

    bullet.x = data.x;
    bulletSpeed = data.speed;
  });

  this.socket.on('scoresUpdate', function (scores) {

    console.log(scores);

    var text = ''
    var i;

    for (i in scores) {

      text += scores[i].name + ": " + Math.round(scores[i].score) + "\n";
    }

    scoreText.setText(text);
  })


  addSpike(this);
  addBullet(this);

  self.physics.world.setBounds(-120, 0, 1800, 566);

  scoreText = this.add.text(32, 32, 'score: 0', { fontSize: '32px', fill: '#000' });
  scoreText.strokeThickness = 2;
  scoreText.stroke = 0xffffff;

  nameInput = document.getElementById('name-input');
  nameInput.addEventListener('change',function(){
    
    myName = nameInput.value;

  });
}

function handleOrientation(event) {
  //console.log(event.beta);
  self = this;
  debug.innerHTML = event.beta;
  if (event.beta > 45 && jumpTimer < 0) {
    debug.innerHTML = 'jumping'
    self.socket.emit('jump', myId);
    jumpTimer = jumpTimerInit;

  }

}

function update() {

  if (!playerConnected) {
    this.socket.emit('connectToServer');
    playerConnected = true;
  }





  spike.body.rotation -= 10;
  spike.body.x -= spikeSpeed;

  bullet.body.x -= bulletSpeed;






  if (players) {

    var i;

    for (i in players) {

      if (players[i].id == myId) {

        if (!overlapAdded) {

          this.physics.add.overlap(players[i], spike, collision);
          this.physics.add.overlap(players[i], bullet, collision);

          overlapAdded = true;
        }

        myScore += scoreMultipler * (players[i].body.x / 100 * (players[i].body.x / 200));

        if (players[i].body.velocity.x <= 0) {

          players[i].body.velocity.x += 100;
        } else if (players[i].body.velocity.x >= maxSpeed) {
          players[i].body.velocity.x = maxSpeed;
        } else {
          players[i].body.velocity.x = 0.05 * (1000 - players[i].body.x);
        }

        if (players[i].body.x < 20) {
          players[i].body.x = 20;
        }

        if (players[i].body.velocity.x < 0) {

          if (vibrationTimer < 0) {
            window.navigator.vibrate([50, 30, 150]);
            vibrationTimer = 60;

          }
        }


      }



      if (players[i].body.y < 480) {

        players[i].anims.play('jump');
      } else {

        if (players[i].anims.currentAnim.key != 'run') {
          players[i].anims.play('run');
        }

      }
      if (players[i].body.velocity.x < 0) {


        players[i].anims.play('hit');
      }



      jumpTimer--;
      vibrationTimer--;


      if (pointer.isDown || keyJump.isDown || this.input.pointer1.isDown) {

        if (jumpTimer < 0) {
          //console.log('sending Jump');
          this.socket.emit('jump', myId);
          jumpTimer = jumpTimerInit;
        } else {

        }

      }

      if (updateInterval < 0) {

        var i;
        for (i in players) {
          if (players[i].id == myId) {

            var playerUpdate = {
              x: '',
              speed: '',
              score: 0,
            }

            playerUpdate.x = players[i].body.x;
            playerUpdate.speed = players[i].body.velocity.x;
            playerUpdate.score = myScore;
            playerUpdate.name = myName;

            console.log(playerUpdate);
            this.socket.emit('updatePlayer', playerUpdate);
          }


        }

        updateInterval = 20;


      }
      updateInterval--;
    }
  }


  background1.x -= backgroundSpeed;
  background2.x -= backgroundSpeed;

  if (background1.x <= -640) {
    background1.x = 1920;
  }
  if (background2.x <= -640) {
    background2.x = 1920;
  }
}

function collision() {


  var i;
  for (i in players) {
    //console.log(players[i].id + " " + myId);
    if (players[i].id == myId) {
      players[i].body.setVelocityX(-800);
    }

  }
}

function addSpike(self) {

  spike = self.physics.add.image(800, 100, 'spike').setDisplaySize(64, 64);
  spike.setCollideWorldBounds(true);

}

function addBullet(self) {

  bullet = self.physics.add.image(800, 300, 'bullet').setDisplaySize(128, 128);
  bullet.setCollideWorldBounds(true);
  bullet.body.setAllowGravity(false)

}

function addPlayer(self, player) {

  console.log('Adding player sprite: ');

  var p;

  p = self.physics.add.sprite(player.x, 100, 'player').setOrigin(0.5, 0.5).setDisplaySize(64, 64);
  p.anims.play('run', true);
  p.setCollideWorldBounds(true);
  console.log("color:" + player.color);


  p.setTint(player.color);

  p.id = player.id;
  p.body.x = player.x;
  p.body.speed.x = player.speed;

  p.jumping = false;
  //console.log(p);
  players.push(p);

  if (player.id == myId) {

    var c = player.color.substr(player.color.length - 6);

    document.getElementById('console').style.backgroundColor = "#" + c;
  }

}

function removePlayer(self, p) {


  var i;
  //console.log('Removing player:' + p.id);

  for (i in players) {
    //console.log(players[i].id + ' == ' + p.id);
    if (p.id == players[i].id) {

      //console.log("DESTROYING")
      players[i].destroy();
      players.splice(i, 1);
    }
  }
}

function jump(id) {

  var num;

  for (num in players) {
    //console.log(players[num].id);
    if (players[num].id == id) {

      if (players[num].body.velocity.y == 0 && players[num].body.y > 500) {

        players[num].setVelocityY(-jumpForce);
        players[num].jumping = true;

        //console.log("jumping");
      }
    }
  }
}

function updatePlayers(p) {

  var i;
  var k;

  for (i in players) {

    for (k in p) {

      if (players[i].id == myId) {


      } else if (players[i].id == p[k].id) {

        var y = players[i].body.y;
        players[i].setX(p[k].x)
        players[i].body.velocity.x = p[k].speed;

      }
    }
  }
}

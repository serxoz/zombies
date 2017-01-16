// MQTT
var wsbroker = "10.0.0.2";  //mqtt websocket enabled broker
var wsport = 1884 // port for above
var topic = "Zombies/ESP8266";
var vel;
var multiplicador=1; //para variar a velocidade do xogo.

var client = new Paho.MQTT.Client(wsbroker, wsport,
    "myclientid_" + parseInt(Math.random() * 100, 10));

client.onConnectionLost = function (responseObject) {
  console.log("connection lost: " + responseObject.errorMessage);
};

client.onMessageArrived = function (message) {
  console.log(message.destinationName, ' -- ', message.payloadString);
  if (message.payloadString.indexOf('vel') > -1) {
    var json = JSON.parse(message.payloadString);
    vel = parseFloat(json.vel);

    multiplicador = (vel/5)*2;
    // console.log(vel);
    // console.log(multiplicador);
  }
};

var options = {
  timeout: 3,
  onSuccess: function () {
    console.log("mqtt connected");
    // Connection succeeded; subscribe to our topic, you can add multile lines of these
    client.subscribe(topic, {qos: 1});

    //use the below if you want to publish to a topic on connect
    message = new Paho.MQTT.Message("Hello");
    message.destinationName = topic;
    client.send(message);
  },
  onFailure: function (message) {
    console.log("Connection failed: " + message.errorMessage);
  }
};

// GAME
// conexión MQTT
client.connect(options);

// Xogo
var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });

function preload () {
  game.load.image('nubes', 'assets/img/nubes3.jpg');
  game.load.image('edificios2', 'assets/img/edificios-2.png');
  game.load.image('edificios', 'assets/img/edificios.png');
  game.load.image('calle', 'assets/img/calle.png');
  game.load.spritesheet('zombi', 'assets/sprites/zombi.png', 125, 162, 17);
  game.load.spritesheet('girl', 'assets/sprites/gir_running.png', 90, 128, 8);
  game.load.bitmapFont('carrier_command', 'assets/fonts/carrier_command.png', 'assets/fonts/carrier_command.xml');
}

var nubes;
var edificios2;
var edificios;
var calle;
var zombi;
var girl;
var zombies_text;
var contador_zombies = 0;
var peligro_text;
var existe_zombie = false;
var timer_blink = 0;
var timer_zombie = 0;

function create () {
  game.physics.startSystem(Phaser.Physics.ARCADE);
  game.input.onDown.add(go_fullscreen, this);

  nubes = game.add.tileSprite(0, 0, 800, 600, 'nubes');
  edificios2 = game.add.tileSprite(0, 0, 800, 600, 'edificios2');
  edificios = game.add.tileSprite(0, 0, 800, 600, 'edificios');
  calle = game.add.tileSprite(0, 0, 800, 600, 'calle');

  zombies_text = game.add.bitmapText(20, 30, 'carrier_command','Z:'+contador_zombies.toString(),24);
  peligro_text = game.add.bitmapText(150, 200, 'carrier_command','',64);

  addZombi();

  girl = game.add.sprite(350, 440, 'girl');
  var walk_girl = girl.animations.add('walk');
  girl.animations.play('walk', 15 * multiplicador, true);
  game.physics.arcade.enable(girl);
  girl.body.enable = true;
  girl.body.immovable = true;
  girl.body.setCircle(28);

}

function update () {
  // Movemento do fondo
  nubes.tilePosition.x -= 0.5 * multiplicador;
  edificios2.tilePosition.x -= 1 * multiplicador;
  edificios.tilePosition.x -= 1.5 * multiplicador;
  calle.tilePosition.x -= 2.5 * multiplicador;

  // Spawn Zombi!!!
  // para probar, cada minuto
  if(!existe_zombie){
    timer_zombie += game.time.elapsed; //milisegundos
    if ( timer_zombie >= 6000 )    {
      timer_zombie -= 6000;
      addZombi();
    }
  }

  // Movemento do zombi
  // si corre mais km/h que o zombi
  if(existe_zombie){
    if(vel > 5){
      //console.log("corre mais que o zombi");
      zombi.body.velocity.x = -20;
    } else {
      //console.log("peligro!!!");
      zombi.body.velocity.x = 30;
    }
  }

  // si o zombi desaparece polo borde  NOTA: Falta si o zombi existe para evitar flood de console.log
  if(existe_zombie && zombi.x < 0-zombi.width){
    existe_zombie = false;
    console.log("librácheste!");
    zombi.kill();

    contador_zombies ++;
    // console.log(contador_zombies);
    zombies_text.text = 'Z:' + contador_zombies;
    peligro_text.text = '';
  }

  // facer parpadear o aviso de peligro_text
  if(existe_zombie){
    timer_blink += game.time.elapsed; //milisegundos
    if ( timer_blink >= 500 )    {
      timer_blink -= 500;
      peligro_text.visible = !peligro_text.visible;
    }
  }

  // Comprobamos si nos pilla o zombi
  game.physics.arcade.overlap(zombi, girl, collisionCallback);
}

function addZombi(){
  existe_zombie = true;
  peligro_text.text = 'PELIGRO';

  zombi = game.add.sprite(0, 400, 'zombi');
  var walk_zombi = zombi.animations.add('walk');
  zombi.animations.play('walk', 20, true);
  game.physics.arcade.enable(zombi);
  zombi.body.enable = true;
  zombi.body.setCircle(28);
}

function collisionCallback (zombi, girl) {
  existe_zombie = false;
  console.log("pilloute!");
  zombi.kill();

  contador_zombies --;
  // console.log(contador_zombies);
  zombies_text.text = 'Z:' + contador_zombies;
  peligro_text.text = '';

  // Saltito, cambiar a animación
  var bounce=game.add.tween(girl);
  bounce.to({ y: 410 }, 100, Phaser.Easing.Bounce.In);
  bounce.to({ y: 440 }, 100, Phaser.Easing.Bounce.In);
  bounce.start();
}

function go_fullscreen (){
  game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
  game.scale.startFullScreen();
}

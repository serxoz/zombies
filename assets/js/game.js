// MQTT
var wsbroker = "10.0.0.2";  //mqtt websocket enabled broker
var wsport = 1884 // port for above
var topic = "Zombies/ESP8266";
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
    var vel = parseFloat(json.vel);

    multiplicador = (vel/10)*2;
    console.log(vel);
    console.log(multiplicador);
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
function init() {
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
  }

  var nubes;
  var edificios2;
  var edificios;
  var calle;

  function create () {
    // game.physics.startSystem(Phaser.Physics.ARCADE);
    nubes = game.add.tileSprite(0, 0, 800, 600, 'nubes');
    edificios2 = game.add.tileSprite(0, 0, 800, 600, 'edificios2');
    edificios = game.add.tileSprite(0, 0, 800, 600, 'edificios');
    calle = game.add.tileSprite(0, 0, 800, 600, 'calle');

    var zombi = game.add.sprite(200, 400, 'zombi');
    var walk_zombi = zombi.animations.add('walk');
    zombi.animations.play('walk', 20, true);

    var girl = game.add.sprite(350, 440, 'girl');
    var walk_girl = girl.animations.add('walk');
    girl.animations.play('walk', 15 * multiplicador, true);
  }

  function update () {

    //console.log("update");
    nubes.tilePosition.x -= 0.5 * multiplicador;
    edificios2.tilePosition.x -= 1 * multiplicador;
    edificios.tilePosition.x -= 1.5 * multiplicador;
    calle.tilePosition.x -= 2.5 * multiplicador;
  }
}

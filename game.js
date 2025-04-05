const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: {
    preload: preload,
    create: create,
    update: update
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  }
};

const game = new Phaser.Game(config);

let player;
let shadows;
let timerText;
let score = 0;
let spawnRate = 2000; // Tiempo inicial entre apariciones de sombras
let lastSpawn = 0; // Marca el último momento en que apareció una sombra
let difficultyTimer = 0;
let lastLampUse = 0; // Tiempo del último uso de la lámpara
const lampCooldown = 500; // Enfriamiento en ms para usar la lámpara
let facingRight = true; // Dirección del jugador
let gameOverText;
let restartText;
let timerPaused = false; // Para controlar la pausa del temporizador

function preload() {
  // Cargar texturas
  this.load.image('ground', 'assets/mapa/mapa1.png');
  this.load.spritesheet('player', 'assets/sprites/player.png', { frameWidth: 128, frameHeight: 128 });
  this.load.spritesheet('shadow', 'assets/sprites/shadow.png', { frameWidth: 130, frameHeight: 130 }); // Sombra
}

function create() {
  // Crear el suelo
  const ground = this.physics.add.staticGroup();
  ground.create(400, 300, 'ground').setScale(1.01).refreshBody(); // Escalar el suelo

  // Crear el jugador
  player = this.physics.add.sprite(400, 400, 'player').setScale(2); // Aumentar tamaño
  player.setCollideWorldBounds(true);
  player.setSize(30, 115); // Ajustamos el tamaño físico
  player.setOffset(50, 5); // Ajustamos la posición del sprite dentro del cuerpo físico

  // Hacer que el jugador colisione con el suelo
  this.physics.add.collider(player, ground);

  // Teclas
  cursors = this.input.keyboard.createCursorKeys();

  // Crear grupo de sombras
  shadows = this.physics.add.group();

  // Detectar colisión entre sombras y el jugador
  this.physics.add.overlap(shadows, player, gameOver, null, this);

  // Animaciones de caminar
  this.anims.create({
    key: 'caminar',
    frames: this.anims.generateFrameNumbers('player', { start: 0, end: 5 }),
    frameRate: 10,
    repeat: -1
  });

  // Animaciones de volar del enemigo
  this.anims.create({
    key: 'fly',
    frames: this.anims.generateFrameNumbers('shadow', { start: 0, end: 2 }),
    frameRate: 4,
    repeat: -1
  });

  // Animación de ataque
  this.anims.create({
    key: 'atacar',
    frames: this.anims.generateFrameNumbers('player', { start: 6, end: 9 }), // Verifica que estos índices estén dentro del rango válido
    frameRate: 15,
    repeat: 0
  });

  // Temporizador en pantalla
  timerText = this.add.text(10, 10, 'Tiempo: 0', { fontSize: '30px', fill: '#FFFFFF', fontStyle: 'bold'  });

  // Temporizador que aumenta el puntaje
  this.time.addEvent({
    delay: 1000,
    callback: () => {
      if (!timerPaused) {
        score++;
        timerText.setText('Tiempo: ' + score);
      }
    },
    loop: true
  });

  // Evento para usar la lámpara
  this.input.keyboard.on('keydown-SPACE', () => useLamp(this));

  // Evento para ataque
  this.input.keyboard.on('keydown-SPACE', () => {
    // Solo se reproduce la animación de ataque si no se está reproduciendo otra animación
    if (!player.anims.isPlaying || player.anims.currentAnim.key !== 'atacar') { 
      player.anims.play('atacar', true);

      // Destruir sombras dentro del rango al atacar
      const attackRange = 150; // Ajusta el rango de ataque
      shadows.children.each(shadow => {
        const distance = Phaser.Math.Distance.Between(player.x, player.y, shadow.x, shadow.y);
        const isAligned = Math.abs(shadow.y - player.y) < 50;
        const isFacing = (facingRight && shadow.x > player.x) || (!facingRight && shadow.x < player.x);

        if (distance <= attackRange && isAligned && isFacing) {
          shadow.destroy();
        }
      });
    }
  });

  // Inicializar textos de "Game Over" ocultos
  gameOverText = this.add.text(400, 200, 'Game Over', {
    fontSize: '140px',
    fill: '#b80606ff',
    align: 'center',
    fontFamily: 'Arial', 
    fontStyle: 'bold' 
  });
  gameOverText.setOrigin(0.5);
  gameOverText.setVisible(false);

  restartText = this.add.text(400, 270, 'Presiona R para reiniciar', {
    fontSize: '20px',
    fill: '#FFFFFF',
    align: 'center',
    fontStyle: 'bold'
  });
  restartText.setOrigin(0.5);
  restartText.setVisible(false);

  // Evento para reiniciar el juego
  this.input.keyboard.on('keydown-R', () => restartGame(this));
}

function update(time, delta) {
  player.body.setVelocityX(0); // Resetear la velocidad en X

  if (!player.anims.isPlaying || player.anims.currentAnim.key !== 'atacar') { // Evitar mover mientras ataca
    if (cursors.left.isDown) {
      player.body.setVelocityX(-350);
      player.flipX = true;
      player.anims.play('caminar', true);
      facingRight = false;
    } else if (cursors.right.isDown) {
      player.body.setVelocityX(350);
      player.flipX = false;
      player.anims.play('caminar', true);
      facingRight = true;
    } else {
      player.setFrame(0); // Reposo
    }
  }

  // Spawnea sombras desde los lados
  if (time > lastSpawn + spawnRate) {
    spawnShadow(this);
    lastSpawn = time;
  }

  // Aumenta la dificultad cada 10 segundos
  if (time > difficultyTimer + 10000) {
    spawnRate = Math.max(500, spawnRate - 200); // Reduce el tiempo entre spawns
    difficultyTimer = time;
  }
}

function spawnShadow(scene) {
  const side = Phaser.Math.Between(0, 1); // 0: izquierda, 1: derecha
  const y = 400; // Nivel fijo de aparición igual al del jugador
  let x, velocityX, shadow;

  if (side === 0) {
    x = 0; // Aparece en el lado izquierdo
    velocityX = Phaser.Math.Between(150, 300); // Se mueve hacia la derecha
  } else {
    x = 800; // Aparece en el lado derecho
    velocityX = Phaser.Math.Between(-300, -150); // Se mueve hacia la izquierda
  }

  shadow = shadows.create(x, y, 'shadow').setScale(3); // Aumentar tamaño de la sombra
  shadow.setSize(30, 20);  // Ajusta el tamaño del hitbox de la sombra
  shadow.setOffset(46, 55);  // Ajusta la posición dentro del sprite
  shadow.setVelocity(velocityX, 0); // Movimiento horizontal
  shadow.setCollideWorldBounds(true);
  shadow.setBounce(1);

  // Reproducir la animación 'fly' para la sombra
  shadow.anims.play('fly', true); // Reproducir la animación de vuelo

  // Voltear la sombra según la dirección de su movimiento
  if (velocityX < 0) {
    shadow.flipX = true; // Voltea el sprite si se mueve hacia la izquierda
  } else {
    shadow.flipX = false; // No voltea el sprite si se mueve hacia la derecha
  }
}

function useLamp(scene) {
  const now = scene.time.now;
  if (now - lastLampUse < lampCooldown) {
    return; // Enfriamiento activo
  }

  lastLampUse = now;

  const lampRange = 150; // Distancia efectiva de la lámpara

  shadows.children.each(shadow => {
    const distance = Phaser.Math.Distance.Between(player.x, player.y, shadow.x, shadow.y);
    const isAligned = Math.abs(shadow.y - player.y) < 50;
    const isFacing = (facingRight && shadow.x > player.x) || (!facingRight && shadow.x < player.x);

    if (distance <= lampRange && isAligned && isFacing) {
      shadow.destroy();
    }
  });
}

function gameOver(player, shadow) {
  this.physics.pause();
  player.setTint(0xff0000);
  gameOverText.setVisible(true);
  restartText.setVisible(true);
  timerPaused = true; // Pausar el temporizador
}

function restartGame(scene) {
  score = 0;
  spawnRate = 2000;
  lastSpawn = 0;
  difficultyTimer = 0;
  timerPaused = false;

  shadows.clear(true, true);
  scene.physics.resume();

  player.setTint(0xffffff);
  player.setPosition(400, 400);

  gameOverText.setVisible(false);
  restartText.setVisible(false);
}

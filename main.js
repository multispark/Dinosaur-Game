const config = {
    type: Phaser.AUTO,
    width: 1000,
    height: 340,
    pixelArt: true,
    transparent: true,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: {
        preload: preload, 
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);
var cursors;
const height = config.height;
const width = config.width;
var dayRange = 200;
var nightRange = 100;

function preload () {
    this.load.audio('jump', 'assets/jump.m4a');
    this.load.audio('hit', 'assets/hit.m4a');
    this.load.audio('reach', 'assets/reach.m4a');

    this.load.image('ground', 'assets/ground.png');
    this.load.image('dino-idle', 'assets/dino-idle.png');
    this.load.image('dino-hurt', 'assets/dino-hurt.png');
    this.load.image('restart', 'assets/restart.png');
    this.load.image('game-over', 'assets/game-over.png');
    this.load.image('cloud', 'assets/cloud.png');

    this.load.spritesheet('star', 'assets/stars.png', {
      frameWidth: 9, frameHeight: 9
    });

    this.load.spritesheet('moon', 'assets/moon.png', {
      frameWidth: 20, frameHeight: 40
    });

    this.load.spritesheet('dino', 'assets/dino-run.png', {
      frameWidth: 88,
      frameHeight: 94
    })

    this.load.spritesheet('dino-down', 'assets/dino-down.png', {
      frameWidth: 118,
      frameHeight: 94
    })

    this.load.spritesheet('enemy-bird', 'assets/enemy-bird.png', {
      frameWidth: 92,
      frameHeight: 77
    })

    this.load.image('obstacle-1', 'assets/cactuses_small_1.png')
    this.load.image('obstacle-2', 'assets/cactuses_small_2.png')
    this.load.image('obstacle-3', 'assets/cactuses_small_3.png')
    this.load.image('obstacle-4', 'assets/cactuses_big_1.png')
    this.load.image('obstacle-5', 'assets/cactuses_big_2.png')
    this.load.image('obstacle-6', 'assets/cactuses_big_3.png')
}

function create() {
    this.gameSpeed = 10;
    this.respawnTime = 0;
    this.isGameRunning = false;
    this.score = 0;

    // adding sound effects
    this.jumpSound = this.sound.add('jump', {volume: 0.2});
    this.hitSound = this.sound.add('hit', {volume: 0.2});
    this.reachSound = this.sound.add('reach', {volume: 0.2});

    // adding game start trigger
    this.startTrigger = this.physics.add.sprite(0, 10).setOrigin(0, 1).setImmovable();
    
    // adding dino and ground
    this.ground = this.add.tileSprite(0, height, 88, 26, 'ground').setOrigin(0, 1);
    this.dino = this.physics.add.sprite(0, height, 'dino-idle')
        .setOrigin(0.5, 0.5)
        .setCollideWorldBounds(true)
        .setGravityY(5000)

    // adding background
    this.cameras.main.setBackgroundColor('#fff');
    this.background = this.add.group();
    this.background.addMultiple([
        this.add.image(width / 2, 170, 'cloud'),
        this.add.image(width - 88, 80, 'cloud'),
        this.add.image(width / 1.3, 100, 'cloud'),
    ]);
    // this.background.setAlpha(0);

    // creating score label
    this.scoreText = this.add
        .text(width, 0, '00000', {fill: '#535353', font: '900 35px Courier', resolution: 5})
        .setOrigin(1, 0)
        .setAlpha(0);

    // creating high score label
    this.highScoreText = this.add
        .text(width, 0, '00000', {fill: '#535353', font: '900 35px Courier', resolution: 5})
        .setOrigin(1, 0)
        .setAlpha(0);

    // creating game over screen
    this.gameOverScreen = this.add.container(width / 2, height / 2 - 50).setAlpha(0);
    this.gameOverText = this.add.image(0, 0, 'game-over');
    this.gameRestart = this.add.image(0, 80, 'restart').setInteractive();

    this.gameOverScreen.add([
        this.gameOverText, this.gameRestart
    ])

    // define obstacle group
    this.obstacles = this.physics.add.group();
        
    // creating cursor object
    cursors = this.input.keyboard.createCursorKeys();

    // creating animations for dino and bird
    this.anims.create({
        key: 'dino-run',
        frames: this.anims.generateFrameNumbers('dino', {start: 2, end: 3}),
        frameRate: 10,
        repeat: -1
    })
    this.anims.create({
        key: 'dino-down-anim',
        frames: this.anims.generateFrameNumbers('dino-down', {start: 0, end: 1}),
        frameRate: 10,
        repeat: -1
    })
    this.anims.create({
        key: 'enemy-dino-fly',
        frames: this.anims.generateFrameNumbers('enemy-bird', {start: 0, end: 1}),
        frameRate: 10,
        repeat: -1
    })

    // creating game over scenario
    this.physics.add.collider(this.dino, this.obstacles, () => {
        this.highScoreText.x = this.scoreText.x - this.scoreText.width - 20;

        const highScore = this.highScoreText.text.substr(this.highScoreText.text.length - 5);
        const newScore = Number(this.scoreText.text) > Number(highScore) ? this.scoreText.text : highScore;

        this.highScoreText.setText('HI ' + newScore).setAlpha(1);

        this.physics.pause();
        this.isGameRunning = false;
        this.anims.pauseAll();
        this.dino.setTexture('dino-hurt');
        this.respawnTime = 0;
        this.gameSpeed = 10;
        this.gameOverScreen.setAlpha(1);
        this.score = 0;
        this.hitSound.play();
    }, null, this)

    // creating trigger for start of game
    this.physics.add.overlap(this.startTrigger, this.dino, () => {
        if (this.startTrigger.y === 10) {
            this.startTrigger.body.reset(0, height);
            return;
        }

        this.startTrigger.disableBody(true, true);

        // creating event representing game
        const startEvent = this.time.addEvent({
            delay: 1000 / 60,
            loop: true,
            callbackScope: this,
            callback: () => {
                this.dino.setVelocityX(80);
                this.dino.play('dino-run', true);
        
                if (this.ground.width < width) {
                    this.ground.width += 17 * 2;
                }
        
                // start game
                if (this.ground.width >= width) {
                    this.ground.width = width;
                    this.isGameRunning = true;
                    this.dino.setVelocity(0);
                    this.scoreText.setAlpha(1);
                    // this.background.setAlpha(1);
                    startEvent.remove();
                }
            }
        })

    }, null, this);

    // updating score
    this.time.addEvent({
        delay: 1000 / 10,
        loop: true,
        callbackScope: this,
        callback: () => {
            if (!this.isGameRunning) { 
                return; 
            }
  
            this.score++;
            this.gameSpeed += 0.01;

            // play score sound every 100 points
            if (this.score % 100 === 0) {
                this.reachSound.play();
      
                // flashing score
                this.tweens.add({
                    targets: this.scoreText,
                    duration: 100,
                    repeat: 3,
                    alpha: 0,
                    yoyo: true
                })
            }

            const score = Array.from(String(this.score), Number);
            for (let i = 0; i < 5 - String(this.score).length; i++) {
                score.unshift(0);
            }
    
            this.scoreText.setText(score.join(''));
        }
    })
}

function update(time, delta) {
    if (this.isGameRunning) {
        // moving the ground and obstacles
        this.ground.tilePositionX += this.gameSpeed;
        Phaser.Actions.IncX(this.obstacles.getChildren(), -this.gameSpeed);
        Phaser.Actions.IncX(this.background.getChildren(), -0.5);

        // dino anims
        if (this.dino.body.deltaAbsY() > 0) {
            this.dino.anims.stop();
            this.dino.setTexture('dino');
        } else {
            this.dino.body.height <= 58 ? 
              this.dino.play('dino-down-anim', true): 
              this.dino.play('dino-run', true);
        }

        // spawning obstacles
        this.respawnTime += delta * this.gameSpeed * 0.08;

        if (this.respawnTime >= 1500) {
            const obstacleNum = Math.floor(Math.random() * 8) + 1;
            const distance = Phaser.Math.Between(600, 900);

            let obstacle;
        
            if (obstacleNum > 6) {
                const enemyHeight = [22, 82, 168];
                obstacle = this.obstacles
                    .create(width + distance, height - enemyHeight[Math.floor(Math.random() * 3)], 'enemy-bird');
                obstacle.play('enemy-dino-fly', true);
                obstacle.body.height = obstacle.body.height / 1.5;
            } else {
                obstacle = this.obstacles.create(width + distance, height, 'obstacle-' + obstacleNum);
                obstacle.body.offset.y += 10;
            }
        
            obstacle
                .setOrigin(0.5, 1)
                .setImmovable();


            this.respawnTime = 0;
        }

        // removing obstacles from memory after being used
        this.obstacles.getChildren().forEach(obstacle => {
            if (obstacle.getBounds().right < 0) {
                obstacle.destroy();
                console.log('removing obstacle')
            }
        })

        // removing background from memory after being used
        this.background.getChildren().forEach(object => {
            if (object.getBounds().right < 0) {
                object.x = width + 30;
                console.log('reloading background')
            }
        })
    }

    // dino controls
    if (cursors.up.isDown) {
        if (!this.dino.body.onFloor() || this.dino.body.velocity.x > 0){
            return;
        }

        this.dino.body.height = 92;
        this.dino.body.offset.y = 0;

        this.dino.setVelocityY(-1600);
        this.dino.setTexture('dino', 0);
        this.jumpSound.play();
    }
    else if (cursors.down.isDown || !this.isGameRunning) {
        if (!this.dino.body.onFloor()){
            return;
        }
        
        this.dino.body.height = 58;
        this.dino.body.offset.y = 34;
    }
    else if (cursors.down.isUp || this.isGameRunning) {
        this.dino.body.height = 92;
        this.dino.body.offset.y = 0;
    }

    // restarting the game
    this.gameRestart.on('pointerdown', () => {
        this.dino.setVelocityY(0);
        this.dino.body.height = 92;
        this.dino.body.offset.y = 0;
        this.physics.resume();
        this.obstacles.clear(true, true);
        this.isGameRunning = true;
        this.gameOverScreen.setAlpha(0);
        this.anims.resumeAll();
        this.cameras.main.setBackgroundColor('#fff');
        nightRange = 100;
        dayRange = 200;
    });

    // switching background scene
    if (this.score >= nightRange) {
        this.cameras.main.setBackgroundColor('#000');
        nightRange += 200;
    } else if (this.score >= dayRange) {
        this.cameras.main.setBackgroundColor('#fff');
        dayRange += 200;
    }
}
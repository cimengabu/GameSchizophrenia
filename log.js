// Konfigurasi game
const config = {
    type: Phaser.AUTO,
    width: 600,
    height: 664,
    parent: 'game-container',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [ PreloaderScene, MainMenuScene, GameScene, GameOverScene ]
};

// Inisialisasi game
const game = new Phaser.Game(config);

// ============================================
// SCENE PRELOADER - Loading semua asset
// ============================================
class PreloaderScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloaderScene' });
    }

    preload() {
        // Tampilkan loading bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Progress bar background
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width/2 - 200, height/2 - 30, 400, 50);
        
        // Text loading
        const loadingText = this.add.text(width/2, height/2 - 50, 'Loading...', { 
            fontSize: '20px', 
            fill: '#ff9900',
            fontFamily: 'Arial'
        });
        loadingText.setOrigin(0.5, 0.5);

        // Event listener untuk progress
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xff6600, 1);
            progressBar.fillRect(width/2 - 190, height/2 - 20, 380 * value, 30);
        });

        // Event saat selesai loading
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        // ========== LOAD ASSET GRAFIS ==========
        // Karena kita mungkin tidak punya asset asli, kita akan buat graphics sementara
        // Tapi jika punya asset asli, ganti dengan this.load.image()
        
        // Buat graphic untuk tileset (alternatif jika gambar tidak ada)
        this.createPlaceholderAssets();
        
        // Load audio (opsional - jika tidak ada, akan menggunakan silent fallback)
        this.load.audio('munch', ['assets/audio/munch.mp3']);
        this.load.audio('power-up', ['assets/audio/power-up.mp3']);
        this.load.audio('ghost-eat', ['assets/audio/ghost-eat.mp3']);
        this.load.audio('game-over', ['assets/audio/game-over.mp3']);
        this.load.audio('start', ['assets/audio/start.mp3']);
    }

    createPlaceholderAssets() {
        // Buat tileset secara prosedural (sebagai fallback)
        const tileCanvas = this.textures.createCanvas('tiles', 128, 128);
        const ctx = tileCanvas.context;
        
        // Wall tile (hitam dengan border ungu)
        ctx.fillStyle = '#0a0a2a';
        ctx.fillRect(0, 0, 32, 32);
        ctx.strokeStyle = '#8a2be2';
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, 28, 28);
        
        // Path tile (abu-abu gelap)
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(32, 0, 32, 32);
        
        // Candy tile (permen)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(48 + 16, 16, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff69b4';
        ctx.beginPath();
        ctx.arc(48 + 20, 12, 2, 0, Math.PI * 2);
        ctx.fill();
        
        tileCanvas.refresh();
        
        // Buat sprite labu (Jack-o-Lantern)
        const pumpkinCanvas = this.textures.createCanvas('pumpkin', 32, 32);
        const pCtx = pumpkinCanvas.context;
        
        // Badan labu
        pCtx.fillStyle = '#ff6600';
        pCtx.beginPath();
        pCtx.ellipse(16, 16, 12, 14, 0, 0, Math.PI * 2);
        pCtx.fill();
        
        // Mata
        pCtx.fillStyle = '#000000';
        pCtx.beginPath();
        pCtx.arc(10, 12, 3, 0, Math.PI * 2);
        pCtx.fill();
        pCtx.beginPath();
        pCtx.arc(22, 12, 3, 0, Math.PI * 2);
        pCtx.fill();
        
        // Mulut (bentuk seram)
        pCtx.fillStyle = '#000000';
        pCtx.beginPath();
        pCtx.arc(16, 22, 6, 0.2, Math.PI - 0.2);
        pCtx.lineTo(16, 22);
        pCtx.fill();
        
        // Tangkai
        pCtx.fillStyle = '#00aa00';
        pCtx.fillRect(14, 2, 4, 6);
        
        pumpkinCanvas.refresh();
        
        // Buat hantu
        const ghostColors = ['#ff4444', '#ff99cc', '#66ccff', '#ffaa33'];
        const ghostNames = ['ghost-red', 'ghost-pink', 'ghost-blue', 'ghost-orange'];
        
        ghostColors.forEach((color, index) => {
            const ghostCanvas = this.textures.createCanvas(ghostNames[index], 32, 32);
            const gCtx = ghostCanvas.context;
            
            // Badan hantu
            gCtx.fillStyle = color;
            gCtx.beginPath();
            gCtx.arc(16, 12, 12, 0, Math.PI * 2);
            gCtx.fill();
            gCtx.fillRect(4, 12, 24, 16);
            
            // Mata
            gCtx.fillStyle = '#ffffff';
            gCtx.beginPath();
            gCtx.arc(10, 10, 3, 0, Math.PI * 2);
            gCtx.fill();
            gCtx.beginPath();
            gCtx.arc(22, 10, 3, 0, Math.PI * 2);
            gCtx.fill();
            
            gCtx.fillStyle = '#000000';
            gCtx.beginPath();
            gCtx.arc(9, 9, 1.5, 0, Math.PI * 2);
            gCtx.fill();
            gCtx.beginPath();
            gCtx.arc(21, 9, 1.5, 0, Math.PI * 2);
            gCtx.fill();
            
            ghostCanvas.refresh();
        });
        
        // Buat candy
        const candyCanvas = this.textures.createCanvas('candy', 16, 16);
        const cCtx = candyCanvas.context;
        cCtx.fillStyle = '#ff69b4';
        cCtx.beginPath();
        cCtx.arc(8, 8, 4, 0, Math.PI * 2);
        cCtx.fill();
        cCtx.fillStyle = '#ffffff';
        cCtx.beginPath();
        cCtx.arc(10, 6, 1, 0, Math.PI * 2);
        cCtx.fill();
        candyCanvas.refresh();
        
        // Buat power pumpkin
        const powerCanvas = this.textures.createCanvas('power-pumpkin', 24, 24);
        const pwCtx = powerCanvas.context;
        pwCtx.fillStyle = '#ffaa00';
        pwCtx.beginPath();
        pwCtx.ellipse(12, 12, 10, 12, 0, 0, Math.PI * 2);
        pwCtx.fill();
        pwCtx.fillStyle = '#ffffff';
        pwCtx.beginPath();
        pwCtx.arc(8, 8, 2, 0, Math.PI * 2);
        pwCtx.fill();
        pwCtx.beginPath();
        pwCtx.arc(16, 8, 2, 0, Math.PI * 2);
        pwCtx.fill();
        pwCtx.fillStyle = '#000000';
        pwCtx.beginPath();
        pwCtx.ellipse(12, 16, 4, 2, 0, 0, Math.PI * 2);
        pwCtx.fill();
        powerCanvas.refresh();
    }

    create() {
        // Animasi untuk labu (munch)
        this.anims.create({
            key: 'munch',
            frames: [
                { key: 'pumpkin' },
                { key: 'pumpkin' },
                { key: 'pumpkin' }
            ],
            frameRate: 10,
            repeat: -1
        });
        
        this.scene.start('MainMenuScene');
    }
}

// ============================================
// SCENE MAIN MENU
// ============================================
class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
        // Background gelap dengan efek bintang
        this.add.rectangle(0, 0, 600, 664, 0x0a0a0a).setOrigin(0);
        
        // Judul game
        this.add.text(centerX, 100, 'HALLOWEEN', { 
            fontSize: '48px', 
            fill: '#ff6600',
            fontFamily: 'Arial',
            stroke: '#8a2be2',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        this.add.text(centerX, 160, 'PAC-MAN', { 
            fontSize: '48px', 
            fill: '#ff6600',
            fontFamily: 'Arial',
            stroke: '#8a2be2',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Karakter labu
        const pumpkin = this.add.sprite(centerX - 50, 250, 'pumpkin');
        pumpkin.setScale(2);
        
        // Hantu
        const ghost = this.add.sprite(centerX + 50, 250, 'ghost-red');
        ghost.setScale(2);
        
        // Instruksi
        this.add.text(centerX, 350, 'Gunakan Arrow Keys untuk bergerak', { 
            fontSize: '18px', 
            fill: '#ffffff' 
        }).setOrigin(0.5);
        
        this.add.text(centerX, 380, 'Makan semua permen untuk menang!', { 
            fontSize: '18px', 
            fill: '#ffffff' 
        }).setOrigin(0.5);
        
        this.add.text(centerX, 410, 'Power Pumpkin membuat hantu takut', { 
            fontSize: '18px', 
            fill: '#ffaa00' 
        }).setOrigin(0.5);
        
        // Tombol Start
        const startButton = this.add.text(centerX, 500, 'TEKAN SPACE UNTUK MULAI', { 
            fontSize: '24px', 
            fill: '#00ff00',
            backgroundColor: '#330033',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();
        
        startButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
        
        // Input keyboard
        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
        
        // Efek berkedip
        this.tweens.add({
            targets: startButton,
            alpha: 0.5,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }
}

// ============================================
// SCENE GAME UTAMA
// ============================================
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        
        // Grid system untuk Pac-Man
        this.gridSize = 16;
        this.speed = 150;
        this.threshold = 3;
        this.marker = new Phaser.Geom.Point();
        this.turnPoint = new Phaser.Geom.Point();
        this.directions = [ null, null, null, null, null ];
        this.currentDirection = this.Direction.NONE;
        this.turningDirection = this.Direction.NONE;
        this.score = 0;
        this.lives = 3;
        this.ghostsFrightened = false;
        this.frightenedTimer = null;
    }

    // Enum untuk direction
    static get Direction() {
        return {
            NONE: 0,
            LEFT: 1,
            RIGHT: 2,
            UP: 3,
            DOWN: 4
        };
    }

    create() {
        // ===== SETUP MAP =====
        // Buat tilemap sederhana
        this.map = this.make.tilemap({ 
            tileWidth: 32, 
            tileHeight: 32, 
            width: 19, 
            height: 21 
        });
        
        const tileset = this.map.addTilesetImage('tiles', null, 32, 32, 0, 0);
        this.layer = this.map.createBlankLayer('layer1', tileset);
        
        // Desain labirin Halloween
        const mapLayout = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
            [1,0,1,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,1],
            [1,0,1,0,1,1,0,1,1,1,1,1,0,1,1,0,1,0,1],
            [1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
            [1,0,1,1,1,0,1,1,0,1,0,1,1,0,1,1,1,0,1],
            [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1],
            [1,0,1,1,0,1,1,0,1,1,1,0,1,1,0,1,1,0,1],
            [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
            [1,1,0,1,1,1,1,0,1,1,1,0,1,1,1,1,0,1,1],
            [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1],
            [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1],
            [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
            [1,1,0,1,0,1,1,0,1,1,1,0,1,1,0,1,0,1,1],
            [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1],
            [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
            [1,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,1],
            [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];
        
        // Isi layer dengan tiles
        for (let y = 0; y < mapLayout.length; y++) {
            for (let x = 0; x < mapLayout[y].length; x++) {
                if (mapLayout[y][x] === 1) {
                    // Wall tile
                    this.layer.putTileAt(1, x, y);
                } else {
                    // Path tile
                    this.layer.putTileAt(0, x, y);
                }
            }
        }
        
        // Set collision untuk wall (tile index 1)
        this.map.setCollision(1, true, this.layer);
        
        // ===== BUAT PERMEN (CANDY) =====
        this.candies = this.physics.add.staticGroup();
        
        for (let y = 0; y < mapLayout.length; y++) {
            for (let x = 0; x < mapLayout[y].length; x++) {
                if (mapLayout[y][x] === 0) {
                    // Tambahkan permen di semua path
                    // Kecuali area tertentu untuk power pumpkin
                    if (!(x === 9 && y === 10)) { // Tengah maze
                        const candy = this.candies.create(x * 32 + 16, y * 32 + 16, 'candy');
                        candy.setScale(0.8);
                    }
                }
            }
        }
        
        // ===== BUAT POWER PUMPKIN =====
        this.powerPumpkins = this.physics.add.staticGroup();
        
        // Tempatkan di 4 sudut
        const powerPositions = [
            [1, 1], [17, 1], [1, 19], [17, 19]
        ];
        
        powerPositions.forEach(pos => {
            const pumpkin = this.powerPumpkins.create(pos[0] * 32 + 16, pos[1] * 32 + 16, 'power-pumpkin');
            pumpkin.setScale(1.2);
        });
        
        // ===== BUAT PEMAIN (LABU) =====
        this.player = this.physics.add.sprite(9 * 32 + 16, 15 * 32 + 16, 'pumpkin');
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(20, 20);
        this.player.play('munch');
        
        // ===== BUAT HANTU =====
        this.ghosts = this.physics.add.group();
        
        const ghostTypes = [
            { key: 'ghost-red', x: 9, y: 9, color: 'red' },
            { key: 'ghost-pink', x: 8, y: 10, color: 'pink' },
            { key: 'ghost-blue', x: 10, y: 10, color: 'blue' },
            { key: 'ghost-orange', x: 9, y: 11, color: 'orange' }
        ];
        
        ghostTypes.forEach(type => {
            const ghost = this.ghosts.create(type.x * 32 + 16, type.y * 32 + 16, type.key);
            ghost.setCollideWorldBounds(true);
            ghost.body.setSize(20, 20);
            ghost.color = type.color;
            ghost.direction = this.getRandomDirection();
            ghost.speed = 100;
            ghost.frightened = false;
            this.physics.add.collider(ghost, this.layer);
        });
        
        // ===== SETUP COLLISIONS =====
        this.physics.add.collider(this.player, this.layer);
        this.physics.add.overlap(this.player, this.candies, this.eatCandy, null, this);
        this.physics.add.overlap(this.player, this.powerPumpkins, this.eatPowerPumpkin, null, this);
        this.physics.add.overlap(this.player, this.ghosts, this.hitGhost, null, this);
        
        // ===== UI =====
        this.scoreText = this.add.text(10, 10, 'Score: 0', { 
            fontSize: '18px', 
            fill: '#ffffff' 
        });
        
        this.livesText = this.add.text(500, 10, 'Lives: 3', { 
            fontSize: '18px', 
            fill: '#ffffff' 
        });
        
        // ===== INPUT =====
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Mulai gerak
        this.move(this.Direction.RIGHT);
    }

    update(time, delta) {
        if (!this.player) return;
        
        // Update marker posisi grid
        this.marker.x = Phaser.Math.Snap.Floor(Math.floor(this.player.x), this.gridSize) / this.gridSize;
        this.marker.y = Phaser.Math.Snap.Floor(Math.floor(this.player.y), this.gridSize) / this.gridSize;
        
        // Cek tile di sekitar
        this.directions[this.Direction.LEFT] = this.map.getTileAt(this.marker.x - 1, this.marker.y);
        this.directions[this.Direction.RIGHT] = this.map.getTileAt(this.marker.x + 1, this.marker.y);
        this.directions[this.Direction.UP] = this.map.getTileAt(this.marker.x, this.marker.y - 1);
        this.directions[this.Direction.DOWN] = this.map.getTileAt(this.marker.x, this.marker.y + 1);
        
        // Cek input
        this.checkInput();
        
        // Proses turning jika ada
        if (this.turningDirection !== this.Direction.NONE) {
            this.processTurn();
        }
        
        // Gerakkan hantu
        this.moveGhosts();
    }

    checkInput() {
        if (this.cursors.left.isDown && this.currentDirection !== this.Direction.LEFT) {
            this.checkDirection(this.Direction.LEFT);
        } else if (this.cursors.right.isDown && this.currentDirection !== this.Direction.RIGHT) {
            this.checkDirection(this.Direction.RIGHT);
        } else if (this.cursors.up.isDown && this.currentDirection !== this.Direction.UP) {
            this.checkDirection(this.Direction.UP);
        } else if (this.cursors.down.isDown && this.currentDirection !== this.Direction.DOWN) {
            this.checkDirection(this.Direction.DOWN);
        } else {
            // Harus hold tombol untuk belok
            this.turningDirection = this.Direction.NONE;
        }
    }

    checkDirection(turnTo) {
        // Cek apakah bisa belok
        if (this.turningDirection === turnTo || 
            this.directions[turnTo] === null || 
            this.directions[turnTo].index === 1) {
            return;
        }
        
        // Jika lawan arah, langsung belok
        if (this.isOpposite(this.currentDirection, turnTo)) {
            this.move(turnTo);
        } else {
            this.turningDirection = turnTo;
            this.turnPoint.x = (this.marker.x * this.gridSize) + (this.gridSize / 2);
            this.turnPoint.y = (this.marker.y * this.gridSize) + (this.gridSize / 2);
        }
    }

    isOpposite(dir1, dir2) {
        return (dir1 === this.Direction.LEFT && dir2 === this.Direction.RIGHT) ||
               (dir1 === this.Direction.RIGHT && dir2 === this.Direction.LEFT) ||
               (dir1 === this.Direction.UP && dir2 === this.Direction.DOWN) ||
               (dir1 === this.Direction.DOWN && dir2 === this.Direction.UP);
    }

    processTurn() {
        const cx = Math.floor(this.player.x);
        const cy = Math.floor(this.player.y);
        
        // Cek apakah sudah sampai di titik belok
        if (!Phaser.Math.Fuzzy.Equal(cx, this.turnPoint.x, this.threshold) || 
            !Phaser.Math.Fuzzy.Equal(cy, this.turnPoint.y, this.threshold)) {
            return;
        }
        
        // Grid align
        this.player.x = this.turnPoint.x;
        this.player.y = this.turnPoint.y;
        this.player.body.reset(this.turnPoint.x, this.turnPoint.y);
        
        this.move(this.turningDirection);
        this.turningDirection = this.Direction.NONE;
    }

    move(direction) {
        if (direction === this.Direction.NONE) return;
        
        // Set velocity
        let speed = this.speed;
        
        switch(direction) {
            case this.Direction.LEFT:
                this.player.body.setVelocityX(-speed);
                this.player.body.setVelocityY(0);
                this.player.angle = 180;
                break;
            case this.Direction.RIGHT:
                this.player.body.setVelocityX(speed);
                this.player.body.setVelocityY(0);
                this.player.angle = 0;
                break;
            case this.Direction.UP:
                this.player.body.setVelocityY(-speed);
                this.player.body.setVelocityX(0);
                this.player.angle = -90;
                break;
            case this.Direction.DOWN:
                this.player.body.setVelocityY(speed);
                this.player.body.setVelocityX(0);
                this.player.angle = 90;
                break;
        }
        
        this.currentDirection = direction;
    }

    moveGhosts() {
        this.ghosts.getChildren().forEach(ghost => {
            // Gerakkan hantu random sederhana (untuk demo)
            // Untuk AI kompleks bisa ditambahkan nanti
            if (Phaser.Math.Between(0, 100) < 2) { // 2% chance ganti arah
                ghost.direction = this.getRandomDirection();
            }
            
            // Set velocity berdasarkan direction
            switch(ghost.direction) {
                case this.Direction.LEFT:
                    ghost.body.setVelocityX(-ghost.speed);
                    ghost.body.setVelocityY(0);
                    break;
                case this.Direction.RIGHT:
                    ghost.body.setVelocityX(ghost.speed);
                    ghost.body.setVelocityY(0);
                    break;
                case this.Direction.UP:
                    ghost.body.setVelocityY(-ghost.speed);
                    ghost.body.setVelocityX(0);
                    break;
                case this.Direction.DOWN:
                    ghost.body.setVelocityY(ghost.speed);
                    ghost.body.setVelocityX(0);
                    break;
            }
        });
    }

    getRandomDirection() {
        return Phaser.Math.Between(1, 4);
    }

    eatCandy(player, candy) {
        candy.destroy();
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
        
        // Cek apakah semua permen habis
        if (this.candies.countActive() === 0) {
            this.winGame();
        }
    }

    eatPowerPumpkin(player, pumpkin) {
        pumpkin.destroy();
        this.score += 50;
        this.scoreText.setText('Score: ' + this.score);
        
        // Aktifkan mode frightened
        this.activateFrightenedMode();
    }

    activateFrightenedMode() {
        this.ghostsFrightened = true;
        
        // Ubah warna hantu jadi biru ketakutan
        this.ghosts.getChildren().forEach(ghost => {
            ghost.frightened = true;
            ghost.setTint(0x3333ff);
            ghost.speed = 50; // Lebih lambat
        });
        
        // Timer untuk kembali normal
        if (this.frightenedTimer) {
            this.frightenedTimer.remove();
        }
        
        this.frightenedTimer = this.time.addEvent({
            delay: 8000, // 8 detik
            callback: () => {
                this.ghostsFrightened = false;
                this.ghosts.getChildren().forEach(ghost => {
                    ghost.frightened = false;
                    ghost.clearTint();
                    ghost.speed = 100;
                });
            }
        });
    }

    hitGhost(player, ghost) {
        if (this.ghostsFrightened) {
            // Makan hantu
            ghost.setVisible(false);
            ghost.body.enable = false;
            this.score += 200;
            this.scoreText.setText('Score: ' + this.score);
            
            // Respawn hantu setelah beberapa detik
            this.time.delayedCall(3000, () => {
                ghost.setVisible(true);
                ghost.body.enable = true;
            });
        } else {
            // Kehilangan nyawa
            this.lives--;
            this.livesText.setText('Lives: ' + this.lives);
            
            if (this.lives <= 0) {
                this.gameOver();
            } else {
                // Reset posisi
                this.player.setPosition(9 * 32 + 16, 15 * 32 + 16);
                this.player.body.setVelocity(0);
                
                // Reset hantu
                this.ghosts.getChildren().forEach((ghost, index) => {
                    const startPos = [
                        [9, 9], [8, 10], [10, 10], [9, 11]
                    ];
                    ghost.setPosition(startPos[index][0] * 32 + 16, startPos[index][1] * 32 + 16);
                    ghost.body.setVelocity(0);
                });
                
                this.currentDirection = this.Direction.NONE;
                this.turningDirection = this.Direction.NONE;
            }
        }
    }

    gameOver() {
        this.scene.start('GameOverScene', { score: this.score, win: false });
    }

    winGame() {
        this.scene.start('GameOverScene', { score: this.score, win: true });
    }
}

// ============================================
// SCENE GAME OVER
// ============================================
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.finalScore = data.score || 0;
        this.isWin = data.win || false;
    }

    create() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
        // Background
        this.add.rectangle(0, 0, 600, 664, 0x0a0a0a).setOrigin(0);
        
        if (this.isWin) {
            this.add.text(centerX, 200, 'VICTORY!', { 
                fontSize: '48px', 
                fill: '#ffff00',
                stroke: '#ff6600',
                strokeThickness: 4
            }).setOrigin(0.5);
            
            this.add.text(centerX, 280, 'Semua Permen Habis!', { 
                fontSize: '24px', 
                fill: '#ffffff' 
            }).setOrigin(0.5);
        } else {
            this.add.text(centerX, 200, 'GAME OVER', { 
                fontSize: '48px', 
                fill: '#ff0000',
                stroke: '#660000',
                strokeThickness: 4
            }).setOrigin(0.5);
            
            this.add.text(centerX, 280, 'Hantu Menang...', { 
                fontSize: '24px', 
                fill: '#ffffff' 
            }).setOrigin(0.5);
        }
        
        this.add.text(centerX, 350, 'Score Akhir: ' + this.finalScore, { 
            fontSize: '32px', 
            fill: '#ffaa00' 
        }).setOrigin(0.5);
        
        const restartButton = this.add.text(centerX, 450, 'MAIN LAGI', { 
            fontSize: '28px', 
            fill: '#00ff00',
            backgroundColor: '#330033',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();
        
        restartButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
        
        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
    }
}
// ECO RESGATE: Missão E-lixo - Jogo em Phaser.js
// Arquivo: js/game.js
// VERSÃO CORRIGIDA - LAYOUT DESKTOP E MOBILE SEPARADOS

console.log('✅ game.js carregado - Versão Corrigida');

// Detectar dispositivo móvel
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isTablet = /iPad|Android|Tablet/i.test(navigator.userAgent);

// Configuração do jogo
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#228B22',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Variáveis globais do jogo
let player, cursors, items;
let inventory = {};
let score = 0;
let scoreText, timeText, targetScoreText, itemsCountText;
let inventoryTexts = {};
let gameTime = 120;
let targetScore = 100;
let gameOver = false;
let gameStarted = false;
let gameWon = false;
let startTime;
let lastSpawnTime = 0;
let spawnInterval = 2000;
let itemLifetime = 8000;
let backgroundMusic;
let touchControls = {};

// Estados do jogador
let playerDirection = "down";
let playerState = "idle";
let animationFrame = 0;
let lastUpdate = 0;
let animationSpeed = 200;

// Tipos de itens
const eWasteTypes = ['bateria', 'placa', 'celular', 'fio'];
const commonWasteTypes = ['papel', 'metal', 'plastico', 'vidro'];
const allItemTypes = [...eWasteTypes, ...commonWasteTypes];

// Pontos de reciclagem
const recyclingPoints = [
    { type: 'bateria', x: 90, y: 80, width: 80, height: 80 },
    { type: 'placa', x: 180, y: 80, width: 80, height: 80 },
    { type: 'celular', x: 270, y: 80, width: 80, height: 80 },
    { type: 'fio', x: 360, y: 80, width: 80, height: 80 }
];

// Variáveis para armazenar elementos da UI
let startScreenElements = [];
let gameOverElements = [];
let mobileControls = [];

// Inicializar o jogo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando jogo...');
    console.log('📱 Dispositivo:', isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop');
    const game = new Phaser.Game(config);
});

function preload() {
    console.log('📦 Carregando assets...');
    
    // Sprites do personagem
    this.load.image('idle_down', 'assets/sprite_00_idle_front.png');
    this.load.image('walk_down_1', 'assets/sprite_01_walking_front_leg_right_up.png');
    this.load.image('walk_down_2', 'assets/sprite_02_walking_front_leg_left_up.png');
    this.load.image('idle_up', 'assets/sprite_03_idle_back.png');
    this.load.image('walk_up_1', 'assets/sprite_04_walking_back_leg_left_up.png');
    this.load.image('walk_up_2', 'assets/sprite_05_walking_back_leg_right_up.png');
    this.load.image('idle_left', 'assets/sprite_06_idle_side_view_left.png');
    this.load.image('walk_left_1', 'assets/sprite_08_walking_left_side_view_leg_right.png');
    this.load.image('walk_left_2', 'assets/sprite_09_walking_left_side_view_leg_left.png');
    this.load.image('idle_right', 'assets/sprite_07_idle_side_view_right.png');
    this.load.image('walk_right_1', 'assets/sprite_10_walking_right_side_view_leg_right.png');
    this.load.image('walk_right_2', 'assets/sprite_11_walking_right_side_view_leg_left.png');
    
    // Sprites dos itens
    this.load.image('bateria', 'assets/sprite_bateria.png');
    this.load.image('placa', 'assets/sprite_placa.png');
    this.load.image('celular', 'assets/sprite_celular.png');
    this.load.image('fio', 'assets/sprite_fio_eletrico.png');
    this.load.image('papel', 'assets/sprite_papel.png');
    this.load.image('metal', 'assets/sprite_metal.png');
    this.load.image('plastico', 'assets/sprite_plastico.png');
    this.load.image('vidro', 'assets/sprite_vidro.png');
    
    // Sprites das lixeiras
    this.load.image('lixeira_bateria', 'assets/sprite_coleta_vermelha_bateria.png');
    this.load.image('lixeira_placa', 'assets/sprite_coleta_azul_placa.png');
    this.load.image('lixeira_celular', 'assets/sprite_coleta_roxo_celular.png');
    this.load.image('lixeira_fio', 'assets/sprite_coleta_laranja_fio.png');
    
    // Carregar música de fundo
    this.load.audio('backgroundMusic', 'assets/musica_fundo.mp3');
    
    // Carregar efeitos sonoros para os itens
    this.load.audio('coletarEletronico', 'assets/som_coletar_eletronico.mp3');
    this.load.audio('coletarComum', 'assets/som_coletar_comum.mp3');
    this.load.audio('entregarItem', 'assets/som_entregar_item.mp3');
    this.load.audio('itemDesaparece', 'assets/som_item_desaparece.mp3');
    
    this.load.on('complete', function() {
        console.log('✅ Todos os assets carregados!');
        const carregandoElement = document.querySelector('.carregando-jogo');
        if (carregandoElement) {
            carregandoElement.style.display = 'none';
        }
    });
}

function create() {
    console.log('🎮 Criando cena do jogo...');
    
    // Inicializar inventário
    eWasteTypes.forEach(type => inventory[type] = false);
    
    // Criar pontos de reciclagem
    createRecyclingPoints.call(this);
    
    // Criar personagem
    createPlayer.call(this);
    
    // Configurar controles baseados no dispositivo
    if (isMobile || isTablet) {
        console.log('👆 Configurando controles touch...');
        createTouchControls.call(this);
    } else {
        console.log('⌨️ Configurando controles teclado...');
        // Controles de teclado para desktop
        cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown-ENTER', startGame, this);
        this.input.keyboard.on('keydown-SPACE', restartGame, this);
    }
    
    // Criar interface
    createUI.call(this);
    
    // Mostrar tela de start
    showStartScreen.call(this);
}

function createRecyclingPoints() {
    recyclingPoints.forEach(point => {
        // Lixeira
        this.add.image(point.x + point.width/2, point.y + point.height/2, `lixeira_${point.type}`)
            .setDisplaySize(80, 80)
            .setDepth(1);
        
        // Nome do tipo
        this.add.text(point.x + 5, point.y + 85, point.type, {
            fontSize: '16px',
            color: '#000000',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#ffffff',
            padding: { left: 5, right: 5, top: 2, bottom: 2 }
        }).setDepth(2);
    });
}

function createPlayer() {
    player = this.physics.add.sprite(400, 400, 'idle_down')
        .setDisplaySize(50, 50)
        .setDepth(3);
    player.setCollideWorldBounds(true);
    player.setSize(50, 50);
}

function createTouchControls() {
    // Limpar controles anteriores
    mobileControls.forEach(control => {
        if (control && control.destroy) control.destroy();
    });
    mobileControls = [];
    
    const controlSize = 40;
    const padding = 30;
    
    // Controle direcional (esquerda)
    const upBtn = this.add.circle(padding + controlSize, 600 - padding - controlSize * 2, controlSize, 0x000000, 0.5)
        .setInteractive()
        .setDepth(10);
    
    const downBtn = this.add.circle(padding + controlSize, 600 - padding, controlSize, 0x000000, 0.5)
        .setInteractive()
        .setDepth(10);
    
    const leftBtn = this.add.circle(padding, 600 - padding - controlSize, controlSize, 0x000000, 0.5)
        .setInteractive()
        .setDepth(10);
    
    const rightBtn = this.add.circle(padding + controlSize * 2, 600 - padding - controlSize, controlSize, 0x000000, 0.5)
        .setInteractive()
        .setDepth(10);
    
    // Ícones nos botões
    this.add.text(upBtn.x, upBtn.y, '⬆️', { fontSize: '24px' }).setOrigin(0.5).setDepth(11);
    this.add.text(downBtn.x, downBtn.y, '⬇️', { fontSize: '24px' }).setOrigin(0.5).setDepth(11);
    this.add.text(leftBtn.x, leftBtn.y, '⬅️', { fontSize: '24px' }).setOrigin(0.5).setDepth(11);
    this.add.text(rightBtn.x, rightBtn.y, '➡️', { fontSize: '24px' }).setOrigin(0.5).setDepth(11);
    
    // Botão de ação (direita)
    const actionBtn = this.add.circle(800 - padding - controlSize, 600 - padding - controlSize, controlSize * 1.2, 0x00aa00, 0.7)
        .setInteractive()
        .setDepth(10);
    
    this.add.text(actionBtn.x, actionBtn.y, '▶️', { fontSize: '24px' }).setOrigin(0.5).setDepth(11);
    
    // Armazenar referências
    mobileControls.push(upBtn, downBtn, leftBtn, rightBtn, actionBtn);
    
    // Configurar eventos touch
    setupTouchControls.call(this, upBtn, downBtn, leftBtn, rightBtn, actionBtn);
}

function setupTouchControls(upBtn, downBtn, leftBtn, rightBtn, actionBtn) {
    // Controles de movimento
    const setMovement = (direction, active) => {
        touchControls[direction] = active;
    };
    
    upBtn.on('pointerdown', () => setMovement('up', true));
    upBtn.on('pointerup', () => setMovement('up', false));
    upBtn.on('pointerout', () => setMovement('up', false));
    
    downBtn.on('pointerdown', () => setMovement('down', true));
    downBtn.on('pointerup', () => setMovement('down', false));
    downBtn.on('pointerout', () => setMovement('down', false));
    
    leftBtn.on('pointerdown', () => setMovement('left', true));
    leftBtn.on('pointerup', () => setMovement('left', false));
    leftBtn.on('pointerout', () => setMovement('left', false));
    
    rightBtn.on('pointerdown', () => setMovement('right', true));
    rightBtn.on('pointerup', () => setMovement('right', false));
    rightBtn.on('pointerout', () => setMovement('right', false));
    
    // Botão de ação
    actionBtn.on('pointerdown', () => {
        if (!gameStarted) {
            startGame.call(this);
        } else if (gameOver || gameWon) {
            restartGame.call(this);
        }
    });
    
    // Inicializar controles
    touchControls = { up: false, down: false, left: false, right: false };
}

function createUI() {
    // Painel de informações superior
    const uiBackground = this.add.rectangle(400, 30, 800, 150, 0x000000, 0.3)
        .setDepth(4);
    
    // Pontuação
    scoreText = this.add.text(400, 20, `Pontuação: ${score}`, {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(5);
    
    // Tempo
    timeText = this.add.text(400, 50, `Tempo: 02:00`, {
        fontSize: '24px',
        color: '#00ff00',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(5);
    
    // Objetivo
    targetScoreText = this.add.text(400, 80, `Objetivo: ${targetScore}`, {
        fontSize: '24px',
        color: '#0000ff',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(5);
    
    // Contador de itens
    itemsCountText = this.add.text(650, 20, `Itens na tela: 0`, {
        fontSize: '18px',
        color: '#000000',
        fontFamily: 'Arial, sans-serif'
    }).setDepth(5);
    
    // Inventário
    const inventoryY = 180;
    const inventoryBg = this.add.rectangle(650, inventoryY + 40, 140, 110, 0x000000, 0.3)
        .setDepth(4);
    
    this.add.text(650, inventoryY - 10, 'INVENTÁRIO:', {
        fontSize: '16px',
        color: '#000000',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(5);
    
    eWasteTypes.forEach((type, index) => {
        const yPos = inventoryY + (index * 25) + 5;
        
        const icon = this.add.image(630, yPos, type)
            .setDisplaySize(20, 20)
            .setDepth(5)
            .setAlpha(0.3);
        
        this.add.text(650, yPos, type, {
            fontSize: '14px',
            color: '#000000',
            fontFamily: 'Arial, sans-serif'
        }).setDepth(5);
        
        inventoryTexts[type] = icon;
    });
    
    // Legenda
    createLegend.call(this);
}

function createLegend() {
    const legendX = 20;
    const legendY = 480;
    
    this.add.text(legendX, legendY, 'COLETE:', {
        fontSize: '18px',
        color: '#000000',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }).setDepth(5);
    
    eWasteTypes.forEach((type, index) => {
        const yPos = legendY + 25 + (index * 25);
        
        this.add.image(legendX, yPos, type)
            .setDisplaySize(20, 20)
            .setDepth(5);
        
        this.add.text(legendX + 25, yPos - 8, `${type} (+15)`, {
            fontSize: '14px',
            color: '#000000',
            fontFamily: 'Arial, sans-serif'
        }).setDepth(5);
    });
    
    this.add.text(legendX + 150, legendY, 'EVITE:', {
        fontSize: '18px',
        color: '#ff0000',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }).setDepth(5);
    
    commonWasteTypes.forEach((type, index) => {
        const yPos = legendY + 25 + (index * 25);
        
        this.add.image(legendX + 150, yPos, type)
            .setDisplaySize(20, 20)
            .setDepth(5);
        
        this.add.text(legendX + 175, yPos - 8, `${type} (-5)`, {
            fontSize: '14px',
            color: '#ff0000',
            fontFamily: 'Arial, sans-serif'
        }).setDepth(5);
    });
}

function showStartScreen() {
    clearStartScreen.call(this);
    
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8)
        .setDepth(10);
    startScreenElements.push(overlay);
    
    const title = this.add.text(400, 200, 'ECO RESGATE', {
        fontSize: '48px',
        color: '#00ff00',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    startScreenElements.push(title);
    
    const subtitle = this.add.text(400, 260, 'Missão E-lixo', {
        fontSize: '32px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5).setDepth(11);
    startScreenElements.push(subtitle);
    
    // Mensagem específica por dispositivo
    const startMessage = (isMobile || isTablet) 
        ? 'Toque no botão verde para começar' 
        : 'Pressione ENTER para começar';
    
    const startText = this.add.text(400, 350, startMessage, {
        fontSize: '24px',
        color: '#ffff00',
        fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5).setDepth(11);
    startScreenElements.push(startText);
    
    // Efeito de piscar
    this.tweens.add({
        targets: startText,
        alpha: 0.3,
        duration: 500,
        yoyo: true,
        repeat: -1
    });
    
    // Instruções específicas por dispositivo
    const instructions = (isMobile || isTablet) ? [
        'Use os botões para mover o personagem',
        'Colete apenas os itens de e-lixo',
        'Evite os itens comuns',
        'Toque no botão verde para ações'
    ] : [
        'Use as SETAS do teclado para mover o personagem',
        'Colete apenas os itens de e-lixo (bateria, placa, celular, fio)',
        'Evite os itens comuns (papel, metal, plástico, vidro)',
        'Leve os itens para as lixeiras corretas'
    ];
    
    instructions.forEach((instruction, index) => {
        const text = this.add.text(400, 400 + (index * 30), instruction, {
            fontSize: '18px',
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5).setDepth(11);
        startScreenElements.push(text);
    });
}

// ... (MANTENHA TODAS AS OUTRAS FUNÇÕES DO JOGO ORIGINAIS A PARTIR DAQUI)

function startGame() {
    if (gameStarted) return;
    
    console.log('🎮 Iniciando jogo!');
    gameStarted = true;
    startTime = this.time.now;
    lastSpawnTime = this.time.now;
    
    clearStartScreen.call(this);
    startBackgroundMusic.call(this);
    
    items = this.physics.add.group();
    
    for (let i = 0; i < 6; i++) {
        spawnItem.call(this);
    }
}

function startBackgroundMusic() {
    backgroundMusic = this.sound.add('backgroundMusic', {
        volume: 0.5,
        loop: true
    });
    backgroundMusic.play();
    console.log('🎵 Música de fundo iniciada');
}

function stopBackgroundMusic() {
    if (backgroundMusic && backgroundMusic.isPlaying) {
        backgroundMusic.stop();
        console.log('🎵 Música de fundo parada');
    }
}

function playSound(soundKey, volume = 0.7) {
    try {
        const sound = this.sound.add(soundKey, { volume: volume });
        sound.play();
    } catch (error) {
        console.log(`❌ Erro ao tocar som ${soundKey}:`, error);
    }
}

function update(time, delta) {
    if (!gameStarted || gameOver || gameWon) return;
    
    updateGameTimer.call(this, time);
    updatePlayer.call(this);
    
    if (time - lastSpawnTime > spawnInterval && items.countActive() < 10) {
        spawnItem.call(this);
        lastSpawnTime = time;
    }
    
    items.getChildren().forEach(item => {
        if (time - item.getData('spawnTime') > itemLifetime) {
            const itemType = item.getData('type');
            
            if (eWasteTypes.includes(itemType)) {
                playSound.call(this, 'itemDesaparece', 0.3);
            }
            
            if (item.getData('timeBar')) item.getData('timeBar').destroy();
            if (item.getData('timeBarBg')) item.getData('timeBarBg').destroy();
            item.destroy();
            if (eWasteTypes.includes(itemType)) {
                updateScore.call(this, -3);
            }
        } else {
            updateItemTimeBar.call(this, item, time);
        }
    });
    
    checkRecyclingDelivery.call(this);
    itemsCountText.setText(`Itens na tela: ${items.countActive()}`);
    
    if (score >= targetScore && !gameWon) {
        endGame.call(this, true);
    }
}

function updatePlayer() {
    playerState = "idle";
    
    if (isMobile || isTablet) {
        // Controles touch
        if (touchControls.left) {
            player.setVelocityX(-160);
            playerDirection = "left";
            playerState = "walking";
        } else if (touchControls.right) {
            player.setVelocityX(160);
            playerDirection = "right";
            playerState = "walking";
        } else {
            player.setVelocityX(0);
        }
        
        if (touchControls.up) {
            player.setVelocityY(-160);
            playerDirection = "up";
            playerState = "walking";
        } else if (touchControls.down) {
            player.setVelocityY(160);
            playerDirection = "down";
            playerState = "walking";
        } else {
            player.setVelocityY(0);
        }
    } else {
        // Controles teclado
        if (cursors.left.isDown) {
            player.setVelocityX(-160);
            playerDirection = "left";
            playerState = "walking";
        } else if (cursors.right.isDown) {
            player.setVelocityX(160);
            playerDirection = "right";
            playerState = "walking";
        } else {
            player.setVelocityX(0);
        }
        
        if (cursors.up.isDown) {
            player.setVelocityY(-160);
            playerDirection = "up";
            playerState = "walking";
        } else if (cursors.down.isDown) {
            player.setVelocityY(160);
            playerDirection = "down";
            playerState = "walking";
        } else {
            player.setVelocityY(0);
        }
    }
    
    updatePlayerAnimation.call(this);
    this.physics.overlap(player, items, collectItem, null, this);
}

// ... (MANTENHA TODAS AS OUTRAS FUNÇÕES ORIGINAIS: updatePlayerAnimation, spawnItem, updateItemTimeBar, collectItem, checkRecyclingDelivery, updateGameTimer, updateScore)

function endGame(victory) {
    gameOver = !victory;
    gameWon = victory;
    player.setVelocity(0);
    stopBackgroundMusic();
    clearGameOverScreen.call(this);
    
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7)
        .setDepth(10);
    gameOverElements.push(overlay);
    
    const message = victory ? '🎉 VITÓRIA! 🎉' : '⏰ FIM DE JOGO';
    const color = victory ? '#00ff00' : '#ff0000';
    
    const messageText = this.add.text(400, 250, message, {
        fontSize: '48px',
        color: color,
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    gameOverElements.push(messageText);
    
    const scoreMessage = victory ? 
        `Você alcançou ${score} pontos!` : 
        `Pontuação final: ${score}`;
    
    const scoreText = this.add.text(400, 320, scoreMessage, {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5).setDepth(11);
    gameOverElements.push(scoreText);
    
    // Mensagem específica por dispositivo
    const restartMessage = (isMobile || isTablet)
        ? 'Toque no botão verde para jogar novamente'
        : 'Pressione ESPAÇO para jogar novamente';
    
    const restartText = this.add.text(400, 370, restartMessage, {
        fontSize: '20px',
        color: '#ffff00',
        fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5).setDepth(11);
    gameOverElements.push(restartText);
}

function restartGame() {
    if (!gameOver && !gameWon) return;
    
    console.log('🔄 Reiniciando jogo...');
    score = 0;
    gameOver = false;
    gameWon = false;
    gameStarted = false;
    
    eWasteTypes.forEach(type => {
        inventory[type] = false;
        if (inventoryTexts[type]) {
            inventoryTexts[type].setAlpha(0.3);
        }
    });
    
    if (items) {
        items.getChildren().forEach(item => {
            if (item.getData('timeBar')) item.getData('timeBar').destroy();
            if (item.getData('timeBarBg')) item.getData('timeBarBg').destroy();
        });
        items.clear(true, true);
    }
    
    player.setPosition(400, 400);
    player.setTexture('idle_down');
    playerDirection = "down";
    playerState = "idle";
    animationFrame = 0;
    
    clearGameOverScreen.call(this);
    scoreText.setText(`Pontuação: ${score}`);
    timeText.setText(`Tempo: 02:00`);
    timeText.setColor('#00ff00');
    itemsCountText.setText(`Itens na tela: 0`);
    
    showStartScreen.call(this);
}

function clearStartScreen() {
    startScreenElements.forEach(element => {
        if (element && element.destroy) element.destroy();
    });
    startScreenElements = [];
}

function clearGameOverScreen() {
    gameOverElements.forEach(element => {
        if (element && element.destroy) element.destroy();
    });
    gameOverElements = [];
}

// ... (MANTENHA AS FUNÇÕES updatePlayerAnimation, spawnItem, updateItemTimeBar, collectItem, checkRecyclingDelivery, updateGameTimer, updateScore DO CÓDIGO ORIGINAL)

console.log('✅ game.js totalmente carregado e corrigido');
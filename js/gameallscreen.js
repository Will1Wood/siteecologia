// ECO RESGATE: Missão E-lixo - Jogo em Phaser.js
// Arquivo: js/game.js
// VERSÃO RESPONSIVA PARA MOBILE - CORRIGIDA

console.log('✅ game.js carregado - Versão Responsiva Corrigida');

// Detectar dispositivo móvel
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isTablet = /iPad|Android|Tablet/i.test(navigator.userAgent);

// Configuração responsiva do jogo
function getGameConfig() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    let gameWidth, gameHeight, scaleMode;
    
    if (isMobile || screenWidth <= 768) {
        // Modo mobile - usar tela cheia
        gameWidth = Math.min(800, screenWidth - 20);
        gameHeight = Math.min(600, screenHeight - 100);
        scaleMode = Phaser.Scale.FIT;
        console.log('📱 Modo Mobile ativado');
    } else if (isTablet || screenWidth <= 1024) {
        // Modo tablet
        gameWidth = Math.min(800, screenWidth - 40);
        gameHeight = Math.min(600, screenHeight - 80);
        scaleMode = Phaser.Scale.FIT;
        console.log('📟 Modo Tablet ativado');
    } else {
        // Modo desktop
        gameWidth = 800;
        gameHeight = 600;
        scaleMode = Phaser.Scale.FIT;
        console.log('🖥️ Modo Desktop ativado');
    }
    
    return {
        type: Phaser.AUTO,
        width: gameWidth,
        height: gameHeight,
        parent: 'game-container',
        backgroundColor: '#228B22',
        scale: {
            mode: scaleMode,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            min: {
                width: 300,
                height: 400
            },
            max: {
                width: 800,
                height: 600
            }
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
}

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
let gameWidth, gameHeight;
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

// Pontos de reciclagem (serão calculados dinamicamente)
let recyclingPoints = [];

// Variáveis para armazenar elementos da UI
let startScreenElements = [];
let gameOverElements = [];
let mobileControls = [];

// Inicializar o jogo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando jogo responsivo...');
    const config = getGameConfig();
    gameWidth = config.width;
    gameHeight = config.height;
    const game = new Phaser.Game(config);
    
    // Redimensionar quando a janela mudar de tamanho
    window.addEventListener('resize', function() {
        game.scale.refresh();
    });
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
    console.log('🎮 Criando cena do jogo responsivo...');
    
    // Calcular pontos de reciclagem baseados no tamanho da tela
    calculateRecyclingPoints.call(this);
    
    // Inicializar inventário
    eWasteTypes.forEach(type => inventory[type] = false);
    
    // Criar pontos de reciclagem
    createRecyclingPoints.call(this);
    
    // Criar personagem
    createPlayer.call(this);
    
    // Configurar controles baseados no dispositivo
    if (isMobile) {
        createTouchControls.call(this);
    } else {
        // Controles de teclado para desktop
        cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown-ENTER', () => startGame.call(this), this);
        this.input.keyboard.on('keydown-SPACE', () => restartGame.call(this), this);
    }
    
    // Criar interface responsiva
    createResponsiveUI.call(this);
    
    // Mostrar tela de start
    showStartScreen.call(this);
}

function calculateRecyclingPoints() {
    const zoneWidth = gameWidth * 0.1;
    const zoneHeight = gameHeight * 0.13;
    const startX = gameWidth * 0.05;
    const startY = gameHeight * 0.05;
    const spacing = gameWidth * 0.12;
    
    recyclingPoints = [
        { type: 'bateria', x: startX, y: startY, width: zoneWidth, height: zoneHeight },
        { type: 'placa', x: startX + spacing, y: startY, width: zoneWidth, height: zoneHeight },
        { type: 'celular', x: startX + (spacing * 2), y: startY, width: zoneWidth, height: zoneHeight },
        { type: 'fio', x: startX + (spacing * 3), y: startY, width: zoneWidth, height: zoneHeight }
    ];
}

function createRecyclingPoints() {
    recyclingPoints.forEach(point => {
        // Lixeira
        this.add.image(point.x + point.width/2, point.y + point.height/2, `lixeira_${point.type}`)
            .setDisplaySize(point.width * 0.8, point.height * 0.8)
            .setDepth(1);
        
        // Nome do tipo com fonte responsiva
        const fontSize = Math.max(12, gameWidth * 0.015);
        this.add.text(point.x + point.width/2, point.y + point.height + 5, point.type, {
            fontSize: fontSize + 'px',
            color: '#000000',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#ffffff',
            padding: { left: 3, right: 3, top: 1, bottom: 1 }
        }).setOrigin(0.5).setDepth(2);
    });
}

function createPlayer() {
    const playerSize = Math.min(50, gameWidth * 0.06);
    player = this.physics.add.sprite(gameWidth / 2, gameHeight * 0.7, 'idle_down')
        .setDisplaySize(playerSize, playerSize)
        .setDepth(3);
    player.setCollideWorldBounds(true);
    player.setSize(playerSize, playerSize);
}

function createTouchControls() {
    console.log('👆 Criando controles touch...');
    
    // Limpar controles anteriores
    mobileControls.forEach(control => {
        if (control && control.destroy) control.destroy();
    });
    mobileControls = [];
    
    const controlSize = gameWidth * 0.08;
    const padding = gameWidth * 0.05;
    
    // Controle direcional (esquerda)
    const upBtn = this.add.circle(padding + controlSize, gameHeight - padding - controlSize * 2, controlSize, 0x000000, 0.5)
        .setInteractive()
        .setDepth(10);
    
    const downBtn = this.add.circle(padding + controlSize, gameHeight - padding, controlSize, 0x000000, 0.5)
        .setInteractive()
        .setDepth(10);
    
    const leftBtn = this.add.circle(padding, gameHeight - padding - controlSize, controlSize, 0x000000, 0.5)
        .setInteractive()
        .setDepth(10);
    
    const rightBtn = this.add.circle(padding + controlSize * 2, gameHeight - padding - controlSize, controlSize, 0x000000, 0.5)
        .setInteractive()
        .setDepth(10);
    
    // Ícones nos botões
    const fontSize = Math.max(20, controlSize * 0.5);
    this.add.text(upBtn.x, upBtn.y, '⬆️', { fontSize: fontSize + 'px' }).setOrigin(0.5).setDepth(11);
    this.add.text(downBtn.x, downBtn.y, '⬇️', { fontSize: fontSize + 'px' }).setOrigin(0.5).setDepth(11);
    this.add.text(leftBtn.x, leftBtn.y, '⬅️', { fontSize: fontSize + 'px' }).setOrigin(0.5).setDepth(11);
    this.add.text(rightBtn.x, rightBtn.y, '➡️', { fontSize: fontSize + 'px' }).setOrigin(0.5).setDepth(11);
    
    // Botão de ação (direita) - Enter/Space
    const actionBtn = this.add.circle(gameWidth - padding - controlSize, gameHeight - padding - controlSize, controlSize * 1.2, 0x00aa00, 0.7)
        .setInteractive()
        .setDepth(10);
    
    this.add.text(actionBtn.x, actionBtn.y, isMobile ? '▶️' : '⏎', { fontSize: fontSize + 'px' }).setOrigin(0.5).setDepth(11);
    
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

function createResponsiveUI() {
    // Tamanhos responsivos
    const baseFontSize = Math.max(16, gameWidth * 0.02);
    const titleFontSize = Math.max(24, gameWidth * 0.03);
    const smallFontSize = Math.max(12, gameWidth * 0.015);
    
    // Painel de informações superior
    const uiBackground = this.add.rectangle(gameWidth / 2, 30, gameWidth, 80, 0x000000, 0.3)
        .setDepth(4);
    
    // Pontuação
    scoreText = this.add.text(gameWidth / 2, 15, `Pontos: ${score}`, {
        fontSize: titleFontSize + 'px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(5);
    
    // Tempo
    timeText = this.add.text(gameWidth / 2, 45, `Tempo: 02:00`, {
        fontSize: baseFontSize + 'px',
        color: '#00ff00',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(5);
    
    // Objetivo (apenas em telas maiores)
    if (gameWidth > 400) {
        targetScoreText = this.add.text(gameWidth * 0.8, 20, `Meta: ${targetScore}`, {
            fontSize: baseFontSize + 'px',
            color: '#0000ff',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(5);
    }
    
    // Contador de itens (apenas em telas maiores)
    if (gameWidth > 500) {
        itemsCountText = this.add.text(gameWidth * 0.8, 45, `Itens: 0`, {
            fontSize: smallFontSize + 'px',
            color: '#000000',
            fontFamily: 'Arial, sans-serif'
        }).setDepth(5);
    }
    
    // Inventário responsivo
    createResponsiveInventory.call(this, baseFontSize, smallFontSize);
    
    // Legenda responsiva
    createResponsiveLegend.call(this, baseFontSize, smallFontSize);
}

function createResponsiveInventory(baseFontSize, smallFontSize) {
    const inventoryX = gameWidth * 0.85;
    const inventoryY = gameHeight * 0.25;
    const inventoryWidth = gameWidth * 0.25;
    
    // Apenas mostrar inventário em telas maiores
    if (gameWidth > 400) {
        // Retângulo do inventário
        const inventoryBg = this.add.rectangle(inventoryX, inventoryY + 40, inventoryWidth, 110, 0x000000, 0.3)
            .setDepth(4);
        
        // Texto "INVENTÁRIO"
        this.add.text(inventoryX, inventoryY - 10, 'INVENTÁRIO:', {
            fontSize: baseFontSize + 'px',
            color: '#000000',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(5);
        
        // Itens do inventário
        eWasteTypes.forEach((type, index) => {
            const yPos = inventoryY + (index * 20) + 10;
            const iconX = inventoryX - inventoryWidth * 0.3;
            
            // Ícone do item
            const icon = this.add.image(iconX, yPos, type)
                .setDisplaySize(20, 20)
                .setDepth(5)
                .setAlpha(0.3);
            
            // Texto do item
            this.add.text(inventoryX - inventoryWidth * 0.1, yPos, type, {
                fontSize: smallFontSize + 'px',
                color: '#000000',
                fontFamily: 'Arial, sans-serif'
            }).setDepth(5);
            
            inventoryTexts[type] = icon;
        });
    }
}

function createResponsiveLegend(baseFontSize, smallFontSize) {
    // Apenas mostrar legenda em telas maiores
    if (gameWidth < 400) return;
    
    const legendX = 20;
    const legendY = gameHeight * 0.7;
    const itemSpacing = 20;
    
    // "COLETE APENAS"
    this.add.text(legendX, legendY, 'COLETE:', {
        fontSize: baseFontSize + 'px',
        color: '#000000',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }).setDepth(5);
    
    eWasteTypes.forEach((type, index) => {
        const yPos = legendY + 20 + (index * itemSpacing);
        
        // Sprite do item
        this.add.image(legendX, yPos, type)
            .setDisplaySize(16, 16)
            .setDepth(5);
        
        // Texto com pontuação
        this.add.text(legendX + 20, yPos - 6, `${type} (+15)`, {
            fontSize: smallFontSize + 'px',
            color: '#000000',
            fontFamily: 'Arial, sans-serif'
        }).setDepth(5);
    });
    
    // "EVITE" (apenas se houver espaço)
    if (gameWidth > 500) {
        this.add.text(legendX + 120, legendY, 'EVITE:', {
            fontSize: baseFontSize + 'px',
            color: '#ff0000',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        }).setDepth(5);
        
        commonWasteTypes.forEach((type, index) => {
            const yPos = legendY + 20 + (index * itemSpacing);
            
            // Sprite do item
            this.add.image(legendX + 120, yPos, type)
                .setDisplaySize(16, 16)
                .setDepth(5);
            
            // Texto com penalidade
            this.add.text(legendX + 140, yPos - 6, `${type} (-5)`, {
                fontSize: smallFontSize + 'px',
                color: '#ff0000',
                fontFamily: 'Arial, sans-serif'
            }).setDepth(5);
        });
    }
}

// ========== FUNÇÕES DO JOGO ==========

function startGame() {
    if (gameStarted) return;
    
    console.log('🎮 Iniciando jogo!');
    gameStarted = true;
    startTime = this.time.now;
    lastSpawnTime = this.time.now;
    
    // REMOVER TELA DE START COMPLETAMENTE
    clearStartScreen.call(this);
    
    // INICIAR MÚSICA DE FUNDO
    startBackgroundMusic.call(this);
    
    // Criar grupo de itens
    items = this.physics.add.group();
    
    // Spawn inicial de itens
    for (let i = 0; i < 6; i++) {
        spawnItem.call(this);
    }
}

function startBackgroundMusic() {
    // Criar e configurar a música de fundo
    backgroundMusic = this.sound.add('backgroundMusic', {
        volume: 0.5, // Volume entre 0 e 1
        loop: true   // Repetir continuamente
    });
    
    // Iniciar a música
    backgroundMusic.play();
    console.log('🎵 Música de fundo iniciada');
}

function stopBackgroundMusic() {
    if (backgroundMusic && backgroundMusic.isPlaying) {
        backgroundMusic.stop();
        console.log('🎵 Música de fundo parada');
    }
}

// FUNÇÃO PARA TOCAR EFEITOS SONOROS
function playSound(soundKey, volume = 0.7) {
    try {
        const sound = this.sound.add(soundKey, {
            volume: volume
        });
        sound.play();
    } catch (error) {
        console.log(`❌ Erro ao tocar som ${soundKey}:`, error);
    }
}

function update(time, delta) {
    if (!gameStarted || gameOver || gameWon) return;
    
    // Atualizar timer do jogo
    updateGameTimer.call(this, time);
    
    // Atualizar personagem (com controles touch se for mobile)
    updatePlayer.call(this);
    
    // Spawn automático de itens
    if (time - lastSpawnTime > spawnInterval && items.countActive() < 8) {
        spawnItem.call(this);
        lastSpawnTime = time;
    }
    
    // Remover itens antigos
    items.getChildren().forEach(item => {
        if (time - item.getData('spawnTime') > itemLifetime) {
            const itemType = item.getData('type');
            
            if (eWasteTypes.includes(itemType)) {
                playSound.call(this, 'itemDesaparece', 0.3);
            }
            
            if (item.getData('timeBar')) {
                item.getData('timeBar').destroy();
            }
            if (item.getData('timeBarBg')) {
                item.getData('timeBarBg').destroy();
            }
            item.destroy();
            if (eWasteTypes.includes(itemType)) {
                updateScore.call(this, -3);
            }
        } else {
            updateItemTimeBar.call(this, item, time);
        }
    });
    
    // Verificar entrega nos pontos de reciclagem
    checkRecyclingDelivery.call(this);
    
    // Atualizar contador de itens se existir
    if (itemsCountText) {
        itemsCountText.setText(`Itens: ${items.countActive()}`);
    }
}

function updatePlayer() {
    playerState = "idle";
    
    // Controles (touch ou teclado)
    if (isMobile) {
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
        // Controles de teclado
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
    
    // Atualizar animação
    updatePlayerAnimation.call(this);
    
    // Verificar colisões com itens
    this.physics.overlap(player, items, collectItem, null, this);
}

function updatePlayerAnimation() {
    const currentTime = this.time.now;
    
    if (playerState === "walking") {
        if (currentTime - lastUpdate > animationSpeed) {
            animationFrame = (animationFrame + 1) % 2;
            lastUpdate = currentTime;
        }
    } else {
        animationFrame = 0;
    }
    
    // Determinar sprite atual
    let spriteKey;
    if (playerState === "idle") {
        spriteKey = `idle_${playerDirection}`;
    } else {
        const walkFrames = {
            'down': ['walk_down_1', 'walk_down_2'],
            'up': ['walk_up_1', 'walk_up_2'],
            'left': ['walk_left_1', 'walk_left_2'],
            'right': ['walk_right_1', 'walk_right_2']
        };
        spriteKey = walkFrames[playerDirection][animationFrame];
    }
    
    if (player.texture.key !== spriteKey) {
        player.setTexture(spriteKey);
    }
}

function spawnItem() {
    const margin = 50;
    const x = Phaser.Math.Between(margin, gameWidth - margin);
    const y = Phaser.Math.Between(100, gameHeight - margin);
    const itemType = Phaser.Math.RND.pick(allItemTypes);
    
    const itemSize = Math.min(30, gameWidth * 0.04);
    const item = items.create(x, y, itemType)
        .setDisplaySize(itemSize, itemSize)
        .setDepth(2);
    item.setData('type', itemType);
    item.setData('spawnTime', this.time.now);
    
    // Barra de tempo responsiva
    const barWidth = itemSize;
    const timeBarBg = this.add.rectangle(x, y - 20, barWidth, 3, 0x000000)
        .setOrigin(0.5)
        .setDepth(2);
    
    const timeBar = this.add.rectangle(x - barWidth/2, y - 20, barWidth, 3, 0x00ff00)
        .setOrigin(0, 0.5)
        .setDepth(3);
    
    item.setData('timeBar', timeBar);
    item.setData('timeBarBg', timeBarBg);
}

function updateItemTimeBar(item, currentTime) {
    const timeBar = item.getData('timeBar');
    const timeBarBg = item.getData('timeBarBg');
    
    if (!timeBar || !timeBarBg) return;
    
    const elapsed = currentTime - item.getData('spawnTime');
    const remaining = Math.max(0, itemLifetime - elapsed);
    const ratio = remaining / itemLifetime;
    
    // Atualizar posição das barras
    timeBarBg.x = item.x;
    timeBarBg.y = item.y - 20;
    
    timeBar.x = item.x - barWidth/2;
    timeBar.y = item.y - 20;
    
    // Atualizar largura e cor da barra verde (dentro da preta)
    timeBar.width = barWidth * ratio;
    timeBar.fillColor = ratio > 0.3 ? 0x00ff00 : 0xff0000;
}

function collectItem(player, item) {
    const itemType = item.getData('type');
    
    // REMOVER BARRAS DE TEMPO JUNTO COM O ITEM
    if (item.getData('timeBar')) {
        item.getData('timeBar').destroy();
    }
    if (item.getData('timeBarBg')) {
        item.getData('timeBarBg').destroy();
    }
    
    // Coletar item
    if (eWasteTypes.includes(itemType)) {
        if (!inventory[itemType]) {
            inventory[itemType] = true;
            // Atualizar inventário visual
            if (inventoryTexts[itemType]) {
                inventoryTexts[itemType].setAlpha(1);
            }
            
            // TOCAR SOM DE COLETAR E-LIXO
            playSound.call(this, 'coletarEletronico', 0.6);
            
            item.destroy();
        }
    } else {
        // Penalidade por item comum
        updateScore.call(this, -5);
        
        // TOCAR SOM DE COLETAR ITEM COMUM (PENALIDADE)
        playSound.call(this, 'coletarComum', 0.6);
        
        item.destroy();
    }
}

function checkRecyclingDelivery() {
    recyclingPoints.forEach(zone => {
        if (Phaser.Geom.Rectangle.Contains(
            new Phaser.Geom.Rectangle(zone.x, zone.y, zone.width, zone.height),
            player.x, player.y
        )) {
            if (inventory[zone.type]) {
                // Entrega bem-sucedida
                inventory[zone.type] = false;
                if (inventoryTexts[zone.type]) {
                    inventoryTexts[zone.type].setAlpha(0.3);
                }
                updateScore.call(this, 15);
                
                // TOCAR SOM DE ENTREGA BEM-SUCEDIDA
                playSound.call(this, 'entregarItem', 0.8);
                
                // Efeito visual
                this.tweens.add({
                    targets: player,
                    scale: 1.2,
                    duration: 150,
                    yoyo: true
                });
            }
        }
    });
}

function updateGameTimer(currentTime) {
    const elapsed = (currentTime - startTime) / 1000;
    const remaining = Math.max(0, gameTime - elapsed);
    const minutes = Math.floor(remaining / 60);
    const seconds = Math.floor(remaining % 60);
    
    // Atualizar texto do tempo
    timeText.setText(`Tempo: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    
    // Mudar cor conforme o tempo
    if (remaining > 30) {
        timeText.setColor('#00ff00');
    } else if (remaining > 10) {
        timeText.setColor('#ffff00');
    } else {
        timeText.setColor('#ff0000');
    }
    
    // Verificar fim do jogo por tempo
    if (remaining <= 0 && !gameOver && !gameWon) {
        endGame.call(this, false);
    }
}

function updateScore(points) {
    score += points;
    scoreText.setText(`Pontos: ${score}`);
    
    // Efeito de cor
    if (points > 0) {
        scoreText.setColor('#00ff00');
        this.time.delayedCall(500, () => scoreText.setColor('#ffffff'));
    } else if (points < 0) {
        scoreText.setColor('#ff0000');
        this.time.delayedCall(500, () => scoreText.setColor('#ffffff'));
    }
}

function showStartScreen() {
    clearStartScreen.call(this);
    
    const overlay = this.add.rectangle(gameWidth / 2, gameHeight / 2, gameWidth, gameHeight, 0x000000, 0.8)
        .setDepth(10);
    startScreenElements.push(overlay);
    
    // Títulos responsivos
    const titleFontSize = Math.max(24, gameWidth * 0.06);
    const subtitleFontSize = Math.max(18, gameWidth * 0.04);
    const textFontSize = Math.max(14, gameWidth * 0.03);
    
    const title = this.add.text(gameWidth / 2, gameHeight * 0.3, 'ECO RESGATE', {
        fontSize: titleFontSize + 'px',
        color: '#00ff00',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    startScreenElements.push(title);
    
    const subtitle = this.add.text(gameWidth / 2, gameHeight * 0.4, 'Missão E-lixo', {
        fontSize: subtitleFontSize + 'px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5).setDepth(11);
    startScreenElements.push(subtitle);
    
    const startText = this.add.text(gameWidth / 2, gameHeight * 0.55, 
        isMobile ? 'Toque no botão verde para começar' : 'Pressione ENTER para começar', {
        fontSize: textFontSize + 'px',
        color: '#ffff00',
        fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5).setDepth(11);
    startScreenElements.push(startText);
    
    // Instruções adaptadas para mobile
    const instructions = isMobile ? [
        'Use os botões para mover o personagem',
        'Colete apenas e-lixo (bateria, placa, etc)',
        'Evite itens comuns (papel, metal, etc)',
        'Toque no botão verde para ações'
    ] : [
        'Use as SETAS do teclado para mover',
        'Colete apenas e-lixo (bateria, placa, celular, fio)',
        'Evite itens comuns (papel, metal, plástico, vidro)',
        'Leve os itens para as lixeiras corretas'
    ];
    
    instructions.forEach((instruction, index) => {
        const text = this.add.text(gameWidth / 2, gameHeight * 0.65 + (index * 25), instruction, {
            fontSize: (textFontSize - 2) + 'px',
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5).setDepth(11);
        startScreenElements.push(text);
    });
}

function clearStartScreen() {
    // Remover todos os elementos da tela de start
    startScreenElements.forEach(element => {
        if (element && element.destroy) {
            element.destroy();
        }
    });
    startScreenElements = [];
}

function clearGameOverScreen() {
    // Remover todos os elementos da tela de game over
    gameOverElements.forEach(element => {
        if (element && element.destroy) {
            element.destroy();
        }
    });
    gameOverElements = [];
}

function endGame(victory) {
    gameOver = !victory;
    gameWon = victory;
    
    player.setVelocity(0);
    
    // PARAR MÚSICA DE FUNDO
    stopBackgroundMusic();
    
    // LIMPAR ELEMENTOS ANTERIORES
    clearGameOverScreen.call(this);
    
    // Overlay escuro
    const overlay = this.add.rectangle(gameWidth / 2, gameHeight / 2, gameWidth, gameHeight, 0x000000, 0.7)
        .setDepth(10);
    gameOverElements.push(overlay);
    
    // Mensagem
    const message = victory ? '🎉 VITÓRIA! 🎉' : '⏰ FIM DE JOGO';
    const color = victory ? '#00ff00' : '#ff0000';
    
    const messageText = this.add.text(gameWidth / 2, gameHeight * 0.4, message, {
        fontSize: Math.max(24, gameWidth * 0.06) + 'px',
        color: color,
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    gameOverElements.push(messageText);
    
    // Pontuação final
    const scoreMessage = victory ? 
        `Você alcançou ${score} pontos!` : 
        `Pontuação final: ${score}`;
    
    const scoreText = this.add.text(gameWidth / 2, gameHeight * 0.5, scoreMessage, {
        fontSize: Math.max(16, gameWidth * 0.04) + 'px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5).setDepth(11);
    gameOverElements.push(scoreText);
    
    // Instrução para reiniciar
    const restartText = this.add.text(gameWidth / 2, gameHeight * 0.6, 
        isMobile ? 'Toque no botão verde para jogar novamente' : 'Pressione ESPAÇO para jogar novamente', {
        fontSize: Math.max(14, gameWidth * 0.03) + 'px',
        color: '#ffff00',
        fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5).setDepth(11);
    gameOverElements.push(restartText);
}

function restartGame() {
    if (!gameOver && !gameWon) return;
    
    console.log('🔄 Reiniciando jogo...');
    
    // Resetar variáveis
    score = 0;
    gameOver = false;
    gameWon = false;
    gameStarted = false;
    
    // Resetar inventário
    eWasteTypes.forEach(type => {
        inventory[type] = false;
        if (inventoryTexts[type]) {
            inventoryTexts[type].setAlpha(0.3);
        }
    });
    
    // Limpar itens e suas barras de tempo
    if (items) {
        items.getChildren().forEach(item => {
            if (item.getData('timeBar')) {
                item.getData('timeBar').destroy();
            }
            if (item.getData('timeBarBg')) {
                item.getData('timeBarBg').destroy();
            }
        });
        items.clear(true, true);
    }
    
    // Reposicionar personagem
    player.setPosition(gameWidth / 2, gameHeight * 0.7);
    player.setTexture('idle_down');
    playerDirection = "down";
    playerState = "idle";
    animationFrame = 0;
    
    // REMOVER TELA DE GAME OVER COMPLETAMENTE
    clearGameOverScreen.call(this);
    
    // Atualizar UI
    scoreText.setText(`Pontos: ${score}`);
    timeText.setText(`Tempo: 02:00`);
    timeText.setColor('#00ff00');
    if (itemsCountText) {
        itemsCountText.setText(`Itens: 0`);
    }
    
    // Mostrar tela de start novamente
    showStartScreen.call(this);
}

console.log('✅ game.js responsivo totalmente carregado e corrigido');
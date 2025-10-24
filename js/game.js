// ECO RESGATE: Missão E-lixo - Jogo em Phaser.js
// Arquivo: js/game.js

console.log('✅ game.js carregado');

// Configuração do jogo
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#228B22',
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
let backgroundMusic; // Variável para a música de fundo

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

// Inicializar o jogo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando jogo...');
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
        const carregandoElement = document.getElementById('carregando-jogo');
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
    
    // Configurar controles
    cursors = this.input.keyboard.createCursorKeys();
    
    // Configurar tecla ENTER para iniciar
    this.input.keyboard.on('keydown-ENTER', startGame, this);
    
    // Configurar tecla ESPAÇO para reiniciar
    this.input.keyboard.on('keydown-SPACE', restartGame, this);
    
    // Criar interface completa
    createCompleteUI.call(this);
    
    // Mostrar tela de start
    showStartScreen.call(this);
}

function update(time, delta) {
    if (!gameStarted || gameOver || gameWon) return;
    
    // Atualizar timer do jogo
    updateGameTimer.call(this, time);
    
    // Atualizar personagem
    updatePlayer.call(this);
    
    // Spawn automático de itens
    if (time - lastSpawnTime > spawnInterval && items.countActive() < 10) {
        spawnItem.call(this);
        lastSpawnTime = time;
    }
    
    // Remover itens antigos
    items.getChildren().forEach(item => {
        if (time - item.getData('spawnTime') > itemLifetime) {
            const itemType = item.getData('type');
            
            // TOCAR SOM DE ITEM DESAPARECENDO (apenas para e-lixo)
            if (eWasteTypes.includes(itemType)) {
                playSound.call(this, 'itemDesaparece', 0.3);
            }
            
            // REMOVER AS BARRAS DE TEMPO JUNTO COM O ITEM
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
            // Atualizar barra de tempo do item
            updateItemTimeBar.call(this, item, time);
        }
    });
    
    // Verificar entrega nos pontos de reciclagem
    checkRecyclingDelivery.call(this);
    
    // Atualizar contador de itens
    itemsCountText.setText(`Itens na tela: ${items.countActive()}`);
    
    // Verificar condições de vitória/derrota
    if (score >= targetScore && !gameWon) {
        endGame.call(this, true);
    }
}

// ========== FUNÇÕES PRINCIPAIS ==========

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

function createCompleteUI() {
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
    
    // INVENTÁRIO COM POSIÇÃO AJUSTADA
    const inventoryY = 180; // Posição Y base do inventário
    
    // Retângulo do inventário
    const inventoryBg = this.add.rectangle(650, inventoryY + 40, 140, 110, 0x000000, 0.3)
        .setDepth(4);
    
    // Texto "INVENTÁRIO" 
    this.add.text(650, inventoryY - 10, 'INVENTÁRIO:', {
        fontSize: '16px',
        color: '#000000',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(5);
    
    // **ITENS DO INVENTÁRIO 2 PIXELS MAIS PARA BAIXO**
    eWasteTypes.forEach((type, index) => {
        const yPos = inventoryY + (index * 25) + 5; // +2 pixels para descer os itens
        
        // Ícone do item
        const icon = this.add.image(630, yPos, type)
            .setDisplaySize(20, 20)
            .setDepth(5)
            .setAlpha(0.3);
        
        // Texto do item
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
    
    // "COLETE APENAS"
    this.add.text(legendX, legendY, 'COLETE:', {
        fontSize: '18px',
        color: '#000000',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }).setDepth(5);
    
    eWasteTypes.forEach((type, index) => {
        const yPos = legendY + 25 + (index * 25);
        
        // Sprite do item
        this.add.image(legendX, yPos, type)
            .setDisplaySize(20, 20)
            .setDepth(5);
        
        // Texto com pontuação
        this.add.text(legendX + 25, yPos - 8, `${type} (+15)`, {
            fontSize: '14px',
            color: '#000000',
            fontFamily: 'Arial, sans-serif'
        }).setDepth(5);
    });
    
    // "EVITE"
    this.add.text(legendX + 150, legendY, 'EVITE:', {
        fontSize: '18px',
        color: '#ff0000',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }).setDepth(5);
    
    commonWasteTypes.forEach((type, index) => {
        const yPos = legendY + 25 + (index * 25);
        
        // Sprite do item
        this.add.image(legendX + 150, yPos, type)
            .setDisplaySize(20, 20)
            .setDepth(5);
        
        // Texto com penalidade
        this.add.text(legendX + 175, yPos - 8, `${type} (-5)`, {
            fontSize: '14px',
            color: '#ff0000',
            fontFamily: 'Arial, sans-serif'
        }).setDepth(5);
    });
}

function showStartScreen() {
    // Limpar elementos anteriores
    clearStartScreen.call(this);
    
    // Overlay escuro
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8)
        .setDepth(10);
    startScreenElements.push(overlay);
    
    // Título principal
    const title = this.add.text(400, 200, 'ECO RESGATE', {
        fontSize: '48px',
        color: '#00ff00',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    startScreenElements.push(title);
    
    // Subtítulo
    const subtitle = this.add.text(400, 260, 'Missão E-lixo', {
        fontSize: '32px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5).setDepth(11);
    startScreenElements.push(subtitle);
    
    // Instrução para começar
    const startText = this.add.text(400, 350, 'Pressione ENTER para começar', {
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
    
    // Instruções do jogo
    const instructions = [
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

function updatePlayer() {
    // Reset state
    playerState = "idle";
    
    // Movimento e definição de direção
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
    const x = Phaser.Math.Between(50, 750);
    const y = Phaser.Math.Between(150, 550);
    const itemType = Phaser.Math.RND.pick(allItemTypes);
    
    const item = items.create(x, y, itemType)
        .setDisplaySize(30, 30)
        .setDepth(2);
    item.setData('type', itemType);
    item.setData('spawnTime', this.time.now);
    
    // BARRA DE TEMPO COM BACKGROUND PRETO E PREENCHIMENTO VERDE DENTRO
    const timeBarBg = this.add.rectangle(x, y - 20, 30, 3, 0x000000)
        .setOrigin(0.5)
        .setDepth(2);
    
    const timeBar = this.add.rectangle(x - 15, y - 20, 30, 3, 0x00ff00)
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
    
    timeBar.x = item.x - 15;
    timeBar.y = item.y - 20;
    
    // Atualizar largura e cor da barra verde (dentro da preta)
    timeBar.width = 30 * ratio;
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
            inventoryTexts[itemType].setAlpha(1);
            
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
                inventoryTexts[zone.type].setAlpha(0.3);
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
    scoreText.setText(`Pontuação: ${score}`);
    
    // Efeito de cor
    if (points > 0) {
        scoreText.setColor('#00ff00');
        this.time.delayedCall(500, () => scoreText.setColor('#ffffff'));
    } else if (points < 0) {
        scoreText.setColor('#ff0000');
        this.time.delayedCall(500, () => scoreText.setColor('#ffffff'));
    }
    
    // REMOVIDO: Código da barra de progresso
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
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7)
        .setDepth(10);
    gameOverElements.push(overlay);
    
    // Mensagem
    const message = victory ? '🎉 VITÓRIA! 🎉' : '⏰ FIM DE JOGO';
    const color = victory ? '#00ff00' : '#ff0000';
    
    const messageText = this.add.text(400, 250, message, {
        fontSize: '48px',
        color: color,
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    gameOverElements.push(messageText);
    
    // Pontuação final
    const scoreMessage = victory ? 
        `Você alcançou ${score} pontos!` : 
        `Pontuação final: ${score}`;
    
    const scoreText = this.add.text(400, 320, scoreMessage, {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5).setDepth(11);
    gameOverElements.push(scoreText);
    
    // Instrução para reiniciar - CORRIGIDO
    const restartText = this.add.text(400, 370, 'Pressione ESPAÇO para jogar novamente', {
        fontSize: '20px',
        color: '#ffff00',
        fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5).setDepth(11);
    gameOverElements.push(restartText); // ✅ CORRIGIDO - era restText
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
    player.setPosition(400, 400);
    player.setTexture('idle_down');
    playerDirection = "down";
    playerState = "idle";
    animationFrame = 0;
    
    // REMOVER TELA DE GAME OVER COMPLETAMENTE
    clearGameOverScreen.call(this);
    
    // Atualizar UI
    scoreText.setText(`Pontuação: ${score}`);
    timeText.setText(`Tempo: 02:00`);
    timeText.setColor('#00ff00');
    itemsCountText.setText(`Itens na tela: 0`);
    
    // REMOVIDO: Reset da barra de progresso
    
    // Mostrar tela de start novamente
    showStartScreen.call(this);
}

console.log('✅ game.js totalmente carregado');

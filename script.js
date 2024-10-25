const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth; 
canvas.height = window.innerHeight;

let player = {
    x: 50,
    y: canvas.height / 2 - 80,
    width: 80,
    height: 80,
    selectedCharacter: null,
    weaponWidth: 40,  // Increased weapon width
    weaponHeight: 40, // Increased weapon height
    weaponSpeed: 5,
    canShoot: true,
    reloadTime: 1800,
    reloadProgress: 0
};

let projectiles = [];
let balls = [];
let fragments = [];
let score = 0;
let gameInterval;
let ballInterval;
let isGameOver = false;

const selectionMusic = new Audio('selection-music.mp3'); // Background music for selection screen
const gameplayMusic = new Audio('gameplay-music.mp3'); // Background music for gameplay
const gameOverMusic = new Audio('game-over-music.mp3'); // Background music for game over

const startScreen = document.getElementById("startScreen");
const characterSelectScreen = document.getElementById("characterSelectScreen");
const gameScreen = document.getElementById("gameScreen");
const endScreen = document.getElementById("endScreen");
const finalScore = document.getElementById("finalScore");
const scoreBoard = document.getElementById("scoreBoard");
const reloadBar = document.getElementById("reloadBar");

const countdownDisplay = document.createElement('div');
countdownDisplay.id = 'countdown';
document.body.appendChild(countdownDisplay);

const images = {
    parth: {
        character: new Image(),
        weapon: new Image()
    },
    harley: {
        character: new Image(),
        weapon: new Image()
    },
    tejas: {
        character: new Image(),
        weapon: new Image()
    }
};

images.parth.character.src = 'parth.png';
images.parth.weapon.src = 'parth-weapon.png';
images.harley.character.src = 'harley.png';
images.harley.weapon.src = 'harley-weapon.png';
images.tejas.character.src = 'tejas.png';
images.tejas.weapon.src = 'tejas-weapon.png';

function startGame() {
    startScreen.style.display = "none";
    characterSelectScreen.style.display = "flex";
    selectionMusic.play();
}

function selectCharacter(character) {
    player.selectedCharacter = character;
    characterSelectScreen.style.display = "none";
    gameScreen.style.display = "flex";
    selectionMusic.pause();
    startCountdown();
}

function startCountdown() {
    let countdown = 3;
    countdownDisplay.style.display = 'block';
    const interval = setInterval(() => {
        countdownDisplay.innerHTML = countdown;
        countdown--;
        if (countdown < 0) {
            clearInterval(interval);
            countdownDisplay.style.display = 'none';
            scoreBoard.innerHTML = `Score: ${score}`;
            gameplayMusic.play(); // Start gameplay music
            startGameplay();
        }
    }, 1000);
}

function startGameplay() {
    player.y = canvas.height / 2 - player.height / 2;
    score = 0;
    projectiles = [];
    balls = [];
    fragments = [];
    isGameOver = false;
    
    gameInterval = setInterval(updateGame, 20);
    ballInterval = setInterval(addBall, 2500);
}

function addBall() {
    const ball = {
        x: canvas.width,
        y: Math.random() * (canvas.height - 60),
        width: 60,
        height: 60,
        speed: 1.5
    };
    balls.push(ball);
}

function updateGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const amplitude = (canvas.height - player.height);
    player.y = (Math.sin(Date.now() / 500) * amplitude) / 2 + (canvas.height / 2 - player.height / 2);

    drawPlayer();

    projectiles.forEach((proj, index) => {
        proj.x += player.weaponSpeed;
        if (proj.x > canvas.width) projectiles.splice(index, 1);
        drawProjectile(proj);
    });

    balls.forEach((ball, index) => {
        ball.x -= ball.speed;

        if (ball.x < 0 && !isGameOver) {
            triggerExplosion(ball.x, ball.y, "large");
            isGameOver = true;
            setTimeout(() => endGame(), 2000); // End the game 2 seconds after explosion
        }

        projectiles.forEach((proj, projIndex) => {
            if (isColliding(proj, ball)) {
                projectiles.splice(projIndex, 1);
                balls.splice(index, 1);
                triggerExplosion(ball.x, ball.y, "small");
                score++;
                scoreBoard.innerHTML = `Score: ${score}`;
            }
        });

        drawBall(ball);
    });

    // Draw and update fragments
    updateFragments();

    if (!player.canShoot) {
        player.reloadProgress += (100 / (player.reloadTime / 20));
        reloadBar.style.width = `${player.reloadProgress}%`;

        if (player.reloadProgress >= 100) {
            player.reloadProgress = 0;
            player.canShoot = true;
            reloadBar.style.width = '0';
        }
    }
}

function drawPlayer() {
    const characterImage = images[player.selectedCharacter].character;
    ctx.drawImage(characterImage, player.x, player.y, player.width, player.height);
}

function drawBall(ball) {
    ctx.fillStyle = "red";
    ctx.fillRect(ball.x, ball.y, ball.width, ball.height);
}

function drawProjectile(proj) {
    const weaponImage = images[player.selectedCharacter].weapon;
    ctx.drawImage(weaponImage, proj.x, proj.y, player.weaponWidth, player.weaponHeight);
}

function isColliding(proj, ball) {
    return proj.x < ball.x + ball.width &&
        proj.x + player.weaponWidth > ball.x &&
        proj.y < ball.y + ball.height &&
        proj.y + player.weaponHeight > ball.y;
}

document.addEventListener('click', () => {
    if (player.canShoot) {
        shoot();
        player.canShoot = false;
        setTimeout(() => {
            player.canShoot = true;
        }, player.reloadTime);
    }
});

function shoot() {
    const projectile = {
        x: player.x + player.width,
        y: player.y + player.height / 2 - player.weaponHeight / 2
    };
    projectiles.push(projectile);
}

function triggerExplosion(x, y, type) {
    const fragmentCount = type === "large" ? 30 : 15;
    for (let i = 0; i < fragmentCount; i++) {
        fragments.push({
            x,
            y,
            size: type === "large" ? 10 : 5,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            gravity: 0.3,
            lifetime: 3000 // Fragments disappear after 3 seconds
        });
    }
}

function updateFragments() {
    fragments.forEach((frag, index) => {
        frag.x += frag.vx;
        frag.y += frag.vy;
        frag.vy += frag.gravity;

        ctx.fillStyle = "orange";
        ctx.fillRect(frag.x, frag.y, frag.size, frag.size);

        // Remove fragment after 3 seconds
        frag.lifetime -= 20;
        if (frag.lifetime <= 0) {
            fragments.splice(index, 1);
        }
    });
}

function endGame() {
    clearInterval(gameInterval);
    clearInterval(ballInterval);
    gameplayMusic.pause(); // Stop gameplay music
    gameOverMusic.play(); // Start game over music
    gameScreen.style.display = "none";
    endScreen.style.display = "block";
    finalScore.innerHTML = `Your score: ${score}`;
}

function restartGame() {
    endScreen.style.display = "none";
    gameScreen.style.display = "flex";
    gameplayMusic.play();
    startGameplay();
}

function chooseDifferentCharacter() {
    endScreen.style.display = "none";
    characterSelectScreen.style.display = "flex";
    gameOverMusic.pause();
    selectionMusic.play();
}

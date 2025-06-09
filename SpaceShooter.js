let playerX, playerY;
let playerSize = 30;
let playerHealth = 20;
let moveSpeed = 5;

let enemies = [];
let enemySpawnRate = 90;
let spawnCounter = 0;

let bullets = [];
let bulletSpeed = 5;

let score = 0;

let backgroundStars = [];
let starCount = 100;
let particles = [];

let powerUps = [];
let shootModes = { normal: false, shotgun: false, fast: false };
let powerUpTimers = { shotgun: 0, fast: 0 };
let shooting = false;
let shootCooldown = 20;
let shootCounter = 0;

let gameOver = false;
let restartButton;

function setup() {
  createCanvas(400, 600);
  playerX = width / 2;
  playerY = height - 50;

  for (let i = 0; i < starCount; i++) {
    backgroundStars.push({
      x: random(width),
      y: random(height),
      size: random(1, 3),
      speed: random(0.5, 1.5),
      brightness: random(150, 255)
    });
  }

  restartButton = createButton('Restart');
  restartButton.position(width / 2 - 30, height / 2 + 50);
  restartButton.mousePressed(restartGame);
  restartButton.hide();
}

function draw() {
  background(0);

  for (let star of backgroundStars) {
    fill(star.brightness);
    noStroke();
    ellipse(star.x, star.y, star.size);
    star.y += star.speed;
    if (star.y > height) {
      star.y = 0;
      star.x = random(width);
      star.size = random(1, 3);
      star.speed = random(0.5, 1.5);
      star.brightness = random(150, 255);
    }
  }

  if (gameOver) {
    fill(255, 0, 0);
    textSize(40);
    textAlign(CENTER, CENTER);
    text("Game Over", width / 2, height / 2 - 20);
    textSize(20);
    text("Final Score: " + score, width / 2, height / 2 + 20);
    restartButton.show();
    return;
  } else {
    restartButton.hide();
  }

  if (keyIsDown(LEFT_ARROW)) playerX -= moveSpeed;
  if (keyIsDown(RIGHT_ARROW)) playerX += moveSpeed;
  playerX = constrain(playerX, playerSize / 2, width - playerSize / 2);

  fill(0, 255, 0);
  rect(playerX - playerSize / 2, playerY - playerSize / 2, playerSize, playerSize);

  fill(255);
  textSize(18);
  textAlign(LEFT, TOP);
  text("Health: " + playerHealth, 25, 20);
  text("Score: " + score, 25, 45);

  for (let key in powerUpTimers) {
    if (powerUpTimers[key] > 0) {
      powerUpTimers[key]--;
      shootModes[key] = true;
    } else {
      shootModes[key] = false;
    }
  }

  if (shooting) {
    if (shootCounter <= 0) {
      shootBullets();
      shootCounter = shootModes.fast ? 5 : shootCooldown;
    } else {
      shootCounter--;
    }
  } else {
    shootCounter = 0;
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].y -= bulletSpeed;
    fill(0, 255, 255);
    ellipse(bullets[i].x, bullets[i].y, 6, 12);
    if (bullets[i].y < 0) bullets.splice(i, 1);
  }

  spawnCounter++;
  if (spawnCounter >= enemySpawnRate) {
    spawnEnemy();
    spawnCounter = 0;
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];

    if (e.active) {
      for (let j = bullets.length - 1; j >= 0; j--) {
        let b = bullets[j];
        if (dist(e.x, e.y, b.x, b.y) < e.size / 2) {
          e.takeDamage(3);
          bullets.splice(j, 1);
          if (!e.active) {
            score++;
            spawnParticles(e.x, e.y);
            if (random() < 0.05) {
              let type = random() < 0.5 ? 'fast' : 'shotgun';
              powerUps.push(new PowerUp(e.x, e.y, type));
            }
          }
          break;
        }
      }
      e.update();
    } else {
      e.update();
      if (e.size < 1) {
        enemies.splice(i, 1);
        continue;
      }
    }

    if (e.y > height + e.size / 2 && e.active) {
      playerHealth -= e.health;
      e.active = false;
    }

    e.display();
  }

  for (let i = powerUps.length - 1; i >= 0; i--) {
    let p = powerUps[i];
    p.update();
    p.display();
    if (p.collectedBy(playerX, playerY)) {
      powerUpTimers[p.type] += 600;
      powerUps.splice(i, 1);
    } else if (p.y > height) {
      powerUps.splice(i, 1);
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.alpha -= 5;
    fill(red(p.color), green(p.color), blue(p.color), p.alpha);
    noStroke();
    ellipse(p.x, p.y, p.size);
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0 || p.alpha <= 0) particles.splice(i, 1);
  }

  if (playerHealth <= 0) {
    playerHealth = 0;
    gameOver = true;
  }
}

function restartGame() {
  playerX = width / 2;
  playerY = height - 50;
  playerHealth = 20;
  enemies = [];
  bullets = [];
  powerUps = [];
  particles = [];
  powerUpTimers = { shotgun: 0, fast: 0 };
  shootModes = { normal: false, shotgun: false, fast: false };
  score = 0;
  gameOver = false;
}

function shootBullets() {
  bullets.push({ x: playerX, y: playerY - playerSize / 2 });
  if (shootModes.shotgun) {
    bullets.push({ x: playerX - 10, y: playerY - playerSize / 2 });
    bullets.push({ x: playerX + 10, y: playerY - playerSize / 2 });
  }
}

function keyPressed() {
  if (key === ' ') shooting = true;
}

function keyReleased() {
  if (key === ' ') shooting = false;
}

function spawnEnemy() {
  let rand = random();
  let hp = rand < 0.6 ? 3 : rand < 0.9 ? 6 : 9;
  enemies.push(new Enemy(hp));
}

class Enemy {
  constructor(health) {
    this.maxHealth = health;
    this.health = health;
    this.size = map(this.health, 3, 9, 20, 50);
    this.x = random(this.size, width - this.size);
    this.y = -this.size;
    this.speed = random(1.2, 2.2);
    this.active = true;
    this.color = color(random(150, 255), random(50, 100), random(50, 100));
  }

  update() {
    this.y += this.speed;
    let targetSize = this.active
      ? map(this.health, 0, this.maxHealth, 0, map(this.maxHealth, 3, 9, 20, 50))
      : 0;
    this.size = lerp(this.size, targetSize, 0.2);
  }

  display() {
    fill(this.color);
    noStroke();
    ellipse(this.x, this.y, this.size);
    if (this.active) {
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(12);
      text(this.health, this.x, this.y);
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) this.active = false;
  }
}

class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.size = 20;
    this.type = type;
    this.speed = 2;
    this.color = type === 'fast' ? color(0, 204, 204) : color(255, 165, 0);
  }

  update() {
    this.y += this.speed;
  }

  display() {
    fill(this.color);
    noStroke();
    ellipse(this.x, this.y, this.size);
    fill(255);
    textSize(10);
    textAlign(CENTER, CENTER);
    text(this.type === 'fast' ? 'F' : 'S', this.x, this.y);
  }

  collectedBy(px, py) {
    return dist(this.x, this.y, px, py) < (this.size + playerSize) / 2;
  }
}

function spawnParticles(x, y) {
  for (let i = 0; i < 15; i++) {
    particles.push({
      x: x,
      y: y,
      vx: random(-2, 2),
      vy: random(-2, 2),
      size: random(2, 6),
      life: 30,
      alpha: 255,
      color: color(random(200, 255), random(50, 150), random(50, 150))
    });
  }
}

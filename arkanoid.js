const BulletMovement = {
  UP: 8,
  LEFT: 4,
  RIGHT: 6,
  DOWN: 2
};

const DIFFICULT_GAME = {
  EASY: {
    BAR_WIDTH: 75,
    MAX_BRICKS_LIVES: 2,
    PLAYER_LIVES: 5
  },
  NORMAL: {
    BAR_WIDTH: 55,
    MAX_BRICKS_LIVES: 3,
    PLAYER_LIVES: 3
  },
  HARD: {
    BAR_WIDTH: 45,
    MAX_BRICKS_LIVES: 5,
    PLAYER_LIVES: 3
  },
  VERY_HARD: {
    BAR_WIDTH: 40,
    MAX_BRICKS_LIVES: 5,
    PLAYER_LIVES: 1
  }
};

var DIFFICULT_SELECTED = DIFFICULT_GAME.EASY;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const BAR_LIVE_LIMIT = 40;
var game = new Game();

/* COLICIONES ENTRE BLOQUES Y BALA*/
function rectCircleColliding(circle, block) {
  var distX = Math.abs(circle.x - block.x - block.width / 2);
  var distY = Math.abs(circle.y - block.y - block.height / 2);

  if (distX > block.width / 2 + circle.radius) {
    return false;
  }
  if (distY > block.height / 2 + circle.radius) {
    return false;
  }

  if (distX <= block.width / 2) {
    return true;
  }
  if (distY <= block.height / 2) {
    return true;
  }

  var dx = distX - block.width / 2;
  var dy = distY - block.height / 2;
  return dx * dx + dy * dy <= circle.radius * circle.radius;
}

/* BARRA SUPERIOR QUE MUESTRA LAS VIDAS DEL JUGADOR */
function showLives() {
  ctx.clearRect(100, 0, BAR_LIVE_LIMIT, 40);
  ctx.fillStyle = "#090909";
  ctx.fillRect(100, 0, canvas.width, 40);

  for (let i = 1; i <= game.bar.lives; i++) {
    var img_heart = new Image();

    img_heart.src = "./img/heart.png";
    img_heart.onload = function() {
      ctx.drawImage(img_heart, canvas.width - 30 * i, 10);
    };
  }
}

/*REINICIO DEL JUEGO*/
function reset() {
  game = new Game();
  game.start();
}

/* ACTUALIZACION DE PUNTOS */
function updatePoints() {
  ctx.clearRect(0, 0, 100, 40);
  ctx.fillStyle = "#090909";
  ctx.fillRect(0, 0, 100, 40);

  ctx.font = "14px sans-serif";
  ctx.fillStyle = "white";
  ctx.fillText("Puntos: " + game.points, 10, 25);
}

/* ACTUALIZACION DEL DIBUJO */
function update() {
  updatePoints();
  ctx.clearRect(0, BAR_LIVE_LIMIT, canvas.width, canvas.height);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, BAR_LIVE_LIMIT, canvas.width, canvas.height);
  if (!game.gameover) game.draw();
  else reset();
}

/* OBJETOS DEL JUEGO */

/* JUEGO */
function Game() {
  this.gaming = false;
  this.bar = new Bar(canvas.width / 2, canvas.height - 20);
  this.rowsPositionY = {
    one: 110,
    two: 140,
    three: 170,
    four: 200,
    five: 260,
    six: 320
  };
  this.powerUps = [];
  this.points = 0;
  this.bricks = [];
  this.gameover = false;

  this.generateBricks = function(columns) {
    var column = 10;
    for (let i = 0; i < columns; i++) {
      column += 60;
      this.bricks.push(new Brick(column, this.rowsPositionY.one));
      this.bricks.push(new Brick(column, this.rowsPositionY.two));
      this.bricks.push(new Brick(column, this.rowsPositionY.three));
      this.bricks.push(new Brick(column, this.rowsPositionY.four));
      this.bricks.push(new Brick(column, this.rowsPositionY.five, 4));
      this.bricks.push(new Brick(column, this.rowsPositionY.six, 3));
    }
  };

  this.drawPowerUps = function() {
    for (let i = 0; i < this.powerUps.length; i++) {
      this.powerUps[i].draw();
      if (this.powerUps[i].y > canvas.height)
        this.powerUps = this.powerUps.filter(b => b.x != this.powerUps[i].x);
      else if (rectCircleColliding(this.powerUps[i], this.bar)) {
        let type = this.powerUps[i].type;
        this.powerUps = this.powerUps.filter(b => b.x != this.powerUps[i].x);
        if (type === 1) {
          if (this.bar.lives < 15) {
            this.bar.lives += 1;
            showLives();
          }
        } else this.bar.width += 8;
      }
    }
  };

  this.draw = function() {
    if (this.bricks.length === 0) {
      alert("GANASTE!: " + this.points + " puntos!");
      reset();
    }
    if (this.bar.bullet.lost) {
      this.bar.lives -= 1;
      /* reseteo a los valores iniciales*/
      this.bar.bullet.isMoving = false;
      this.bar.bullet.lost = false;
      this.bar.bullet.speed = 4.5;
      this.bar.width = DIFFICULT_SELECTED.BAR_WIDTH;
      showLives();
      if (this.bar.lives === 0) {
        alert("PERDISTE!: " + this.points + " puntos.");
        this.gameover = true;
      }
    } else {
      this.bar.draw();
      for (let i = 0; i < this.bricks.length; i++) {
        var b = this.bricks[i];
        b.draw();

        if (rectCircleColliding(this.bar.bullet, b)) {
          this.bar.bullet.dirY =
            this.bar.bullet.dirY === BulletMovement.UP ? 2 : 8;
          b.lives -= 1;

          if (b.lives === 0) {
            var random = Math.floor(Math.random() * 10 + 1);
            if (random > 7) {
              var type = 0;
              if (random === 10) {
                this.points += 8;
                type = 1;
              } else this.points += 4;

              this.powerUps.push(new PowerUp(b.x, b.y, type));
            }
            this.bricks.splice(i, 1);
            this.points += 10;
          } else this.points += 5;
        }
      }
    }
    this.drawPowerUps();
  };

  this.moveBar = function(x) {
    if (x + this.bar.width < canvas.width) this.bar.setPosition(x, this.bar.y);
  };

  this.throwBullet = function() {
    this.bar.throwBullet();
  };

  this.start = function() {
    this.gaming = true;
    this.generateBricks(10);
    this.bar.start();
    for (let i = 0; i < this.bricks.length; i++) this.bricks[i].start();
    showLives();
  };
}

/* LADRILLO */
function Brick(x, y, lives = 0) {
  this.x = x;
  this.y = y;
  this.lives = 0;
  this.width = 55;
  this.height = 10;

  this.start = function() {
    this.lives =
      lives === 0
        ? Math.floor(Math.random() * DIFFICULT_SELECTED.MAX_BRICKS_LIVES + 1)
        : lives;
  };
  this.draw = function() {
    switch (this.lives) {
      case 5:
        ctx.fillStyle = "#7f03fc";
        break;
      case 4:
        ctx.fillStyle = "#0f0cc4";
        break;
      case 3:
        ctx.fillStyle = "#1ec40c";
        break;
      case 2:
        ctx.fillStyle = "#c47a0c";
        break;
      default:
        ctx.fillStyle = "#eee";
        break;
    }
    ctx.fillRect(this.x, this.y, this.width, this.height);
  };
}

/* BALA */
function Bullet(x, y) {
  this.x = x;
  this.y = y;
  this.isMoving = false;
  this.speed = 4;
  this.dirY = BulletMovement.UP;
  this.dirX = BulletMovement.RIGHT;
  this.lost = false;
  this.radius = 0;
  this.MAX_SPEED = 10;

  this.draw = function() {
    if (this.isMoving) {
      this.checkCollision();
    }
    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, this.radius, Math.PI * 2, false);
    ctx.strokeStyle = "white";
    ctx.stroke();
    ctx.fillStyle = "white";
    ctx.fill();
  };

  this.setPosition = function(x, y) {
    this.x = x;
    this.y = y;
  };

  this.start = () => (this.isMoving = true);

  this.checkCollision = function() {
    this.checkOutScreen();
    this.setPosition(this.x, this.y);
  };

  this.checkDirection = function() {
    switch (this.dirX) {
      case BulletMovement.LEFT:
        this.x -= this.speed;
        break;
      case BulletMovement.RIGHT:
        this.x += this.speed;
        break;
    }
    switch (this.dirY) {
      case BulletMovement.UP:
        this.y -= this.speed;
        break;
      case BulletMovement.DOWN:
        this.y += this.speed;
        break;
    }
  };

  this.checkOutScreen = function() {
    if (this.x >= canvas.width) this.dirX = BulletMovement.LEFT;
    else if (this.x <= 0) this.dirX = BulletMovement.RIGHT;

    if (this.y <= BAR_LIVE_LIMIT + 10) this.dirY = BulletMovement.DOWN;
    else if (this.y >= canvas.height) {
      this.lost = true;
      return;
    }

    this.checkDirection();
  };

  this.incrementSpeed = function(speed) {
    if (this.speed < this.MAX_SPEED) this.speed += speed;
  };
}

/* BARRA DEL JUGADOR */
function Bar(x, y) {
  this.x = x;
  this.y = y;
  this.width = 0;
  this.height = 10;
  this.lives = 0;
  this.bullet = new Bullet(this.x + 25, this.y - 5);

  this.start = function() {
    this.width = DIFFICULT_SELECTED.BAR_WIDTH;
    this.lives = DIFFICULT_SELECTED.PLAYER_LIVES;
  };

  this.draw = function() {
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(this.x, this.y, this.width, this.height);

    if (!this.bullet.isMoving) {
      this.bullet.x = this.x + this.width / 2;
      this.bullet.y = this.y - 5;
    } else this.checkBulletCollision();

    this.bullet.draw();
  };

  this.checkBulletCollision = function() {
    if (rectCircleColliding(this.bullet, this)) {
      this.bullet.dirY = BulletMovement.UP;
      this.bullet.incrementSpeed(0.2);
    }
  };

  this.throwBullet = function() {
    this.bullet.start();
  };
  this.setPosition = function(x, y) {
    this.x = x;
    this.y = y;
  };
}

/* POWERUP */
function PowerUp(x, y, type = 0) {
  this.x = x;
  this.y = y;
  this.type = type;
  this.radius = 0;
  this.color = "orange";
  this.draw = function() {
    if (type === 1) {
      this.color = "red";
    }
    ctx.beginPath();
    this.setPosition(this.x, this.y + 2);
    ctx.arc(this.x, this.y, 5, this.radius, Math.PI * 2, false);
    ctx.strokeStyle = this.color;
    ctx.stroke();
    ctx.fillStyle = this.color;
    ctx.fill();
  };

  this.setPosition = function(x, y) {
    this.x = x;
    this.y = y;
  };
}

function startGame() {
  game.start();
  setInterval(() => {
    update();
  }, 20);

  /* EVENTOS */
  canvas.onmousemove = e => {
    game.moveBar(e.pageX);
  };

  canvas.addEventListener("click", e => {
    game.throwBullet();
  });
}

function main() {
  let x = 100;
  let y = 50;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "000";
  ctx.font = "30px sans-serif";
  ctx.fillStyle = "white";
  ctx.fillText("(1) FACIL", canvas.width / 2 - x, canvas.height / 2 - y);
  ctx.fillText("(2) NORMAL", canvas.width / 2 - x, canvas.height / 2 - y + 30);
  ctx.fillText("(3) DIFICIL", canvas.width / 2 - x, canvas.height / 2 - y + 60);
  ctx.fillText(
    "(4) MUY DIFICIL",
    canvas.width / 2 - x,
    canvas.height / 2 - y + 90
  );
}

main();

document.addEventListener("keyup", e => {
  if (!game.gaming) {
    switch (e.key) {
      case "1":
        DIFFICULT_SELECTED = DIFFICULT_GAME.EASY;
        break;
      case "2":
        DIFFICULT_SELECTED = DIFFICULT_GAME.NORMAL;
        break;
      case "3":
        DIFFICULT_SELECTED = DIFFICULT_GAME.HARD;
        break;
      case "4":
        DIFFICULT_SELECTED = DIFFICULT_GAME.VERY_HARD;
        break;
    }
    startGame();
  }
});

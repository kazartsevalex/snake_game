const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const pointsDiv = document.getElementById('points');
const disclaimer = document.getElementById('disclaimer');

document.addEventListener('keydown', onKeyDown);

const states = {
  INITIAL: 0,
  PLAYING: 1,
  PAUSE: 2,
  GAME_OVER: 3
};
const TIMEOUT = 1000 / 12;

let size, points,
  snake_x, snake_y,
  gridSize = 16, spGridSize = 28, tileCount,
  food_x, food_y, sp_food_x, sp_food_y,
  xv, yv,
  tails, tail, r, g, b,
  foodTimer, gameLoop, timeout, pause_start, timeout_created_time, timeout_left,
  spFoodTimer, sp_timeout, sp_pause_start, sp_timeout_created_time, sp_timeout_left,
  state = states.INITIAL;

const x_step = spGridSize / 10;
const y_step = spGridSize / 18;

let x, y, x_max, y_max;

setInitials();
initialRender();

function setInitials() {
  size = 800;
  points = 0;
  snake_x = 10;
  snake_y = 10;
  tileCount = Math.floor(size / gridSize);
  xv = 1;
  yv = 0;
  tails = [];
  tail = 5;
  state = states.INITIAL;
  pointsDiv.classList.remove('newLeader');
}

function initialRender() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = '20px serif';
  ctx.fillStyle = 'lightgrey';
  ctx.textAlign = 'center';
  ctx.fillText('Press SPACEBAR to start', canvas.width / 2, canvas.height / 2);
}

function startGame() {
  disclaimer.remove();
  gameLoop = setInterval(game, TIMEOUT);
  setFoodPosition();
  setSpecialFoodPosition();
  state = states.PLAYING;
  displayPoints();
}

function unPauseGame() {
  gameLoop = setInterval(game, TIMEOUT);
  createFoodTimer(timeout_left);
  createSpecialFoodTimer(sp_timeout_left);
  state = states.PLAYING;
}

function game() {
  snake_x += xv;
  snake_y += yv;

  if (snake_x < 0) {
    onHitBoundaries();
    snake_x = 0;
    goRight();
  }
  if (snake_x > tileCount - 1) {
    onHitBoundaries();
    snake_x = tileCount;
    goLeft();
  }
  if (snake_y < 0) {
    onHitBoundaries();
    snake_y = 0;
    if (snake_x > tileCount) {
      snake_x = tileCount - 1;
    }
    goBottom();
  }
  if (snake_y > tileCount - 1) {
    onHitBoundaries();
    snake_y = tileCount;
    if (snake_x > tileCount) {
      snake_x = tileCount - 1;
    }
    goUp();
  }

  drawBack();
  drawSnake();

  if (snake_x === food_x && snake_y === food_y) {
    tail++;
    points++;
    displayPoints();
    clearTimeout(foodTimer);
    setFoodPosition();
  }

  if (snake_x >= sp_food_x &&
    snake_x * gridSize <= sp_food_x * gridSize + spGridSize &&
    snake_y >= sp_food_y &&
    snake_y * gridSize <= sp_food_y * gridSize + spGridSize) {
    tail += 2;
    points += 9;
    displayPoints();
    clearTimeout(spFoodTimer);
    setSpecialFoodPosition();
  }

  drawFood();
  drawSpecialFood();
}

function onHitBoundaries() {
  setSize(function() {
    replaceFood();
    tails = [];
  });
}

function pauseGame() {
  clearTimeout(gameLoop);
  clearTimeout(foodTimer);
  clearTimeout(spFoodTimer);
  pause_start = Date.now();
  sp_pause_start = Date.now();
  timeout_left = timeout - (pause_start - timeout_created_time);
  sp_timeout_left = sp_timeout - (sp_pause_start - sp_timeout_created_time);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, size, size);

  ctx.font = 'normal 30px serif';
  ctx.fillStyle = 'pink';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', size / 2, size / 2);

  state = states.PAUSE;
}

function gameOver() {
  clearTimeout(gameLoop);
  clearTimeout(foodTimer);
  clearTimeout(spFoodTimer);

  setTimeout(function() {
    size = 800;
    ctx.clearRect(0, 0, size, size);

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 30px serif';
    ctx.fillStyle = 'red';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 15);

    ctx.font = 'normal 20px serif';
    ctx.fillStyle = 'lightgrey';
    ctx.textAlign = 'center';
    ctx.fillText('Press SPACEBAR to start', canvas.width / 2, canvas.height / 2 + 15);

    state = states.GAME_OVER;

    localStorage.setItem('vanhack_snake', points);
  }, TIMEOUT);
}

function setSize(callback) {
  size -= 113;
  tileCount = Math.floor(size / gridSize);
  if (size > 0 && tail < tileCount) {
    callback();
  } else {
    gameOver();
  }
}

function replaceFood() {
  if (food_x > tileCount) {
    food_x = tileCount;
  }
  if (food_y > tileCount) {
    food_y = tileCount;
  }
  if (sp_food_x > tileCount) {
    sp_food_x = tileCount - (size / spGridSize);
  }
  if (sp_food_y > tileCount) {
    sp_food_y = tileCount - (size / spGridSize);
  }
}

function drawBack() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'lightgrey';
  ctx.fillRect(0, 0, size, size);
}

function drawSnake() {
  ctx.fillStyle = 'blue';
  for (let i = 0; i < tails.length; i++) {
    ctx.fillRect(tails[i].x * gridSize, tails[i].y * gridSize, gridSize - 2, gridSize - 2);
    if (tails[i].x === snake_x && tails[i].y === snake_y) {
      tail = 5;
      displayPoints();
      gameOver();
    }
  }
  tails.push({ x: snake_x, y: snake_y });
  while (tails.length > tail) {
    tails.shift();
  }
}

function createFoodTimer(tmt) {
  timeout = tmt || 4000 + Math.random() * 6000;
  timeout_created_time = Date.now();
  foodTimer = setTimeout(setFoodPosition, timeout);
}

function createSpecialFoodTimer(tmt) {
  sp_timeout = tmt || 1000 + Math.random() * 3000;
  sp_timeout_created_time = Date.now();
  spFoodTimer = setTimeout(setSpecialFoodPosition, sp_timeout);
}

function setFoodPosition() {
  food_x = Math.floor(Math.random() * tileCount);
  food_y = Math.floor(Math.random() * tileCount);
  createFoodTimer();
}

function setSpecialFoodPosition() {
  sp_food_x = Math.floor(Math.random() * tileCount);
  sp_food_y = Math.floor(Math.random() * tileCount);

  createSpecialFoodTimer();
}

function drawFood() {
  ctx.fillStyle = 'green';
  ctx.fillRect(food_x * gridSize, food_y * gridSize, gridSize - 2, gridSize - 2);
}

function drawSpecialFood() {
  r = Math.random() * 255;
  g = Math.random() * 255;
  b = Math.random() * 255;
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  x = sp_food_x * gridSize;
  y = sp_food_y * gridSize;
  x_max = x + spGridSize;
  y_max = y + spGridSize;

  if (x_max > size) {
    x = x - (x_max - size);
  }
  if (y_max > size) {
    y = y - (y_max - size);
  }

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + spGridSize, y);
  ctx.lineTo(x + spGridSize / 2, y + spGridSize);
  ctx.lineTo(x, y);
  ctx.fill();
}

function displayPoints() {
  pointsDiv.innerText = `Points: ${points}`;

  const prev_points = parseInt(localStorage.getItem('vanhack_snake') || 0);
  if (points > prev_points && prev_points !== 0) {
    pointsDiv.classList.add('newLeader');
  }
}

function goLeft() {
  xv = -1;
  yv = 0;
}

function goUp() {
  xv = 0;
  yv = -1;
}

function goRight() {
  xv = 1;
  yv = 0;
}

function goBottom() {
  xv = 0;
  yv = 1;
}

function onKeyDown(e) {
  switch (e.keyCode) {
    case 32:
      if (state === states.INITIAL) {
        startGame();
      } else if (state === states.GAME_OVER) {
        setInitials();
        startGame();
      } else if (state === states.PLAYING) {
        pauseGame();
      } else if (state === states.PAUSE) {
        unPauseGame();
      }
      break;

    case 37:
      if (state !== states.PLAYING) return false;
      if (xv === 1) return false;
      goLeft();
      break;

    case 38:
      if (state !== states.PLAYING) return false;
      if (yv === 1) return false;
      goUp();
      break;

    case 39:
      if (state !== states.PLAYING) return false;
      if (xv === -1) return false;
      goRight();
      break;

    case 40:
      if (state !== states.PLAYING) return false;
      if (yv === -1) return false;
      goBottom();
      break;
  }
}

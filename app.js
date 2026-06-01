const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("scoreText");
const timeText = document.getElementById("timeText");
const ui = document.getElementById("ui");
const startScreen = document.getElementById("startScreen");
const countdownScreen = document.getElementById("countdownScreen");
const countdownText = document.getElementById("countdownText");
const pauseScreen = document.getElementById("pauseScreen");
const curtainTransition = document.getElementById("curtainTransition");
const curtainImage = curtainTransition.querySelector("img");
const gameOverScreen = document.getElementById("gameOverScreen");
const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");
const restartButton = document.getElementById("restartButton");
const finalScoreText = document.getElementById("finalScoreText");

let canvasWidth = 0;
let canvasHeight = 0;

let score = 0;
let timeLeft = 40;
let gameRunning = false;
let gamePaused = false;
let countdownRunning = false;
let curtainClosing = false;
let lastTime = 0;
let spawnTimer = 0;
let elapsedTimer = 0;

const targets = [];
const effects = [];
const GAME_DURATION_SECONDS = 40;
const TARGET_RADIUS = 30;
const MIN_TOUCH_RADIUS = 46;
const TRAIN_HIT_PADDING_X = 24;
const TRAIN_HIT_PADDING_TOP = 18;
const TRAIN_HIT_PADDING_BOTTOM = 34;
const TRAIN_IMAGE_WIDTH = 120;
const TRAIN_IMAGE_HEIGHT = 90;
const TRAIN_IMAGE_PATH = "assets/images/train-car-storybook.png";
const RAIL_IMAGE_WIDTH = 2170;
const RAIL_IMAGE_HEIGHT = 220;
const RAIL_IMAGE_PATH = "assets/images/rail-track-transparent.png";
const RAIL_IMAGE_RAIL_OFFSET = 0.32;
const BACKGROUND_IMAGE_PATH = "assets/images/wilderness-background.png";

const trainImage = new Image();
const railImage = new Image();
const backgroundImage = new Image();
let isTrainImageLoaded = false;
let isRailImageLoaded = false;
let isBackgroundImageLoaded = false;

trainImage.addEventListener("load", () => {
  isTrainImageLoaded = true;
  draw();
});

trainImage.src = TRAIN_IMAGE_PATH;

railImage.addEventListener("load", () => {
  isRailImageLoaded = true;
  draw();
});

railImage.src = RAIL_IMAGE_PATH;

backgroundImage.addEventListener("load", () => {
  isBackgroundImageLoaded = true;
  draw();
});

backgroundImage.src = BACKGROUND_IMAGE_PATH;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();

  canvasWidth = rect.width || window.innerWidth;
  canvasHeight = rect.height || window.innerHeight;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvasWidth * dpr;
  canvas.height = canvasHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  draw();
}

function getLaneY(laneIndex) {
  const topMargin = canvasHeight * 0.475;
  const laneGap = canvasHeight * 0.15;
  return topMargin + laneGap * laneIndex;
}

function chooseTargetPoint() {
  const random = Math.random();

  if (random < 0.55) {
    return 5;
  }
  if (random < 0.85) {
    return 10;
  }
  return 15;
}

function getTargetRadius(point) {
  return TARGET_RADIUS;
}

function getTargetColor(point) {
  if (point === 5) return "#66ddff";
  if (point === 10) return "#ffcc33";
  return "#ff6666";
}

function getTargetSpeed(point) {
  return 140 + point * 10 + Math.random() * 40;
}

function spawnTarget() {
  const lane = Math.floor(Math.random() * 3);
  const point = chooseTargetPoint();
  const radius = getTargetRadius(point);

  targets.push({
    x: canvasWidth + 120,
    y: getLaneY(lane),
    lane,
    point,
    radius,
    speed: getTargetSpeed(point),
    targetDestroyed: false
  });
}

function startGame() {
  if (gameRunning) return;

  score = 0;
  timeLeft = GAME_DURATION_SECONDS;
  gamePaused = false;
  spawnTimer = 0;
  elapsedTimer = 0;
  lastTime = performance.now();
  targets.length = 0;
  effects.length = 0;

  scoreText.textContent = "SCORE: 0";
  timeText.textContent = `TIME: ${GAME_DURATION_SECONDS}`;

  startScreen.style.display = "none";
  countdownScreen.style.display = "none";
  pauseScreen.style.display = "none";
  resetCurtain();
  gameOverScreen.style.display = "none";
  ui.style.display = "flex";
  pauseButton.style.display = "block";
  pauseButton.setAttribute("aria-label", "ゲームを一時停止");

  gameRunning = true;
  requestAnimationFrame(gameLoop);
}

function endGame() {
  gameRunning = false;
  gamePaused = false;
  curtainClosing = true;
  pauseScreen.style.display = "none";
  pauseButton.style.display = "none";
  finalScoreText.textContent = `SCORE: ${score}`;
  curtainTransition.classList.add("isClosing");
}

function resetCurtain() {
  curtainClosing = false;
  curtainTransition.classList.remove("isClosing");
}

function showGameOverScreen() {
  if (!curtainClosing) return;

  curtainClosing = false;
  ui.style.display = "none";
  gameOverScreen.style.display = "flex";
}

function pauseGame() {
  if (!gameRunning || gamePaused) return;

  gamePaused = true;
  pauseScreen.style.display = "flex";
  pauseButton.setAttribute("aria-label", "ゲームを再開");
}

function resumeGame() {
  if (!gameRunning || !gamePaused) return;

  gamePaused = false;
  pauseScreen.style.display = "none";
  pauseButton.setAttribute("aria-label", "ゲームを一時停止");
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function togglePause(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (gamePaused) {
    resumeGame();
  } else {
    pauseGame();
  }
}

function update(deltaTime) {
  elapsedTimer += deltaTime;
  spawnTimer -= deltaTime;

  if (elapsedTimer >= 1) {
    elapsedTimer -= 1;
    timeLeft--;

    if (timeLeft < 0) {
      timeLeft = 0;
    }

    timeText.textContent = `TIME: ${timeLeft}`;

    if (timeLeft <= 0) {
      endGame();
      return;
    }
  }

  if (spawnTimer <= 0) {
    spawnTarget();
    spawnTimer = 0.55 + Math.random() * 0.55;
  }

  for (let i = targets.length - 1; i >= 0; i--) {
    const target = targets[i];
    target.x -= target.speed * deltaTime;

    if (target.x < -160) {
      targets.splice(i, 1);
    }
  }

  for (let i = effects.length - 1; i >= 0; i--) {
    const effect = effects[i];
    effect.life -= deltaTime;
    effect.x += effect.vx * deltaTime;
    effect.y += effect.vy * deltaTime;
    effect.vy += 180 * deltaTime;

    if (effect.life <= 0) {
      effects.splice(i, 1);
    }
  }
}

function drawBackground() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  if (isBackgroundImageLoaded) {
    const imageScale = Math.max(
      canvasWidth / backgroundImage.naturalWidth,
      canvasHeight / backgroundImage.naturalHeight
    );
    const imageWidth = backgroundImage.naturalWidth * imageScale;
    const imageHeight = backgroundImage.naturalHeight * imageScale;

    ctx.drawImage(
      backgroundImage,
      (canvasWidth - imageWidth) / 2,
      (canvasHeight - imageHeight) / 2,
      imageWidth,
      imageHeight
    );
  } else {
    ctx.fillStyle = "#1f293f";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  for (let i = 0; i < 3; i++) {
    const y = getLaneY(i) + 102;

    if (isRailImageLoaded) {
      const trackHeight = Math.min(96, canvasHeight * 0.15);
      const trackWidth = RAIL_IMAGE_WIDTH * (trackHeight / RAIL_IMAGE_HEIGHT);
      const trackTop = y - trackHeight * RAIL_IMAGE_RAIL_OFFSET;

      for (let x = -trackWidth; x < canvasWidth + trackWidth; x += trackWidth) {
        ctx.drawImage(railImage, x, trackTop, trackWidth, trackHeight);
      }
    } else {
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 3;
      for (let x = -40; x < canvasWidth + 40; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, y - 14);
        ctx.lineTo(x + 26, y + 14);
        ctx.stroke();
      }
    }
  }

  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.font = "bold 42px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("TARGET TRAIN", canvasWidth / 2, canvasHeight * 0.13);
}

function drawTrainCar(target) {
  const carWidth = TRAIN_IMAGE_WIDTH;
  const carHeight = TRAIN_IMAGE_HEIGHT;
  const carX = target.x - carWidth / 2;
  const carY = target.y + 20;

  if (isTrainImageLoaded) {
    ctx.drawImage(trainImage, carX, carY, carWidth, carHeight);
    return;
  }

  ctx.fillStyle = "#6b4f3a";
  ctx.fillRect(carX, carY, carWidth, carHeight);

  ctx.strokeStyle = "#d6a35d";
  ctx.lineWidth = 4;
  ctx.strokeRect(carX, carY, carWidth, carHeight);

  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(carX + carWidth * 0.33, carY);
  ctx.lineTo(carX + carWidth * 0.33, carY + carHeight);
  ctx.moveTo(carX + carWidth * 0.66, carY);
  ctx.lineTo(carX + carWidth * 0.66, carY + carHeight);
  ctx.stroke();

  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(carX + 25, carY + carHeight + 8, 10, 0, Math.PI * 2);
  ctx.arc(carX + carWidth - 25, carY + carHeight + 8, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#777";
  ctx.beginPath();
  ctx.arc(carX + 25, carY + carHeight + 8, 4, 0, Math.PI * 2);
  ctx.arc(carX + carWidth - 25, carY + carHeight + 8, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawTarget(target) {
  drawTrainCar(target);

  if (target.targetDestroyed) {
    return;
  }

  ctx.fillStyle = getTargetColor(target.point);
  ctx.beginPath();
  ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(target.x, target.y, target.radius * 0.62, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = getTargetColor(target.point);
  ctx.beginPath();
  ctx.arc(target.x, target.y, target.radius * 0.32, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#222";
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(target.point, target.x, target.y);
}

function drawEffects() {
  for (const effect of effects) {
    const alpha = Math.max(effect.life / effect.maxLife, 0);

    ctx.globalAlpha = alpha;
    ctx.fillStyle = effect.color;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function draw() {
  if (!ctx || canvasWidth === 0 || canvasHeight === 0) return;

  drawBackground();

  for (const target of targets) {
    drawTarget(target);
  }

  drawEffects();
}

function createDestroyEffect(x, y, color) {
  for (let i = 0; i < 18; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 90 + Math.random() * 180;

    effects.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 4 + Math.random() * 5,
      life: 0.45 + Math.random() * 0.25,
      maxLife: 0.7,
      color
    });
  }
}

function getInputPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const source = event.changedTouches ? event.changedTouches[0] : event;

  return {
    x: source.clientX - rect.left,
    y: source.clientY - rect.top
  };
}

function isTargetHit(tapX, tapY, target) {
  const dx = tapX - target.x;
  const dy = tapY - target.y;
  const touchRadius = Math.max(target.radius, MIN_TOUCH_RADIUS);
  const isTargetCircleHit = dx * dx + dy * dy <= touchRadius * touchRadius;

  const carLeft = target.x - TRAIN_IMAGE_WIDTH / 2 - TRAIN_HIT_PADDING_X;
  const carRight = target.x + TRAIN_IMAGE_WIDTH / 2 + TRAIN_HIT_PADDING_X;
  const carTop = target.y - target.radius - TRAIN_HIT_PADDING_TOP;
  const carBottom = target.y + 20 + TRAIN_IMAGE_HEIGHT + TRAIN_HIT_PADDING_BOTTOM;
  const isTrainBodyHit =
    tapX >= carLeft &&
    tapX <= carRight &&
    tapY >= carTop &&
    tapY <= carBottom;

  return isTargetCircleHit || isTrainBodyHit;
}

function handleGameInput(event) {
  if (!gameRunning || gamePaused) return;

  event.preventDefault();

  const { x: tapX, y: tapY } = getInputPoint(event);

  for (let i = targets.length - 1; i >= 0; i--) {
    const target = targets[i];
    if (target.targetDestroyed) {
      continue;
    }

    if (isTargetHit(tapX, tapY, target)) {
      score += target.point;
      scoreText.textContent = `SCORE: ${score}`;

      createDestroyEffect(target.x, target.y, getTargetColor(target.point));
      target.targetDestroyed = true;
      break;
    }
  }
}

function handleStartInput(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  startCountdown();
}

function startCountdown() {
  if (gameRunning || countdownRunning || curtainClosing) return;

  countdownRunning = true;
  startScreen.style.display = "none";
  resetCurtain();
  gameOverScreen.style.display = "none";
  countdownScreen.style.display = "flex";
  ui.style.display = "flex";
  pauseScreen.style.display = "none";
  pauseButton.style.display = "none";
  scoreText.textContent = "SCORE: 0";
  timeText.textContent = `TIME: ${GAME_DURATION_SECONDS}`;

  const countdownSteps = ["3", "2", "1", "START"];
  let stepIndex = 0;
  countdownText.textContent = countdownSteps[stepIndex];

  const showNextStep = () => {
    stepIndex++;

    if (stepIndex >= countdownSteps.length) {
      countdownRunning = false;
      startGame();
      return;
    }

    countdownText.textContent = countdownSteps[stepIndex];
    window.setTimeout(showNextStep, 1000);
  };

  window.setTimeout(showNextStep, 1000);
}

function gameLoop(currentTime) {
  if (!gameRunning || gamePaused) return;

  const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.033);
  lastTime = currentTime;

  update(deltaTime);
  draw();

  if (gameRunning) {
    requestAnimationFrame(gameLoop);
  }
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);

if (window.PointerEvent) {
  canvas.addEventListener("pointerdown", handleGameInput, { passive: false });
} else {
  canvas.addEventListener("touchstart", handleGameInput, { passive: false });
  canvas.addEventListener("mousedown", handleGameInput, { passive: false });
}

if (startButton) {
  startButton.addEventListener("click", handleStartInput);
  startButton.addEventListener("pointerdown", handleStartInput, { passive: false });
  startButton.addEventListener("touchstart", handleStartInput, { passive: false });
}

if (window.PointerEvent) {
  pauseButton.addEventListener("pointerdown", togglePause, { passive: false });
} else {
  pauseButton.addEventListener("touchstart", togglePause, { passive: false });
  pauseButton.addEventListener("mousedown", togglePause, { passive: false });
}

restartButton.addEventListener("click", handleStartInput);
restartButton.addEventListener("pointerdown", handleStartInput, { passive: false });
restartButton.addEventListener("touchstart", handleStartInput, { passive: false });
curtainImage.addEventListener("animationend", showGameOverScreen);

startScreen.addEventListener("pointerdown", handleStartInput, { passive: false });
startScreen.addEventListener("touchstart", handleStartInput, { passive: false });

resizeCanvas();
draw();

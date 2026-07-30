(() => {
  "use strict";

  const canvas = document.querySelector("#pinball");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const scoreEl = document.querySelector("#score");
  const highScoreEl = document.querySelector("#high-score");
  const growthEl = document.querySelector("#growth");
  const livesEl = document.querySelector("#lives");
  const statusEl = document.querySelector("#game-status");
  const recordEl = document.querySelector("#game-record");
  const startButton = document.querySelector("#start-game");
  const pauseButton = document.querySelector("#pause-game");
  const restartButton = document.querySelector("#restart-game");
  const width = canvas.width;
  const height = canvas.height;
  const paddle = { x: width / 2 - 48, y: height - 28, width: 96, height: 12, speed: 5 };
  const ball = { x: width / 2, y: height - 48, radius: 8, vx: 3, vy: -3 };
  const keys = new Set();
  let blocks = [];
  let missiles = [];
  let score = 0;
  let highScore = Number(localStorage.getItem("pinball-high-score") || 0);
  let growth = 1;
  let lives = 3;
  let running = false;
  let paused = false;
  let won = false;
  let animationFrameId = 0;
  let lastDirection = 0;
  let fireAt = 0;

  highScoreEl.textContent = String(highScore);

  function createBlocks() {
    const next = [];
    const rows = 4;
    const cols = 8;
    const gap = 7;
    const blockWidth = (width - 48 - gap * (cols - 1)) / cols;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        next.push({ x: 24 + col * (blockWidth + gap), y: 42 + row * 26, width: blockWidth, height: 18, hp: row === 0 ? 2 : 1 });
      }
    }
    return next;
  }

  function resetBall() {
    ball.x = width / 2;
    ball.y = height - 48;
    ball.vx = 3;
    ball.vy = -3;
    paddle.x = width / 2 - paddle.width / 2;
  }

  function resetGame() {
    blocks = createBlocks();
    missiles = [];
    score = 0;
    growth = 1;
    lives = 3;
    won = false;
    paused = false;
    resetBall();
    updateHud();
    setStatus("플레이 중 — 블럭을 모두 제거하세요!");
  }

  function updateHud() {
    scoreEl.textContent = String(score);
    highScoreEl.textContent = String(highScore);
    growthEl.textContent = String(growth);
    livesEl.textContent = String(lives);
  }

  function setStatus(message) { statusEl.textContent = message; }

  function setPaddleDirection(direction) {
    if (direction !== 0 && lastDirection !== 0 && direction === -lastDirection) return;
    lastDirection = direction;
  }

  function fireMissile() {
    const now = performance.now();
    if (!running || paused || won || now - fireAt < 240 || missiles.length >= 3) return;
    fireAt = now;
    missiles.push({ x: paddle.x + paddle.width / 2, y: paddle.y, speed: 7 });
  }

  function hitBlock(block, source) {
    block.hp -= 1;
    if (block.hp > 0) return false;
    blocks = blocks.filter((item) => item !== block);
    score += source === "missile" ? 25 * growth : 10 * growth;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("pinball-high-score", String(highScore));
    }
    growth = 1 + Math.floor((32 - blocks.length) / 5);
    updateHud();
    if (blocks.length === 0) finishGame(true);
    return true;
  }

  function overlapsCircleRect(circle, rect) {
    const x = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const y = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
    return Math.hypot(circle.x - x, circle.y - y) <= circle.radius;
  }

  function update() {
    if (keys.has("ArrowLeft") || keys.has("a")) setPaddleDirection(-1);
    else if (keys.has("ArrowRight") || keys.has("d")) setPaddleDirection(1);
    else setPaddleDirection(0);
    paddle.x = Math.max(0, Math.min(width - paddle.width, paddle.x + lastDirection * paddle.speed));
    ball.x += ball.vx;
    ball.y += ball.vy;
    if (ball.x < ball.radius || ball.x > width - ball.radius) ball.vx *= -1;
    if (ball.y < ball.radius) ball.vy *= -1;
    if (ball.vy > 0 && overlapsCircleRect(ball, paddle)) {
      ball.vy = -Math.abs(ball.vy);
      ball.vx = ((ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2)) * 4;
    }
    blocks.forEach((block) => {
      if (overlapsCircleRect(ball, block)) {
        ball.vy *= -1;
        hitBlock(block, "ball");
      }
    });
    missiles = missiles.filter((missile) => {
      missile.y -= missile.speed;
      const block = blocks.find((item) => missile.x >= item.x && missile.x <= item.x + item.width && missile.y >= item.y && missile.y <= item.y + item.height);
      if (block) { hitBlock(block, "missile"); return false; }
      return missile.y > 0;
    });
    if (ball.y > height + ball.radius) {
      lives -= 1;
      updateHud();
      if (lives <= 0) finishGame(false);
      else resetBall();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#0b0b11";
    ctx.fillRect(0, 0, width, height);
    blocks.forEach((block) => {
      ctx.fillStyle = block.hp > 1 ? "#7c5cff" : "#ff4f8b";
      ctx.fillRect(block.x, block.y, block.width, block.height);
    });
    ctx.fillStyle = "#f5f5f7";
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffd166";
    missiles.forEach((missile) => ctx.fillRect(missile.x - 2, missile.y - 8, 4, 12));
    if (paused || won || !running) {
      ctx.fillStyle = "rgb(16 16 20 / 74%)";
      ctx.fillRect(0, 0, width, height);
    }
  }

  function loop() {
    if (!running) return;
    if (!paused && !won) update();
    draw();
    animationFrameId = requestAnimationFrame(loop);
  }

  function finishGame(success) {
    won = success;
    running = false;
    pauseButton.disabled = true;
    if (success) {
      const record = `최고 기록 ${score}점 — 블럭 격파 성공! 🎉`;
      setStatus("블럭 격파 완료! 핀볼 영웅 등극, 공도 미사일도 오늘은 네 편이야! 🎉");
      localStorage.setItem("pinball-last-record", record);
      if (recordEl) recordEl.textContent = record;
    }
    else setStatus("게임 오버 — 재시작하고 다시 도전하세요.");
    draw();
  }

  function startGame() {
    if (running) return;
    if (won || lives <= 0 || blocks.length === 0) resetGame();
    running = true;
    paused = false;
    pauseButton.disabled = false;
    pauseButton.textContent = "일시정지";
    cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(loop);
  }

  startButton.addEventListener("click", startGame);
  restartButton.addEventListener("click", () => { running = false; cancelAnimationFrame(animationFrameId); resetGame(); draw(); startGame(); });
  pauseButton.addEventListener("click", () => { if (!running) return; paused = !paused; pauseButton.textContent = paused ? "계속하기" : "일시정지"; setStatus(paused ? "일시정지" : "플레이 중 — 블럭을 모두 제거하세요!"); });
  canvas.addEventListener("click", fireMissile);
  window.addEventListener("keydown", (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (["ArrowLeft", "ArrowRight", " "].includes(event.key) || ["a", "d", "w", "s"].includes(key)) event.preventDefault();
    keys.add(key);
    if (event.key === " " || key === "w") fireMissile();
  });
  window.addEventListener("keyup", (event) => { keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key); });
  document.querySelectorAll("[data-direction]").forEach((button) => {
    const direction = button.dataset.direction === "left" ? -1 : 1;
    button.addEventListener("pointerdown", () => setPaddleDirection(direction));
    button.addEventListener("pointerup", () => setPaddleDirection(0));
    button.addEventListener("pointercancel", () => setPaddleDirection(0));
    button.addEventListener("pointerleave", () => setPaddleDirection(0));
  });
  document.querySelector("[data-fire]").addEventListener("click", fireMissile);
  resetGame();
  draw();
})();

(() => {
  document.documentElement.classList.add("js");
  const record = document.querySelector("#game-record");
  const lastGame = localStorage.getItem("pinball-last-record");
  if (record && lastGame) record.textContent = lastGame;
})();

(() => {
  const canvas = document.querySelector("#drive-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let distance = 0;
  let last = 0;

  function hill(offset, base, color, height) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, base);
    for (let x = -80; x <= canvas.width + 80; x += 80) {
      const y = base - height * (0.5 + 0.5 * Math.sin((x + offset) * 0.012));
      ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, base);
    ctx.closePath();
    ctx.fill();
  }

  function tree(x, y, scale, color) {
    ctx.fillStyle = "#211b2c";
    ctx.fillRect(x - 2 * scale, y, 4 * scale, 34 * scale);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - 42 * scale); ctx.lineTo(x - 19 * scale, y - 3 * scale);
    ctx.lineTo(x + 19 * scale, y - 3 * scale); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y - 25 * scale); ctx.lineTo(x - 23 * scale, y + 10 * scale);
    ctx.lineTo(x + 23 * scale, y + 10 * scale); ctx.closePath(); ctx.fill();
  }

  function car() {
    const x = canvas.width * .53, y = canvas.height * .73;
    ctx.save();
    ctx.translate(x, y + Math.sin(distance * .09) * 1.5);
    ctx.fillStyle = "#d94368";
    ctx.beginPath();
    ctx.moveTo(-150, 22); ctx.lineTo(-120, -9); ctx.quadraticCurveTo(-75, -34, -22, -36);
    ctx.lineTo(28, -33); ctx.quadraticCurveTo(66, -28, 102, 5); ctx.lineTo(143, 16);
    ctx.quadraticCurveTo(151, 24, 140, 34); ctx.lineTo(-143, 34); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#8ee6ed";
    ctx.beginPath(); ctx.moveTo(-87, -10); ctx.lineTo(-49, -29); ctx.lineTo(-17, -29); ctx.lineTo(-7, -10); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(2, -10); ctx.lineTo(33, -27); ctx.quadraticCurveTo(57, -23, 78, -2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#f7d36a"; ctx.fillRect(125, 11, 15, 8);
    ctx.fillStyle = "#ff6b7d"; ctx.fillRect(-139, 12, 13, 8);
    for (const wheelX of [-91, 91]) {
      ctx.fillStyle = "#11121a"; ctx.beginPath(); ctx.arc(wheelX, 34, 25, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#8e91a7"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(wheelX, 34, 12, 0, Math.PI * 2); ctx.stroke();
      ctx.save(); ctx.translate(wheelX, 34); ctx.rotate(distance * .18); ctx.strokeStyle = "#e5b9d0"; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 10); ctx.stroke(); } ctx.restore();
    }
    ctx.restore();
  }

  function draw(time) {
    const dt = Math.min(40, time - last || 16); last = time;
    if (!reduced) distance += dt * .08;
    const w = canvas.width, h = canvas.height;
    const sky = ctx.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, "#27254a"); sky.addColorStop(.58, "#d46b72"); sky.addColorStop(1, "#f1b56b");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#ffd887"; ctx.beginPath(); ctx.arc(w * .74, h * .3, 34, 0, Math.PI * 2); ctx.fill();
    hill(distance * .12, h * .64, "#40365d", 92); hill(distance * .28, h * .7, "#2a2942", 62);
    ctx.fillStyle = "#24212d"; ctx.fillRect(0, h * .72, w, h * .28);
    ctx.fillStyle = "#433444"; ctx.fillRect(0, h * .76, w, 3);
    for (let x = -40 - (distance * .55 % 120); x < w + 120; x += 120) tree(x, h * .72, .55, "#314050");
    ctx.strokeStyle = "#d2a9a1"; ctx.lineWidth = 3;
    for (let x = -80 - (distance % 180); x < w + 180; x += 180) { ctx.beginPath(); ctx.moveTo(x, h * .72); ctx.lineTo(x + 25, h * .54); ctx.stroke(); }
    ctx.fillStyle = "#e4c27f";
    for (let x = -40 - (distance * 1.6 % 100); x < w + 100; x += 100) ctx.fillRect(x, h * .88, 45, 5);
    car();
    if (!reduced) requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();

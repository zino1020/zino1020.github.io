(() => {
  document.documentElement.classList.add("js");
  const record = document.querySelector("#game-record");
  const lastGame = localStorage.getItem("pinball-last-record");
  if (record && lastGame) record.textContent = lastGame;
})();

(() => {
  document.documentElement.classList.add("js");

  const form = document.querySelector("#guestbook-form");
  const list = document.querySelector("#guestbook-list");
  if (!form || !list) return;
  const storageKey = "portfolio-guestbook";
  const record = document.querySelector("#game-record");
  const entries = JSON.parse(localStorage.getItem(storageKey) || "[]");

  const render = () => {
    list.replaceChildren();
    entries.slice(-8).reverse().forEach((entry) => {
      const item = document.createElement("li");
      const name = document.createElement("strong");
      const message = document.createElement("span");
      name.textContent = entry.name;
      message.textContent = entry.message;
      item.append(name, message);
      list.append(item);
    });
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const message = String(data.get("message") || "").trim();
    if (!name || !message) return;
    entries.push({ name, message });
    localStorage.setItem(storageKey, JSON.stringify(entries.slice(-8)));
    form.reset();
    render();
  });

  const lastGame = localStorage.getItem("pinball-last-record");
  if (record && lastGame) record.textContent = lastGame;
  render();
})();

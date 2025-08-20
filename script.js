const chat = document.getElementById("chat");
const msg = document.getElementById("msg");
const send = document.getElementById("send");
const history = [];

function addBubble(text, cls="bot") {
  const div = document.createElement("div");
  div.className = `bubble ${cls}`;
  div.textContent = text;
  chat.appendChild(div);
  window.scrollTo(0, document.body.scrollHeight);
}

async function ask() {
  const content = msg.value.trim();
  if (!content) return;
  addBubble(content, "user");
  msg.value = "";
  send.disabled = true;

  try {
    const r = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: content, history })
    });
    const data = await r.json();
    const answer = data.answer || (data.error ? (data.error + (data.detail ? " — " + data.detail : "")) : "Maaf, ada gangguan pada server.");
    addBubble(answer, "bot");
    history.push({ role: "user", content });
    history.push({ role: "assistant", content: answer });
  } catch (e) {
    addBubble("Gagal terhubung ke server.", "bot");
  } finally {
    send.disabled = false;
  }
}

send.onclick = ask;
msg.addEventListener("keydown", e => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) ask();
});

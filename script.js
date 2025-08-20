<script>
const chat = document.getElementById("chat");
const msg = document.getElementById("msg");
const send = document.getElementById("send");
const history = [];

// >>> GANTI ini dengan domain Vercel kamu
const VERCEL_API = "https://NAMA-PROJEK.vercel.app/api/ask"; // contoh: https://adhd-assistant-mukemen.vercel.app/api/ask

// Pakai /api/ask kalau hostnya vercel.app (frontend di Vercel). Selain itu pakai URL penuh Vercel (mis. GitHub Pages).
const API_BASE = location.hostname.endsWith("vercel.app") ? "/api/ask" : VERCEL_API;

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
    console.log("Memanggil API:", API_BASE);
    const r = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: content, history })
    });

    // kalau server balas non-200, tampilkan error-nya
    if (!r.ok) {
      const txt = await r.text();
      addBubble(`Server error (${r.status}): ${txt}`, "bot");
      return;
    }

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
</script>

const form = document.getElementById('chatForm');
const input = document.getElementById('msg');
const messages = document.getElementById('messages');

function append(role, text) {
  const el = document.createElement('div');
  el.className = 'msg ' + role;
  el.textContent = text;
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  append('user', text);
  input.value = '';
  append('pending', '...');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history: [] })
    });
    const data = await res.json();
    document.querySelector('.msg.pending').remove();
    if (data.reply) append('assistant', data.reply);
    else append('error', data.error || 'Brak odpowiedzi');
  } catch (err) {
    document.querySelector('.msg.pending').remove();
    append('error', err.message || 'Błąd sieci');
  }
});

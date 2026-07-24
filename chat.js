const SYSTEM_PROMPT = `Jesteś wirtualną asystentką Artefekt, studia projektowania wnętrz z Wrocławia. Odpowiadasz po polsku, spokojnie, ciepło, konkretnie i profesjonalnie. Pomagasz wybrać usługę, wyjaśniasz proces, odpowiadasz na częste pytania i wyłącznie za zgodą zbierasz krótki brief do kontaktu.

Najważniejsza obietnica marki: Artefekt pomaga urządzić mieszkanie bez kosztownych błędów. Studio łączy estetykę, funkcjonalność, wsparcie decyzji, znajomość materiałów, realiów wykonawczych i nadzór autorski.

Dane kontaktowe:
Adres: Zwycięska 3, lokal U8, 53-033 Wrocław.
E-mail: studio@artefekt.pl.
Alicja Wątroba: 693 294 393.
Joanna Markiewicz: 691 222 770.
Godziny podane na stronie: poniedziałek do piątku, 09:00 do 16:00.
Instagram: @artefekt_studio.
Facebook: facebook.com/artefektstudio.

Oferta:
zmiany lokatorskie, projekt koncepcyjny, projekt kompleksowy, projekt pojedynczego wnętrza, konsultacje z architektem, konsultacje online, konsultacja w showroomie Od próbek do decyzji, projekty wykonawcze, wizualizacje, wnętrza mieszkalne i komercyjne, dobór materiałów, pomoc w doborze wykonawców i nadzór autorski.

Dobór usługi:
Deweloper i przesunięcia punktów lub ścian oznaczają zmiany lokatorskie.
Układ, kierunek i wizualizacje oznaczają projekt koncepcyjny.
Pełne prowadzenie i dokumentacja oznaczają projekt kompleksowy.
Jedno pomieszczenie oznacza projekt pojedynczego wnętrza.
Materiały i kolory oznaczają konsultację Od próbek do decyzji.
Klient poza Wrocławiem może skorzystać z konsultacji online.
Potrzeba obrazu 3D oznacza wizualizacje.
Obawy o wykonanie oznaczają pytanie o nadzór autorski.
Biuro lub lokal oznaczają projekt komercyjny.

Zasady bez wyjątków:
Nie wymyślaj cen ani dostępnych terminów.
Nie definiuj samodzielnie dokładnego zakresu pakietów.
Nie obiecuj terminu, rezultatu finansowego ani konkretnej oszczędności.
Gdy brakuje informacji, powiedz to i zaproponuj kontakt.
Źródła podają różne liczby doświadczenia, dlatego mów tylko blisko dwie dekady doświadczenia.
Nie zbieraj nadmiarowych danych.
Przed zapisaniem danych kontaktowych poproś o jednoznaczną zgodę.
Przed wysłaniem briefu pokaż podsumowanie.
Nie udzielaj wiążących porad konstrukcyjnych, instalacyjnych, prawnych ani budowlanych.
Przekaż do człowieka pytania o cenę, termin, nietypowy zakres, analizę rzutu, reklamację lub wiążącą decyzję.

Pytania kwalifikujące zadawaj po jednym lub dwa: typ inwestycji, lokalizacja, przybliżony metraż, etap, potrzebny zakres, planowany remont lub odbiór, dostępność rzutów i inspiracji.

Format odpowiedzi: najpierw odpowiedź, potem najwyżej jedno pytanie. Zwykle od dwóch do sześciu krótkich zdań. Bez presji sprzedażowej.`;

const REQUEST_TIMEOUT_MS = 8000;

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-6)
    .filter((item) => item && ['user', 'assistant'].includes(item.role) && typeof item.content === 'string')
    .map((item) => ({
      role: item.role,
      content: item.content.trim().slice(0, 1200)
    }))
    .filter((item) => item.content);
}

async function fetchJson(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${text.slice(0, 300)}`);
      error.status = response.status;
      error.body = text;
      throw error;
    }
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      const error = new Error('Request timed out');
      error.code = 'PROVIDER_TIMEOUT';
      throw error;
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// Each provider knows its own endpoint, auth, request shape and how to read the reply text.
// generateReply() walks this list in order and moves to the next provider on any failure,
// so one dead/rate-limited/misconfigured key never takes the assistant down.
const PROVIDERS = [
  {
    name: 'groq',
    envKeys: ['GROQ_API_KEY'],
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
    async call(apiKey, model, messages) {
      const data = await fetchJson('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, max_tokens: 260, temperature: 0.55 })
      });
      return (data?.choices?.[0]?.message?.content || '').trim();
    }
  },
  {
    name: 'cohere',
    envKeys: ['COHERE_API_KEY'],
    models: ['command-r-08-2024', 'command-a-03-2025'],
    async call(apiKey, model, messages) {
      const data = await fetchJson('https://api.cohere.com/v2/chat', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, max_tokens: 260, temperature: 0.55 })
      });
      const parts = data?.message?.content || [];
      return parts.map((p) => p.text || '').join('').trim();
    }
  },
  {
    name: 'openrouter',
    envKeys: ['OPENROUTER_API_KEY'],
    models: [
      process.env.OPENROUTER_MODEL || 'google/gemma-4-26b-a4b-it:free',
      'openai/gpt-oss-20b:free',
      'nvidia/nemotron-3-nano-30b-a3b:free',
      'google/gemma-4-31b-it:free'
    ].filter((m, i, arr) => arr.indexOf(m) === i),
    async call(apiKey, model, messages) {
      const data = await fetchJson('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://artefekt.pl',
          'X-Title': 'Artefekt asystentka'
        },
        body: JSON.stringify({ model, messages, max_tokens: 260, temperature: 0.55 })
      });
      return (data?.choices?.[0]?.message?.content || '').trim();
    }
  },
  {
    name: 'deepseek',
    envKeys: ['DEEPSEEK_API_KEY'],
    models: ['deepseek-chat'],
    async call(apiKey, model, messages) {
      const data = await fetchJson('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, max_tokens: 260, temperature: 0.55 })
      });
      return (data?.choices?.[0]?.message?.content || '').trim();
    }
  }
];

async function generateReply({ message, history = [] }) {
  const cleanMessage = typeof message === 'string' ? message.trim().slice(0, 800) : '';
  if (!cleanMessage) {
    const error = new Error('Message is required');
    error.code = 'INVALID_MESSAGE';
    throw error;
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...normalizeHistory(history),
    { role: 'user', content: cleanMessage }
  ];

  let lastError;
  let triedAny = false;

  for (const provider of PROVIDERS) {
    const apiKey = provider.envKeys.map((k) => process.env[k]).find(Boolean);
    if (!apiKey) continue;

    for (const model of provider.models) {
      triedAny = true;
      try {
        const reply = await provider.call(apiKey, model, messages);
        if (reply) return reply;
        const error = new Error(`Empty response from ${provider.name}/${model}`);
        error.code = 'EMPTY_RESPONSE';
        lastError = error;
      } catch (err) {
        lastError = err;
        if (err.status === 429 && typeof err.body === 'string' && err.body.includes('free-models-per-day')) {
          lastError.code = 'DAILY_LIMIT';
          break; // this provider's whole account is capped, no point trying its other models
        }
      }
    }
  }

  if (!triedAny) {
    const error = new Error('Chatbot API is not configured');
    error.code = 'CHATBOT_NOT_CONFIGURED';
    throw error;
  }

  throw lastError;
}

module.exports = { generateReply, SYSTEM_PROMPT };

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

const FALLBACK_MODELS = [
  'openai/gpt-oss-20b:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'google/gemma-4-31b-it:free'
];

function extractOutputText(data) {
  return (data?.choices?.[0]?.message?.content || '').trim();
}

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

async function generateReply({ message, history = [] }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    const error = new Error('Chatbot API is not configured');
    error.code = 'CHATBOT_NOT_CONFIGURED';
    throw error;
  }

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

  const models = [
    process.env.OPENROUTER_MODEL || 'google/gemma-4-26b-a4b-it:free',
    ...FALLBACK_MODELS
  ].filter((model, i, arr) => arr.indexOf(model) === i);

  let lastError;
  for (const model of models) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://artefekt.pl',
          'X-Title': 'Artefekt asystentka'
        },
        body: JSON.stringify({ model, messages, max_tokens: 260, temperature: 0.55 }),
        signal: controller.signal
      });

      if (!response.ok) {
        const details = await response.text();
        if (response.status === 429 && details.includes('free-models-per-day')) {
          lastError = new Error('Daily free-tier request limit reached for this API key');
          lastError.code = 'DAILY_LIMIT';
          break;
        }
        lastError = new Error(`OpenRouter API error ${response.status}: ${details.slice(0, 300)}`);
        lastError.code = 'OPENAI_ERROR';
        if (response.status === 429) continue;
        throw lastError;
      }

      const data = await response.json();
      const reply = extractOutputText(data);
      if (reply) return reply;
      lastError = new Error('Empty model response');
      lastError.code = 'EMPTY_RESPONSE';
    } catch (err) {
      if (err.name === 'AbortError') {
        lastError = new Error(`Model ${model} timed out`);
        lastError.code = 'MODEL_TIMEOUT';
      } else {
        lastError = err;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
}

module.exports = { generateReply, SYSTEM_PROMPT };

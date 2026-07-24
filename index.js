document.getElementById('year').textContent = new Date().getFullYear()

const siteHeader = document.getElementById('siteHeader')
const setScrolled = () => siteHeader?.classList.toggle('scrolled', window.scrollY > 8)
setScrolled()
window.addEventListener('scroll', setScrolled, { passive: true })

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        revealObserver.unobserve(entry.target)
      }
    })
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' })
  document.querySelectorAll('[data-reveal], [data-stagger]').forEach(el => revealObserver.observe(el))
} else {
  document.querySelectorAll('[data-reveal], [data-stagger]').forEach(el => el.classList.add('is-visible'))
}

document.querySelectorAll('[data-stagger] > *').forEach((el, i) => {
  el.style.transitionDelay = Math.min(i * 60, 360) + 'ms'
})

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

document.querySelectorAll('.stat[data-count]').forEach(stat => {
  const target = parseInt(stat.dataset.countTo, 10) || 0
  const valueEl = stat.querySelector('.stat-num-value')
  if (!valueEl) return
  if (reducedMotion) {
    valueEl.textContent = target.toLocaleString('pl-PL')
    return
  }
  let done = false
  const run = () => {
    if (done) return
    done = true
    const duration = 1400
    const start = performance.now()
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      valueEl.textContent = Math.round(target * eased).toLocaleString('pl-PL')
      if (t < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) { run(); obs.unobserve(entry.target) } })
    }, { threshold: 0.4 })
    obs.observe(stat)
  } else {
    run()
  }
})

const testimonialTrack = document.getElementById('testimonialTrack')
if (testimonialTrack) {
  const cards = Array.from(testimonialTrack.children)
  cards.forEach(card => {
    const clone = card.cloneNode(true)
    clone.setAttribute('aria-hidden', 'true')
    testimonialTrack.appendChild(clone)
  })
}

const serviceRows = document.querySelectorAll('.service-row')
if (serviceRows.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const serviceObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => entry.target.classList.toggle('is-active', entry.isIntersecting))
  }, { rootMargin: '-48% 0px -48% 0px', threshold: 0 })
  serviceRows.forEach(row => serviceObserver.observe(row))
}

const lightbox = document.getElementById('lightbox')
const lightboxImg = document.getElementById('lightboxImg')
const lightboxCaption = document.getElementById('lightboxCaption')
const lightboxClose = document.getElementById('lightboxClose')
const lightboxPrev = document.getElementById('lightboxPrev')
const lightboxNext = document.getElementById('lightboxNext')
let lastFocused = null
let currentImages = []
let currentIndex = 0
let currentCaptionBase = ''

function renderLightboxImage() {
  const src = currentImages[currentIndex]
  lightboxImg.style.opacity = '0'
  const img = new Image()
  img.onload = () => {
    lightboxImg.src = src
    lightboxImg.style.opacity = '1'
  }
  img.src = src
  lightboxCaption.textContent = currentImages.length > 1
    ? `${currentCaptionBase} — ${currentIndex + 1}/${currentImages.length}`
    : currentCaptionBase
  const hasMultiple = currentImages.length > 1
  lightboxPrev.hidden = !hasMultiple
  lightboxNext.hidden = !hasMultiple
}
function stepLightbox(dir) {
  if (currentImages.length < 2) return
  currentIndex = (currentIndex + dir + currentImages.length) % currentImages.length
  renderLightboxImage()
}
function openLightbox(btn) {
  lastFocused = document.activeElement
  currentImages = (btn.dataset.images || btn.dataset.full || '').split(',').map(s => s.trim()).filter(Boolean)
  currentIndex = 0
  currentCaptionBase = btn.dataset.caption || ''
  lightboxImg.alt = currentCaptionBase
  renderLightboxImage()
  lightbox.hidden = false
  requestAnimationFrame(() => lightbox.classList.add('is-open'))
  lightboxClose.focus()
  document.body.style.overflow = 'hidden'
}
function closeLightbox() {
  lightbox.classList.remove('is-open')
  document.body.style.overflow = ''
  setTimeout(() => { lightbox.hidden = true }, 220)
  lastFocused?.focus()
}
document.querySelectorAll('[data-lightbox]').forEach(btn => {
  btn.addEventListener('click', () => openLightbox(btn))
})

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('[data-cover-images]').forEach((item, i) => {
    const covers = item.dataset.coverImages.split(',').map(s => s.trim()).filter(Boolean)
    if (covers.length < 2) return
    const media = item.querySelector('.gallery-media')
    const base = media.querySelector('img')
    const layer = document.createElement('img')
    layer.className = 'gallery-layer'
    layer.alt = ''
    layer.setAttribute('role', 'presentation')
    layer.decoding = 'async'
    media.appendChild(layer)
    covers.forEach(src => { new Image().src = src })
    let index = 0
    let layerOnTop = false
    setInterval(() => {
      index = (index + 1) % covers.length
      const src = covers[index]
      const pre = new Image()
      pre.onload = () => {
        if (layerOnTop) {
          base.removeAttribute('srcset')
          base.src = src
          layer.style.opacity = '0'
        } else {
          layer.src = src
          layer.style.opacity = '1'
        }
        layerOnTop = !layerOnTop
      }
      pre.src = src
    }, 5400 + i * 420)
  })
}
lightboxClose?.addEventListener('click', closeLightbox)
lightboxPrev?.addEventListener('click', () => stepLightbox(-1))
lightboxNext?.addEventListener('click', () => stepLightbox(1))
lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox() })
document.addEventListener('keydown', (e) => {
  if (!lightbox || lightbox.hidden) return
  if (e.key === 'Escape') closeLightbox()
  if (e.key === 'ArrowRight') stepLightbox(1)
  if (e.key === 'ArrowLeft') stepLightbox(-1)
})

let wheelLocked = false
lightbox?.addEventListener('wheel', (e) => {
  if (lightbox.hidden) return
  e.preventDefault()
  if (wheelLocked || Math.abs(e.deltaY) < 12) return
  wheelLocked = true
  stepLightbox(e.deltaY > 0 ? 1 : -1)
  setTimeout(() => { wheelLocked = false }, 420)
}, { passive: false })

let touchStartY = null
lightbox?.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY
}, { passive: true })
lightbox?.addEventListener('touchmove', (e) => {
  if (touchStartY === null) return
  const dy = e.touches[0].clientY - touchStartY
  if (Math.abs(dy) > 44) {
    stepLightbox(dy < 0 ? 1 : -1)
    touchStartY = e.touches[0].clientY
  }
}, { passive: true })
lightbox?.addEventListener('touchend', () => { touchStartY = null })

const navToggle = document.getElementById('navToggle')
const navMobile = document.getElementById('navMobile')
navToggle?.addEventListener('click', () => {
  const open = navMobile.classList.toggle('open')
  navToggle.setAttribute('aria-expanded', String(open))
})
navMobile?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  navMobile.classList.remove('open')
  navToggle.setAttribute('aria-expanded', 'false')
}))

const chatForm = document.getElementById('chatForm')
const chatInput = document.getElementById('chatInput')
const chatMessages = document.getElementById('chatMessages')
const history = []

function appendMessage(role, text) {
  const el = document.createElement('div')
  el.className = 'chat-msg chat-msg--' + role
  el.textContent = text
  chatMessages.appendChild(el)
  chatMessages.scrollTop = chatMessages.scrollHeight
  return el
}

function appendTyping() {
  const el = document.createElement('div')
  el.className = 'chat-msg chat-msg--pending'
  el.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span>'
  chatMessages.appendChild(el)
  chatMessages.scrollTop = chatMessages.scrollHeight
  return el
}

chatForm?.addEventListener('submit', async (e) => {
  e.preventDefault()
  const text = chatInput.value.trim()
  if (!text) return
  appendMessage('user', text)
  history.push({ role: 'user', content: text })
  chatInput.value = ''
  chatInput.disabled = true
  const pending = appendTyping()

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history })
    })
    const data = await res.json()
    pending.remove()
    if (data.reply) {
      appendMessage('assistant', data.reply)
      history.push({ role: 'assistant', content: data.reply })
    } else {
      appendMessage('error', 'Asystentka AI będzie dostępna wkrótce — napisz do nas na studio@artefekt.pl.')
    }
  } catch (err) {
    pending.remove()
    appendMessage('error', 'Asystentka AI będzie dostępna wkrótce — napisz do nas na studio@artefekt.pl.')
  } finally {
    chatInput.disabled = false
    chatInput.focus()
  }
})

const contactForm = document.getElementById('contactForm')
contactForm?.addEventListener('submit', (e) => {
  e.preventDefault()
  const data = new FormData(contactForm)
  const name = (data.get('name') || '').toString().trim()
  const email = (data.get('email') || '').toString().trim()
  const phone = (data.get('phone') || '').toString().trim()
  const room = (data.get('room') || '').toString().trim()
  const message = (data.get('message') || '').toString().trim()
  const subject = `Zapytanie ze strony — ${room}`
  const bodyLines = [
    `Imię i nazwisko: ${name}`,
    `E-mail: ${email}`,
    phone ? `Telefon: ${phone}` : null,
    `Rodzaj wnętrza: ${room}`,
    '',
    message
  ].filter(Boolean)
  const mailto = `mailto:studio@artefekt.pl?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`
  window.location.href = mailto
})

const calGrid = document.getElementById('calGrid')
const calMonthLabel = document.getElementById('calMonthLabel')
const cfMessage = document.getElementById('cfMessage')
if (calGrid && calMonthLabel) {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const monthNames = ['styczeń','luty','marzec','kwiecień','maj','czerwiec','lipiec','sierpień','wrzesień','październik','listopad','grudzień']
  calMonthLabel.textContent = `${monthNames[month]} ${year}`
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = (firstDay.getDay() + 6) % 7

  for (let i = 0; i < startOffset; i++) {
    const empty = document.createElement('span')
    empty.className = 'cal-day-empty'
    calGrid.appendChild(empty)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'cal-day'
    btn.textContent = String(day)
    const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const isWeekend = new Date(year, month, day).getDay() % 6 === 0
    if (isPast || isWeekend) btn.disabled = true
    btn.addEventListener('click', () => {
      calGrid.querySelectorAll('.cal-day.is-selected').forEach(el => el.classList.remove('is-selected'))
      btn.classList.add('is-selected')
      if (cfMessage) {
        const dateLabel = `${day} ${monthNames[month]}`
        const prefix = 'Chciałbym/chciałabym umówić wizytę w showroomie w dniu ' + dateLabel + '. '
        if (!cfMessage.value.startsWith('Chciałbym/chciałabym umówić wizytę')) {
          cfMessage.value = prefix + cfMessage.value
        } else {
          cfMessage.value = cfMessage.value.replace(/Chciałbym\/chciałabym umówić wizytę w showroomie w dniu [^.]+\.\s*/, prefix)
        }
        cfMessage.focus()
      }
    })
    calGrid.appendChild(btn)
  }
}

document.querySelectorAll('.chip[data-prompt]').forEach(chip => {
  chip.addEventListener('click', () => {
    chatInput.value = chip.dataset.prompt
    chatForm.requestSubmit()
  })
})

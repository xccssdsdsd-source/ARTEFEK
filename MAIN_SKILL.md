# CLAUDE.md — Frontend Rules

## Response Style
No explanations unless asked. Code only. Action → what's next.

## Session Start
Invoke `frontend-design` skill before any frontend code.
Invoke `gsap-lenis` skill when adding animations or scroll effects.
Invoke `premium-ui-components` skill when building landing pages in Next.js.
Commit to ONE aesthetic direction before first line. Execute without compromise.

## Project Type
Set at project level: `HTML` | `NEXTJS`
- HTML: single `index.html`, Tailwind CDN, all styles inline, mobile-first
- NEXTJS: component files, Tailwind via config, CSS vars in `globals.css`

## Code Rules
- No comments, no `console.log`, no dead code, no unused classes
- No wrapper divs unless structurally needed
- Tailwind: no duplicate classes, no empty `class=""`
- JS: arrow functions, no `var`, no semicolons, single quotes

## Design Direction
Pick an extreme and commit: editorial, brutalist, luxury, organic, cinematic, retro-futuristic.
Ask: what is the ONE thing someone remembers? Build around that answer.

## Typography
- Google Fonts only. Never Inter, Roboto, Arial, system fonts.
- Pair: display/serif (headings) + humanist sans or mono (body)
- Headings: `letter-spacing:-0.03em` `line-height:1.1` `font-weight:700+`
- Body: `line-height:1.75` max `68ch`
- Key headings: `clamp()` fluid sizing
- Scale ratio: 1.25 or 1.333 — no arbitrary sizes

## Color System
CSS custom properties in `:root` using HSL. Required tokens:
`--bg` `--surface` `--primary` `--accent` `--text` `--muted`
Dominant color + one sharp accent. No default Tailwind blue/indigo.

## Depth
- Backgrounds: layered gradient or noise — never flat
- Shadows: color-tinted, minimum 2 levels, low opacity
- Cards: `1px solid hsl(var(--text)/0.08)` + inner highlight
- Images: `from-black/60` gradient overlay + optional `mix-blend-multiply`

## Spatial
- Asymmetry over centered-everything
- Hero: one element breaks the grid (oversized type, offset image, diagonal)
- Vary section rhythm: full-bleed alternates with contained
- Negative space: generous OR dense — never average

## Motion
- Prefer GSAP over CSS transitions for anything beyond simple hover states
- Only `transform` and `opacity` — never `transition-all`
- Load: GSAP stagger 0 / 0.12 / 0.24s with `expo.out`
- Scroll: GSAP ScrollTrigger `start: 'top 85%'` → y:40 opacity:0 → y:0 opacity:1
- Hover: `translateY(-2px)` + shadow deepen, 180ms
- Wrap all in `@media (prefers-reduced-motion: no-preference)`

## Components
- Buttons: `0.65em 1.5em` padding, hover lifts + shadow deepens
- Inputs: CSS var borders, accent focus ring, no browser defaults
- Cards: hover state required (lift / glow / border reveal)
- Nav sticky: `backdrop-filter:blur` on scroll

## Reference Images
Match exactly — layout, spacing, colors, typography. No improvements.
Screenshot → compare → fix. Min 2 rounds until no visible diff.

## Server & Screenshots
Serve: `node serve.mjs` port 3000. Never `file:///`.
Screenshot: `node screenshot.mjs http://localhost:3000` → `./temporary screenshots/screenshot-N.png`

## Brand Assets
Check `brand_assets/` first. Real assets override all placeholders.

## Hard Rules
- No content not in reference
- Never `transition-all`
- Never: purple gradients on white, Space Grotesk as default, cookie-cutter layouts

---

## Libraries & Stack

### Core — install on EVERY project

**HTML (CDN, paste in `<head>` before `</body>`):**
```html
<!-- GSAP + ScrollTrigger -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js"></script>
<!-- Lenis smooth scroll -->
<script src="https://cdn.jsdelivr.net/npm/lenis@latest/dist/lenis.min.js"></script>
```

**Next.js (npm):**
```bash
npm i gsap @studio-freight/lenis motion
npx shadcn@latest init
```

### Standard GSAP Setup (always use this boilerplate)

**HTML:**
```js
gsap.registerPlugin(ScrollTrigger)

const lenis = new Lenis()
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time) => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0)

// Reveal all [data-reveal] elements on scroll
gsap.utils.toArray('[data-reveal]').forEach(el => {
  gsap.from(el, {
    y: 40, opacity: 0, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 85%' }
  })
})

// Hero load stagger
gsap.from('[data-hero] > *', {
  y: 32, opacity: 0, duration: 1.1, ease: 'expo.out',
  stagger: 0.12, delay: 0.15
})
```

**Next.js (`app/layout.tsx` or per-page `useEffect`):**
```ts
import { useGSAP } from '@gsap/react'
import Lenis from '@studio-freight/lenis'
import ScrollTrigger from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger, useGSAP)

useGSAP(() => {
  const lenis = new Lenis()
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
})
```

### Theatre.js — visual motion design editor

Use when animations need precise timing, cinematic keyframes, or client handoff.
Best for: hero sequences, page transitions, 3D choreography.

```bash
npm i @theatre/core
npm i @theatre/studio --save-dev
npm i @theatre/r3f         # only if using React Three Fiber
```

```ts
import studio from '@theatre/studio'
import { getProject } from '@theatre/core'

if (process.env.NODE_ENV === 'development') studio.initialize()

const project = getProject('My Site')
const sheet = project.sheet('Hero')
const obj = sheet.object('HeroText', { y: 0, opacity: 1 })
```

Docs: https://www.theatrejs.com/docs

### Component Libraries — Next.js landing pages

Use after `npx shadcn@latest init`. Layer on top:

| Library | Install | Best for |
|---|---|---|
| Aceternity UI | copy-paste from site | Hero sections, spotlight, 3D cards, beams |
| Magic UI | copy-paste from site | Animated text, bento grids, shimmer buttons |
| Motion Primitives | copy-paste from site | Text reveals, magnetic buttons, stagger lists |

- Aceternity UI → https://ui.aceternity.com (Framer Motion + Tailwind)
- Magic UI → https://magicui.design (50+ components)
- Motion Primitives → https://motion-primitives.com

Rule: pick ONE library per project. Don't mix Aceternity + Magic on same page.

### 3D & WebGL — only when brief asks for 3D/immersive

```bash
npm i three @react-three/fiber @react-three/drei @react-three/postprocessing
```

- React Three Fiber → https://github.com/pmndrs/react-three-fiber
- Drei (helpers, loaders, controls) → https://github.com/pmndrs/drei
- Postprocessing (bloom, DOF, chromatic aberration) → @react-three/postprocessing
- Invoke `webgl-three` skill before writing any R3F code

### CSS Effects Library (HTML only, no npm)

- UIVerse → https://uiverse.io (3500+ copy-paste CSS + Tailwind components)
  Use for: buttons, loaders, cards, inputs, checkboxes

### Reference Repositories

| Repo | Why it matters |
|---|---|
| `darkroomengineering/satus` | Gold standard Next.js starter: GSAP, Lenis, R3F, Theatre.js, Sanity baked in |
| `pmndrs/react-three-next` | Minimal Next.js + R3F starter |
| `zhengdechang/awesome-gsap` | GSAP pattern library across vanilla/React/Vue |
| `AxiomeCG/awesome-threejs` | Curated Three.js resource list |

**Satus (premium agency starter):**
```bash
bunx create-next-app --example https://github.com/darkroomengineering/satus my-project
```

---

## Awwwards Checklist — before shipping any page

- [ ] Lenis smooth scroll initialized and synced with ScrollTrigger
- [ ] GSAP ScrollTrigger on ALL reveal elements (`[data-reveal]`)
- [ ] Hero: staggered load animation on entry
- [ ] Nav: `backdrop-blur` + `bg-opacity` on scroll
- [ ] Every card/button has hover state (lift + shadow or glow)
- [ ] Fonts preloaded: `<link rel="preload" as="font">`
- [ ] Images: `loading="lazy"` + `decoding="async"`
- [ ] `prefers-reduced-motion` wraps all JS animations
- [ ] No horizontal overflow on mobile
- [ ] Background has depth (noise, gradient mesh, or layered gradients)

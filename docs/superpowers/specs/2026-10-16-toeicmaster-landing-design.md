# TOEIC Master landing page

Date: 2026-10-16 · Status: approved in chat · Owner: Dat Truong (Ryan)

## Intent

A product page for TOEIC Master, read mainly by recruiters as a portfolio showcase. It presents the app as a
real product and links into the live app's guest mode. Not a marketing push: the page stays out of search
engines (noindex), like the app itself.

Success: looks like the product's own site, every claim matches the code or the live API, "Try it" lands in the
working guest mode, the page reads well on desktop and phone, and the tests below pass.

## Decisions

| Topic | Decision |
|---|---|
| Address | `toeicmaster.truongquocdat.id.vn`; the app stays at `toeic.truongquocdat.id.vn` |
| Audience | Recruiters first (showcase), written as a product page |
| Look | Direction B: the app's dark mode (slate `#0f172a`, cards `#1e293b`, royal blue `#3b82f6`/`#2563eb`), Plus Jakarta Sans + JetBrains Mono, the app's own logo |
| Language | Vietnamese, the product's language |
| Primary action | "Dùng thử ở chế độ khách" → `https://toeic.truongquocdat.id.vn/` (guest mode stores nothing) |
| Indexing | `noindex` meta and an `X-Robots-Tag` header at the edge |

## Page

1. Header: logo, anchors (Tính năng, Cách học, Kỹ thuật), "Dùng thử".
2. Hero: badge, "Biết vì sao mình sai. Rồi sửa đúng lúc.", one-line summary, two buttons, a real dashboard
   recording in a browser frame with a soft blue glow that follows the cursor.
3. Numbers (verified 2026-10-15 from the live public API and the repo): 241 practice questions, 698 SM-2
   flashcards, 12 grammar lessons, 27 AI mentor tools. Count up when scrolled into view.
4. Learning loop: practice → tag the cause of each mistake (5 causes) → review after 1, 3, 7 days → weekly
   plan adapts → score prediction. Steps light up in turn.
5. Features, alternating text and a recording of that page in guest mode: mistake log, mock tests scored on
   10–990, vocabulary (SM-2 + text-to-speech), listening (word-by-word dictation diff, shadowing scored by
   Gemini), AI mentor (27 function-calling tools, logged and undoable), 24-week roadmap. Installable as a PWA.
6. Behind the product: Next.js 16 → FastAPI + SQLAlchemy → SQLite; Gemini with key rotation, falling back to
   DeepSeek; Docker Compose; CI with pytest, type checks, lint and build; PBKDF2-SHA256 (100k), HS256 tokens,
   rate limits; 131 test functions. Links: GitHub `toeic-lab`, portfolio case study.
7. Next up (honest): Parts 3, 4, 6, 7 not in the bank yet; Telegram reminders coded but off; pronunciation
   trainer in progress.
8. Closing call to action and footer (built by Dat Truong, link to the portfolio).

Not claimed: full-length mock exams, authentic ETS material, OpenAI or Telegram as live features.

## Build

A static site: `index.html`, `styles.css`, `main.js`, GSAP + ScrollTrigger copied into `vendor/`, fonts from
Google Fonts with system fallbacks, media in `media/` (recorded with Playwright in guest mode, H.264, posters).
Motion: entrance stagger, cursor glow, count-up, loop highlight, videos play only while visible; all of it is
off under `prefers-reduced-motion`, where videos show a play button instead of autoplaying. Content is visible
without JavaScript.

## Deploy

Same pattern as the MyNotch page: files rsynced to `~/apps/toeicmaster-site` on the VPS, served by an
`nginx:alpine` container bound to `127.0.0.1:18200`, a proxied `toeicmaster` A record on Cloudflare, an edge
nginx server block with Let's Encrypt (shared certbot) and `X-Robots-Tag: noindex, nofollow, noarchive`.

## Tests

Playwright (Chromium and WebKit), run against a local static server and against the live site:
no console errors; no horizontal overflow at 1440, 768 and 375 px; every "Dùng thử" link points at the app;
the GitHub and portfolio links are correct; every video and poster loads; the numbers on the page match the
spec; reduced motion keeps videos paused and shows content; the live site sends the noindex header.

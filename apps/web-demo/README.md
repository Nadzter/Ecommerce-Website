# @amwali/web-demo

Clickable web prototype of Amwali. **Not** a real product:

- No real money moves.
- No real backend — all state lives in the browser tab.
- UAE flow only.
- Built for screen-share demos with investors, partners, designers.

The keyboard showcase only *looks* like the iOS Amwali keyboard; the real
thing only works inside iOS apps. This web demo is the closest you can get to
the experience without a Mac, Xcode, and a real iPhone.

## Run locally

From the repo root:

```bash
pnpm install
pnpm --filter @amwali/web-demo dev
# open http://localhost:3001
```

Or from this directory:

```bash
pnpm dev
```

## Build

```bash
pnpm --filter @amwali/web-demo build
pnpm --filter @amwali/web-demo start
```

## Demo walkthrough

1. **Welcome** — landing copy + "Get started".
2. **Email + OTP** — use email `sara@example.ae` and code `482913`.
3. **KYC** — auto-approves after a 4-step animation.
4. **Bank linking** — pick any UAE bank; redirect screen approves and links.
5. **Home** — balance card, favorites, recent activity.
6. **Try it (chat)** — opens a fake WhatsApp conversation.
7. **Keyboard** — pick a recipient, punch in an amount, hit Send.
8. **Face ID** — animated scan + check.
9. **Sending** — three-step animation, then confetti success.
10. **Back to chat** — the "✅ Sent X AED via Amwali" message types into the chat
    and the recipient replies. The transfer is recorded in History.

Use **Reset demo** in the top-right of the landing page to start over.

## Deploy to Vercel

The app is set up to deploy from the repo root using the workspace install. In
Vercel:

1. **New Project** → import `Nadzter/Ecommerce-Website`.
2. **Root directory:** leave as `/` (workspace root).
3. **Framework preset:** Next.js (auto-detected).
4. **Build command:** *(leave default — `vercel.json` overrides it)*
5. **Install command:** *(leave default)*
6. **Output directory:** `apps/web-demo/.next`
7. Deploy.

`vercel.json` pins the build to `pnpm --filter @amwali/web-demo run build` so
the rest of the monorepo (backend, iOS) stays out of the Vercel build path.

## File map

```
apps/web-demo/
├── app/
│   ├── layout.tsx          # Inter + Cormorant Garamond
│   ├── page.tsx            # Landing page that hosts the phone frame
│   └── globals.css
├── components/
│   ├── DemoStage.tsx       # Wraps the phone in a screen switcher
│   ├── PhoneFrame.tsx      # iPhone-style bezel + screen container
│   ├── ui/                 # Button, Field, Card, StatusBar
│   └── screens/            # All the user-flow screens
├── lib/
│   ├── data.ts             # Mock UAE banks, contacts, transfers, OTP
│   └── demo-state.tsx      # React context state machine
├── tailwind.config.ts      # ink / accent / sand palette
└── vercel.json
```

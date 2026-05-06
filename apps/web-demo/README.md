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
2. On the configuration screen, click **Edit** next to "Root Directory" and
   set it to **`apps/web-demo`**.
3. Leave **Build & Development Settings** at their defaults (do NOT override
   the Output Directory — Vercel auto-detects `.next` relative to the root
   directory you set above; overriding it leads to doubled paths like
   `apps/web-demo/apps/web-demo/.next`).
4. Make sure **"Include files outside the Root Directory in the Build Step"**
   is **enabled** (it usually is by default). This lets the build see the
   workspace `pnpm-lock.yaml` and root `package.json`.
5. Framework preset auto-detects as **Next.js**.
6. Click **Deploy**.

Builds run via Vercel's standard pnpm-monorepo flow: install at the workspace
root, build inside `apps/web-demo`. `vercel.json` here only declares the
framework and otherwise stays out of the way.

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

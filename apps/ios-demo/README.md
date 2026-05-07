# Amwali iOS demo

Sideload-ready Xcode project for the Amwali Fast Pay keyboard. Same look as
the web demo, runs on a real iPhone, types real payment links into real
WhatsApp chats. The links open the deployed web demo's receive flow.

**Not a real product.** No money moves. No backend. Demo only.

## Requirements

- macOS 14 or later
- Xcode 15.4+
- iPhone running iOS 17 or later (a Mac+iPhone cable, or wireless pairing)
- An Apple ID — any Apple ID works; **the free tier is fine for sideloading
  on your own device** (apps expire after 7 days; just re-run from Xcode to
  reinstall)

## One-time setup on your Mac

```bash
# Install XcodeGen — this generates the .xcodeproj from project.yml
brew install xcodegen

# In this directory:
cd apps/ios-demo
xcodegen generate
```

That produces `Amwali.xcodeproj`. Open it in Xcode:

```bash
open Amwali.xcodeproj
```

## Sign and run on your iPhone

1. **In Xcode, set your team** (this is the only manual edit):
   - In the project navigator (left), click the `Amwali` project.
   - Select the `Amwali` target → **Signing & Capabilities** tab.
   - Tick **"Automatically manage signing"**.
   - **Team:** pick your Apple ID. (If it isn't there, **Xcode → Settings → Accounts → "+" → Apple ID** to add it.)
   - Repeat for the `AmwaliKeyboard` target — same team.
2. **Plug in your iPhone** via USB. If prompted on the phone, tap "Trust this
   computer" and enter your passcode.
3. In Xcode's run-target dropdown (top toolbar), pick your iPhone as the
   destination.
4. Hit the **▶ Run** button.
5. First install on the device usually fails with a signing-trust error.
   On the iPhone: **Settings → General → VPN & Device Management → "Apple
   Development: <your email>" → Trust**. Then in Xcode hit Run again.

The Amwali app installs on your phone.

## Add the keyboard

On your iPhone:

1. Open **Settings → General → Keyboard → Keyboards → Add New Keyboard…**
2. Scroll to "Third-Party Keyboards" → tap **Amwali**.
3. Done. Amwali Fast Pay is now in your keyboard rotation.
4. **You do NOT need to enable Allow Full Access for this demo.** The demo
   keyboard only types text into the host app — no network, no shared
   keychain.

## Use it in WhatsApp

1. Open WhatsApp → any chat with a friend.
2. Tap the message box → your default keyboard appears.
3. Tap the **🌐 globe** key (bottom-left) until **Amwali** is active.
4. Numeric keypad appears. Type an amount.
5. Tap **Send →**. The keyboard inserts a message:

   > 💸 You've been sent AED 100 via Amwali · Tap to receive: https://ecommerce-website-web-demo.vercel.app/?receive=1&amt=100&from=You

6. Tap WhatsApp's send arrow. Friend gets the message.
7. Friend taps the link → opens the web demo's **receive flow** in their
   browser. They claim → confetti → "received in your bank". End-to-end
   demo over.

## Important caveats

- **Free tier expires every 7 days.** After 7 days the app stops launching
  on your phone. Plug into your Mac, hit Run in Xcode, it reinstalls. To
  remove the limit: enroll in the **Apple Developer Program** ($99/year).
- The demo keyboard is **stateless** — it forgets what you typed when the
  host app loses focus. That's normal for demo keyboards.
- The web demo's receive page is the same one we built earlier — the link
  just preselects the receiver flow with the amount you typed.

## File map

```
apps/ios-demo/
├── project.yml                 # XcodeGen config (run xcodegen to build .xcodeproj)
├── Shared/
│   └── Theme.swift             # Colors + fonts shared by both targets
├── Amwali/                     # Main app target
│   ├── AmwaliApp.swift         # @main + scene config
│   ├── ContentView.swift       # Welcome + setup instructions screen
│   ├── Info.plist
│   └── Assets.xcassets/
└── AmwaliKeyboard/             # Keyboard extension target
    ├── KeyboardViewController.swift
    ├── KeypadView.swift        # SwiftUI keypad
    └── Info.plist
```

## Customising the message text

Edit `AmwaliKeyboard/KeyboardViewController.swift`:

```swift
private let receiveBaseUrl = "https://ecommerce-website-web-demo.vercel.app"
private let senderName = "You"
```

Change `senderName` to your name. Re-run from Xcode and the keyboard updates
on your phone.

# Amwali iOS

Three targets: the main app (`Amwali`), the keyboard extension
(`AmwaliKeyboard`), and a shared dynamic framework (`AmwaliKit`) embedded in
both. Bundle identifiers, App Group, and Keychain access group are pinned in
`Configs/Shared.xcconfig` and must match the entitlements files of each target.

## Requirements

- **macOS with Xcode 15.4+ (Swift 5.9+, iOS 17+ SDK).** This directory does not
  contain an `.xcodeproj` yet — generating one requires running Xcode locally.
  Source files and config are checked in here so that whoever opens the project
  on a Mac can assemble them into the three targets without re-deriving the
  layout.
- **Apple Developer team membership.** The keyboard extension needs Full Access
  (network + shared App Group + shared Keychain), which requires real signing.
  Simulator alone is fine for development.

## How to assemble the project on a Mac (one-time)

1. In Xcode, **File → New → Project → iOS App**, name it `Amwali`, choose
   SwiftUI. Save into this `/ios` directory.
2. **File → New → Target → Custom Keyboard Extension**, name it
   `AmwaliKeyboard`. Embed in the `Amwali` app.
3. **File → New → Target → Framework**, name it `AmwaliKit`. Embed in both the
   app and the keyboard extension.
4. Drag the contents of `Amwali/`, `AmwaliKeyboard/`, `AmwaliKit/`,
   `AmwaliKitTests/`, `AmwaliUITests/`, `Configs/`, and `Scripts/` into their
   matching targets (uncheck "copy items if needed").
5. Set each target's xcconfig to `Configs/Shared.xcconfig` (Project → Info →
   Configurations).
6. In **Signing & Capabilities** for each target, add: App Groups
   (`group.com.amwali.shared`) and Keychain Sharing (`com.amwali.shared`).
7. For `AmwaliKeyboard`, in its `Info.plist` ensure `NSExtension` and
   `RequestsOpenAccess: YES` exist (the file is already prepared at
   `AmwaliKeyboard/Info.plist`).

## Identifiers

| Concept | Value |
|---|---|
| Main app bundle ID | `com.amwali.app` |
| Keyboard bundle ID | `com.amwali.app.keyboard` |
| AmwaliKit bundle ID | `com.amwali.shared` |
| App Group | `group.com.amwali.shared` |
| Keychain access group | `$(AppIdentifierPrefix)com.amwali.shared` |
| Universal Link domain (Phase 2) | `app.amwali.com` |

## Full Access — how the keyboard handles it

iOS keyboards default to no network, no shared App Group, no shared Keychain.
The user must enable Full Access manually:
**Settings → General → Keyboard → Keyboards → Amwali → Allow Full Access**.

`KeyboardViewController.swift` shows the no-Full-Access state when
`hasFullAccess == false` and delegates to `AmwaliKit.SessionStore` only after
it's true. Never log host-app text — Apple reviews financial keyboards
strictly.

## Memory

Keyboards get killed at ~48 MB resident. Keep `AmwaliKit` lean. If it grows,
split a `AmwaliKitCore` (used by the keyboard) from `AmwaliKitFull` (app-only).

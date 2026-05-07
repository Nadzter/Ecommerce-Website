import SwiftUI

/// Mirrors the web demo's design tokens (apps/web-demo/tailwind.config.ts).
/// Hex values match exactly so the iOS app and the deployed web demo feel
/// like the same product.
enum AmwaliColor {
    // Ink — deep navy primary
    static let ink = Color(red: 10 / 255, green: 37 / 255, blue: 64 / 255)         // #0A2540
    static let inkDark = Color(red: 6 / 255, green: 24 / 255, blue: 44 / 255)      // #06182C
    static let inkSoft = Color(red: 31 / 255, green: 54 / 255, blue: 90 / 255)     // #1F365A
    static let ink50 = Color(red: 244 / 255, green: 247 / 255, blue: 251 / 255)    // #F4F7FB
    static let ink100 = Color(red: 225 / 255, green: 233 / 255, blue: 242 / 255)   // #E1E9F2
    static let ink200 = Color(red: 194 / 255, green: 210 / 255, blue: 228 / 255)   // #C2D2E4
    static let ink300 = Color(red: 156 / 255, green: 179 / 255, blue: 205 / 255)   // #9CB3CD
    static let ink400 = Color(red: 109 / 255, green: 135 / 255, blue: 166 / 255)   // #6D87A6
    static let ink500 = Color(red: 65 / 255, green: 89 / 255, blue: 124 / 255)     // #41597C

    // Accent — mint green
    static let accent = Color(red: 0 / 255, green: 194 / 255, blue: 168 / 255)     // #00C2A8
    static let accentLight = Color(red: 84 / 255, green: 217 / 255, blue: 188 / 255) // #54D9BC
    static let accentDeep = Color(red: 0 / 255, green: 143 / 255, blue: 121 / 255) // #008F79
    static let accent100 = Color(red: 198 / 255, green: 242 / 255, blue: 232 / 255) // #C6F2E8
    static let accent700 = Color(red: 0 / 255, green: 106 / 255, blue: 90 / 255)   // #006A5A

    // Sand — warm background
    static let sand = Color(red: 248 / 255, green: 246 / 255, blue: 241 / 255)     // #F8F6F1
    static let sand200 = Color(red: 239 / 255, green: 233 / 255, blue: 220 / 255)  // #EFE9DC

    // Keyboard surface (dark)
    static let inkKeyboard = Color(red: 10 / 255, green: 16 / 255, blue: 20 / 255) // #0A1014
    static let inkKey = Color.white.opacity(0.06)
    static let inkKeyHover = Color.white.opacity(0.12)
}

/// Typography. The web demo pairs Inter (UI) with Cormorant Garamond (display).
/// We approximate with system fonts so the project builds with no embedded
/// font assets. To match the web 1:1, drop Inter-*.ttf and CormorantGaramond-*.ttf
/// into Shared/Fonts/, register them in Info.plist (UIAppFonts), and replace
/// the helpers below.
extension Font {
    static func amwaliDisplay(_ size: CGFloat, weight: Font.Weight = .semibold) -> Font {
        .system(size: size, weight: weight, design: .serif)
    }

    static func amwaliBody(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight, design: .default)
    }

    static func amwaliMono(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight, design: .monospaced)
    }
}

/// Reusable view modifiers that match the web demo's primary button.
struct AmwaliPrimaryButtonStyle: ButtonStyle {
    var enabled: Bool = true

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.amwaliBody(15, weight: .semibold))
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(
                Group {
                    if enabled {
                        AmwaliColor.ink
                    } else {
                        AmwaliColor.ink300
                    }
                }
            )
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .opacity(configuration.isPressed ? 0.85 : 1.0)
    }
}

struct AmwaliMintButtonStyle: ButtonStyle {
    var enabled: Bool = true

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.amwaliBody(15, weight: .semibold))
            .foregroundStyle(AmwaliColor.ink)
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(enabled ? AmwaliColor.accent : AmwaliColor.accent.opacity(0.4))
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .opacity(configuration.isPressed ? 0.85 : 1.0)
    }
}

/// Logo glyph used in the web demo. Reused here so the iOS app icon and
/// onboarding hero look identical to the web demo's mark.
struct AmwaliLogo: View {
    var size: CGFloat = 64
    var foreground: Color = .white
    var background: Color? = nil

    var body: some View {
        ZStack {
            if let background {
                RoundedRectangle(cornerRadius: size * 0.25, style: .continuous)
                    .fill(background)
            }
            // Big "A" mark — same path the web demo uses.
            GeometryReader { proxy in
                let s = min(proxy.size.width, proxy.size.height)
                let inset = s * 0.20
                Path { path in
                    path.move(to: CGPoint(x: s / 2, y: inset))
                    path.addLine(to: CGPoint(x: inset, y: s - inset))
                    path.addLine(to: CGPoint(x: inset + (s - 2 * inset) * 0.18, y: s - inset))
                    path.addLine(to: CGPoint(x: s / 2, y: s * 0.5))
                    path.addLine(to: CGPoint(x: s - inset - (s - 2 * inset) * 0.18, y: s - inset))
                    path.addLine(to: CGPoint(x: s - inset, y: s - inset))
                    path.closeSubpath()
                }
                .fill(
                    LinearGradient(
                        colors: [AmwaliColor.accentLight, AmwaliColor.accent],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
            }
        }
        .frame(width: size, height: size)
    }
}

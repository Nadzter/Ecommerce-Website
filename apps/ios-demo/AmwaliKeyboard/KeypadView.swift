import SwiftUI

struct KeypadView: View {
    let onSend: (Int) -> Void
    let onSwitch: () -> Void

    @State private var amountStr: String = ""

    private var amountInt: Int {
        Int(amountStr.split(separator: ".").first.map(String.init) ?? "0") ?? 0
    }

    private var ready: Bool { amountInt >= 1 }

    var body: some View {
        VStack(spacing: 0) {
            header
            amountDisplay
            Spacer(minLength: 6)
            actionsRow
            keypadGrid
            footer
        }
        .background(AmwaliColor.inkKeyboard)
    }

    private var header: some View {
        HStack(spacing: 6) {
            Text("Amwali Fast Pay")
                .font(.amwaliBody(11, weight: .semibold))
                .tracking(1.4)
                .textCase(.uppercase)
                .foregroundStyle(AmwaliColor.accent)
            Spacer()
            Text("UAE")
                .font(.amwaliBody(10, weight: .semibold))
                .tracking(1.2)
                .textCase(.uppercase)
                .foregroundStyle(.white.opacity(0.4))
        }
        .padding(.horizontal, 14)
        .padding(.top, 8)
        .padding(.bottom, 4)
    }

    private var amountDisplay: some View {
        VStack(spacing: 2) {
            Text("You're sending")
                .font(.amwaliBody(10, weight: .medium))
                .tracking(1.2)
                .textCase(.uppercase)
                .foregroundStyle(.white.opacity(0.4))
            HStack(alignment: .lastTextBaseline, spacing: 8) {
                Text(amountStr.isEmpty ? "0" : amountStr)
                    .font(.amwaliDisplay(46, weight: .semibold))
                    .foregroundStyle(amountStr.isEmpty ? Color.white.opacity(0.3) : .white)
                Text("AED")
                    .font(.amwaliBody(16, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.5))
            }
        }
        .padding(.top, 4)
    }

    private var actionsRow: some View {
        HStack {
            Text("🌐 globe to switch back")
                .font(.amwaliBody(10))
                .foregroundStyle(.white.opacity(0.3))
            Spacer()
            Button {
                guard ready else { return }
                onSend(amountInt)
                amountStr = ""
            } label: {
                HStack(spacing: 6) {
                    Text("Send")
                    Text("→")
                }
                .font(.amwaliBody(13, weight: .semibold))
                .foregroundStyle(.white)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(
                    Group {
                        if ready {
                            LinearGradient(
                                colors: [AmwaliColor.accentLight, AmwaliColor.accentDeep],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        } else {
                            Color.white.opacity(0.05)
                        }
                    }
                )
                .clipShape(Capsule())
                .shadow(
                    color: ready ? AmwaliColor.accent.opacity(0.4) : .clear,
                    radius: 8, x: 0, y: 2
                )
            }
            .disabled(!ready)
        }
        .padding(.horizontal, 12)
        .padding(.bottom, 6)
    }

    private var keypadGrid: some View {
        let keys: [String] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"]
        return LazyVGrid(
            columns: Array(repeating: GridItem(.flexible(), spacing: 6), count: 3),
            spacing: 6
        ) {
            ForEach(keys, id: \.self) { key in
                Button {
                    if key == "globe" {
                        onSwitch()
                    } else {
                        press(key)
                    }
                } label: {
                    Text(key)
                        .font(.amwaliBody(20, weight: .medium))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity, minHeight: 42)
                        .background(AmwaliColor.inkKey)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .buttonStyle(KeyPressStyle())
            }
        }
        .padding(.horizontal, 8)
    }

    private var footer: some View {
        HStack(spacing: 6) {
            Button {
                onSwitch()
            } label: {
                HStack(spacing: 4) {
                    Image(systemName: "globe")
                    Text("Switch keyboard")
                }
                .font(.amwaliBody(11, weight: .medium))
                .foregroundStyle(.white.opacity(0.55))
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(Color.white.opacity(0.04))
                .clipShape(Capsule())
            }
            Spacer()
            Text(ready ? "AED \(amountInt)" : "enter an amount")
                .font(.amwaliBody(11))
                .foregroundStyle(.white.opacity(0.3))
        }
        .padding(.horizontal, 12)
        .padding(.top, 6)
        .padding(.bottom, 8)
    }

    private func press(_ key: String) {
        switch key {
        case "⌫":
            if !amountStr.isEmpty {
                amountStr.removeLast()
            }
        case ".":
            if !amountStr.contains(".") {
                amountStr += amountStr.isEmpty ? "0." : "."
            }
        default:
            // Cap to a reasonable demo length.
            guard amountStr.count < 9 else { return }
            // Don't allow more than 2 decimals.
            if let dotIdx = amountStr.firstIndex(of: ".") {
                let decimals = amountStr.distance(from: dotIdx, to: amountStr.endIndex) - 1
                if decimals >= 2 { return }
            }
            // Don't allow leading zero unless it's "0."
            if amountStr == "0" {
                amountStr = key
            } else {
                amountStr += key
            }
        }
    }
}

private struct KeyPressStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.96 : 1.0)
            .opacity(configuration.isPressed ? 0.85 : 1.0)
    }
}

#Preview {
    KeypadView(onSend: { _ in }, onSwitch: {})
        .frame(height: 320)
        .background(AmwaliColor.inkKeyboard)
}

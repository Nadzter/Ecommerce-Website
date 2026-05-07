import SwiftUI

struct ContentView: View {
    var body: some View {
        ZStack {
            // Background — subtle gradient like the web demo's hero
            LinearGradient(
                colors: [AmwaliColor.inkDark, AmwaliColor.ink],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            // Decorative orbs
            GeometryReader { proxy in
                Circle()
                    .fill(AmwaliColor.accent.opacity(0.18))
                    .blur(radius: 80)
                    .frame(width: proxy.size.width * 0.7, height: proxy.size.width * 0.7)
                    .offset(x: -proxy.size.width * 0.25, y: -proxy.size.height * 0.05)
                Circle()
                    .fill(AmwaliColor.accentLight.opacity(0.12))
                    .blur(radius: 70)
                    .frame(width: proxy.size.width * 0.6, height: proxy.size.width * 0.6)
                    .offset(x: proxy.size.width * 0.5, y: proxy.size.height * 0.4)
            }
            .ignoresSafeArea()

            ScrollView {
                VStack(spacing: 0) {
                    Spacer().frame(height: 32)

                    AmwaliLogo(size: 72, background: Color.white.opacity(0.08))
                        .overlay(
                            RoundedRectangle(cornerRadius: 18, style: .continuous)
                                .stroke(Color.white.opacity(0.18), lineWidth: 1)
                        )

                    Text("Amwali")
                        .font(.amwaliDisplay(34, weight: .semibold))
                        .foregroundStyle(.white)
                        .padding(.top, 14)

                    Text("Send money from any chat.")
                        .font(.amwaliBody(15))
                        .foregroundStyle(.white.opacity(0.7))
                        .padding(.top, 4)

                    // Steps card
                    VStack(alignment: .leading, spacing: 0) {
                        StepRow(
                            number: 1,
                            title: "Add the keyboard",
                            body: "Settings → General → Keyboard → Keyboards → Add New Keyboard → Amwali."
                        )
                        Divider().background(Color.white.opacity(0.08))
                        StepRow(
                            number: 2,
                            title: "Open WhatsApp",
                            body: "Tap the message box of any chat. Tap 🌐 globe to switch to Amwali."
                        )
                        Divider().background(Color.white.opacity(0.08))
                        StepRow(
                            number: 3,
                            title: "Type an amount",
                            body: "Hit Send → a tap-to-receive link drops into the chat."
                        )
                    }
                    .background(Color.white.opacity(0.06))
                    .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 20, style: .continuous)
                            .stroke(Color.white.opacity(0.1), lineWidth: 1)
                    )
                    .padding(.top, 36)
                    .padding(.horizontal, 20)

                    // Open Settings shortcut
                    VStack(spacing: 10) {
                        Button {
                            openKeyboardSettings()
                        } label: {
                            HStack(spacing: 8) {
                                Image(systemName: "keyboard")
                                Text("Open keyboard settings")
                            }
                        }
                        .buttonStyle(AmwaliMintButtonStyle())

                        Text("Demo preview · No real money moves.")
                            .font(.amwaliBody(11))
                            .foregroundStyle(.white.opacity(0.4))
                    }
                    .padding(.top, 28)
                    .padding(.horizontal, 20)

                    Spacer().frame(height: 30)
                }
            }
        }
    }

    private func openKeyboardSettings() {
        if let url = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(url)
        }
    }
}

private struct StepRow: View {
    let number: Int
    let title: String
    let body: String

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            Text("\(number)")
                .font(.amwaliBody(15, weight: .bold))
                .foregroundStyle(AmwaliColor.ink)
                .frame(width: 28, height: 28)
                .background(AmwaliColor.accent)
                .clipShape(Circle())
                .padding(.top, 2)
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.amwaliBody(15, weight: .semibold))
                    .foregroundStyle(.white)
                Text(body)
                    .font(.amwaliBody(13))
                    .foregroundStyle(.white.opacity(0.7))
                    .lineSpacing(2)
            }
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 16)
    }
}

#Preview {
    ContentView()
}

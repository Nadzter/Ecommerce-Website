import SwiftUI

struct NoFullAccessView: View {
    var body: some View {
        VStack(spacing: 12) {
            Text("Allow Full Access")
                .font(.headline)
            Text("To send transfers from the keyboard, enable Full Access in Settings → General → Keyboard → Keyboards → Amwali.")
                .multilineTextAlignment(.center)
                .font(.footnote)
                .foregroundStyle(.secondary)
                .padding(.horizontal)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct SignInPromptView: View {
    var body: some View {
        VStack(spacing: 12) {
            Text("Open Amwali to sign in")
                .font(.headline)
            Text("Sign in to the Amwali app once and the keyboard will be ready.")
                .multilineTextAlignment(.center)
                .font(.footnote)
                .foregroundStyle(.secondary)
                .padding(.horizontal)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct KeypadPlaceholderView: View {
    let insertText: (String) -> Void

    var body: some View {
        VStack(spacing: 8) {
            Text("Amwali keypad — Phase 1 placeholder")
                .font(.footnote)
                .foregroundStyle(.secondary)
            Button("Insert demo confirmation") {
                insertText("✅ Sent 100 AED via Amwali")
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

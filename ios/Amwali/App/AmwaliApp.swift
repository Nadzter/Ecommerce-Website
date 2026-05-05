import SwiftUI
import AmwaliKit

@main
struct AmwaliApp: App {
    var body: some Scene {
        WindowGroup {
            AppRoot()
        }
    }
}

struct AppRoot: View {
    var body: some View {
        VStack(spacing: 16) {
            Text("Amwali")
                .font(.largeTitle)
                .fontWeight(.semibold)
            Text("Phase 1 scaffold — onboarding flow not yet implemented.")
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
                .padding(.horizontal)
        }
        .padding()
    }
}

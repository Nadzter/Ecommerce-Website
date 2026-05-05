import UIKit
import SwiftUI
import AmwaliKit

/// Top-level controller for the Amwali keyboard extension.
///
/// Three states:
/// 1. **No Full Access** — show `NoFullAccessView` with instructions. We
///    cannot reach the network or shared keychain in this state.
/// 2. **Full Access but no session** — user hasn't signed into the main app
///    yet; show the "Open Amwali to sign in" view.
/// 3. **Authenticated** — render the keypad.
///
/// This controller never reads or transmits text the user has typed in the
/// host app. Apple reviews financial keyboards strictly on this point.
public final class KeyboardViewController: UIInputViewController {
    private var hostingController: UIHostingController<AnyView>?

    public override func viewDidLoad() {
        super.viewDidLoad()
        installRoot()
    }

    public override func textDidChange(_ textInput: UITextInput?) {
        // Intentionally empty. We do not observe the host app's text content.
    }

    private func installRoot() {
        let root: AnyView
        if !hasFullAccess {
            root = AnyView(NoFullAccessView())
        } else if SharedDefaults.shared.string(.currentUserId) == nil {
            root = AnyView(SignInPromptView())
        } else {
            root = AnyView(KeypadPlaceholderView(insertText: { [weak self] text in
                self?.textDocumentProxy.insertText(text)
            }))
        }
        let hosting = UIHostingController(rootView: root)
        addChild(hosting)
        view.addSubview(hosting.view)
        hosting.view.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            hosting.view.topAnchor.constraint(equalTo: view.topAnchor),
            hosting.view.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            hosting.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            hosting.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        ])
        hosting.didMove(toParent: self)
        hostingController = hosting
    }
}

import SwiftUI
import UIKit

/// Hosts the SwiftUI keypad inside the keyboard extension. The keyboard does
/// not need Full Access — the only host-app interaction is inserting text via
/// `textDocumentProxy`.
///
/// Apple review note (when/if this becomes a real product): the keyboard does
/// not observe the host app's text content. We never read what the user has
/// typed in the chat. We never log keystrokes. We only WRITE into the host
/// app via `insertText`, and only when the user explicitly taps Send.
final class KeyboardViewController: UIInputViewController {
    private let receiveBaseUrl = "https://ecommerce-website-web-demo.vercel.app"
    private let senderName = "You"

    private var hostingController: UIHostingController<KeypadView>?
    private var heightConstraint: NSLayoutConstraint?

    override func viewDidLoad() {
        super.viewDidLoad()

        let host = UIHostingController(
            rootView: KeypadView(
                onSend: { [weak self] amount in
                    self?.send(amount: amount)
                },
                onSwitch: { [weak self] in
                    self?.advanceToNextInputMode()
                }
            )
        )
        host.view.backgroundColor = UIColor(AmwaliColor.inkKeyboard)
        host.view.translatesAutoresizingMaskIntoConstraints = false

        addChild(host)
        view.addSubview(host.view)
        host.didMove(toParent: self)
        hostingController = host

        NSLayoutConstraint.activate([
            host.view.topAnchor.constraint(equalTo: view.topAnchor),
            host.view.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            host.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            host.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        ])

        // Lock the keyboard's height so SwiftUI gets a sane layout box.
        let h = view.heightAnchor.constraint(equalToConstant: 320)
        h.priority = UILayoutPriority(999)
        h.isActive = true
        heightConstraint = h
    }

    /// Intentionally empty. We do not observe the host app's text content.
    override func textDidChange(_ textInput: UITextInput?) {}

    private func send(amount: Int) {
        let url = "\(receiveBaseUrl)/?receive=1&amt=\(amount)&from=\(senderName.urlEscaped)"
        let text = "💸 You've been sent AED \(amount) via Amwali · Tap to receive: \(url)"
        textDocumentProxy.insertText(text)
    }
}

private extension String {
    var urlEscaped: String {
        addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? self
    }
}

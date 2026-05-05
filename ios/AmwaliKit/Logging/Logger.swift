import Foundation
import OSLog

/// Wrapper around `os.Logger` that defaults all interpolated values to
/// `.private`, so payment data, account numbers, tokens, etc. cannot leak into
/// the unified logging system. Use the explicit `.public(...)` helper only for
/// values you have verified contain no sensitive data (e.g. enum cases).
public struct AmwaliLogger {
    private let logger: Logger

    public init(category: String) {
        let subsystem = Bundle.main.bundleIdentifier ?? "com.amwali"
        self.logger = Logger(subsystem: subsystem, category: category)
    }

    public func debug(_ message: @autoclosure () -> String) {
        logger.debug("\(message(), privacy: .private)")
    }

    public func info(_ message: @autoclosure () -> String) {
        logger.info("\(message(), privacy: .private)")
    }

    public func warning(_ message: @autoclosure () -> String) {
        logger.warning("\(message(), privacy: .private)")
    }

    public func error(_ message: @autoclosure () -> String) {
        logger.error("\(message(), privacy: .private)")
    }

    /// Use only for values that are demonstrably not sensitive (e.g.
    /// `TransferState` enum names, HTTP status codes, hostnames).
    public func event(_ name: StaticString) {
        logger.info("\(name, privacy: .public)")
    }
}

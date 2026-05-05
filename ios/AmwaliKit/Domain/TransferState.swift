import Foundation

public enum TransferState: String, Codable, Sendable, CaseIterable {
    case pending
    case authorized
    case submitted
    case completed
    case failed
    case reversed

    public var isTerminal: Bool {
        switch self {
        case .completed, .failed, .reversed: return true
        case .pending, .authorized, .submitted: return false
        }
    }
}

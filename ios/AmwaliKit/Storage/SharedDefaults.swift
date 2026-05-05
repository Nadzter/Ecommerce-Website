import Foundation

/// Wrapper around the App Group `UserDefaults` shared by the main app and the
/// keyboard extension. Use this for non-sensitive flags only — secrets go in
/// the shared Keychain via `KeychainStore`.
public final class SharedDefaults {
    public static let shared = SharedDefaults()

    private let defaults: UserDefaults

    private init() {
        guard let suite = UserDefaults(suiteName: AmwaliConstants.appGroupId) else {
            preconditionFailure("App Group \(AmwaliConstants.appGroupId) is not configured.")
        }
        self.defaults = suite
    }

    public enum Key: String {
        case currentUserId = "amwali.currentUserId"
        case currentUserEmail = "amwali.currentUserEmail"
        case biometricEnabled = "amwali.biometricEnabled"
        case defaultBankLinkId = "amwali.defaultBankLinkId"
        case favoriteContactsCacheUpdatedAt = "amwali.favoriteContactsCacheUpdatedAt"
    }

    public func string(_ key: Key) -> String? { defaults.string(forKey: key.rawValue) }
    public func set(_ value: String?, for key: Key) { defaults.set(value, forKey: key.rawValue) }

    public func bool(_ key: Key) -> Bool { defaults.bool(forKey: key.rawValue) }
    public func set(_ value: Bool, for key: Key) { defaults.set(value, forKey: key.rawValue) }

    public func date(_ key: Key) -> Date? { defaults.object(forKey: key.rawValue) as? Date }
    public func set(_ value: Date?, for key: Key) { defaults.set(value, forKey: key.rawValue) }
}

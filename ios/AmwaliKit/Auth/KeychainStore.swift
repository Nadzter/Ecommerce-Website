import Foundation
import Security

/// Shared-keychain access used by both the main app and the keyboard extension.
/// All entries use `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly` so secrets
/// never leave the device and are unreadable until the user unlocks once after
/// boot.
public final class KeychainStore {
    public static let shared = KeychainStore()

    public enum Item: String {
        case accessToken = "amwali.accessToken"
        case refreshToken = "amwali.refreshToken"
    }

    public enum Failure: Error {
        case osStatus(OSStatus)
    }

    private let accessGroup: String = AmwaliConstants.keychainAccessGroup

    private init() {}

    public func set(_ value: String, for item: Item) throws {
        let data = Data(value.utf8)
        let baseQuery = self.baseQuery(for: item)
        SecItemDelete(baseQuery as CFDictionary)
        var attributes = baseQuery
        attributes[kSecValueData as String] = data
        attributes[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        let status = SecItemAdd(attributes as CFDictionary, nil)
        guard status == errSecSuccess else { throw Failure.osStatus(status) }
    }

    public func get(_ item: Item) throws -> String? {
        var query = baseQuery(for: item)
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        if status == errSecItemNotFound { return nil }
        guard status == errSecSuccess else { throw Failure.osStatus(status) }
        guard let data = result as? Data, let s = String(data: data, encoding: .utf8) else {
            return nil
        }
        return s
    }

    public func delete(_ item: Item) throws {
        let status = SecItemDelete(baseQuery(for: item) as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw Failure.osStatus(status)
        }
    }

    private func baseQuery(for item: Item) -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: "amwali",
            kSecAttrAccount as String: item.rawValue,
            kSecAttrAccessGroup as String: accessGroup,
        ]
    }
}

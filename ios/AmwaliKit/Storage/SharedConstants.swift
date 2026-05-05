import Foundation

public enum AmwaliConstants {
    public static let appGroupId = "group.com.amwali.shared"
    public static let keychainAccessGroup = "com.amwali.shared"

    public static var apiBaseURL: URL {
        if let raw = Bundle.main.object(forInfoDictionaryKey: "AMWALI_API_BASE_URL") as? String,
           let url = URL(string: raw) {
            return url
        }
        return URL(string: "http://localhost:3000")!
    }
}

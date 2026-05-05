import Foundation

/// Money is always stored in minor units (fils for AED, pesewas for GHS) and
/// is never represented as `Double` to avoid precision loss.
public struct Money: Equatable, Hashable, Codable, Sendable {
    public let amountMinor: Int64
    public let currency: String

    public init(amountMinor: Int64, currency: String) {
        precondition(amountMinor >= 0, "Money amount must be non-negative.")
        self.amountMinor = amountMinor
        self.currency = currency
    }

    public var majorUnits: Decimal {
        Decimal(amountMinor) / Decimal(100)
    }

    public func formatted(locale: Locale = .current) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency
        formatter.locale = locale
        return formatter.string(from: NSDecimalNumber(decimal: majorUnits)) ?? "\(majorUnits) \(currency)"
    }
}

public enum SupportedCurrency: String, CaseIterable, Sendable {
    case aed = "AED"
    case ghs = "GHS"
}

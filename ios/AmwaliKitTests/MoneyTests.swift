import XCTest
@testable import AmwaliKit

final class MoneyTests: XCTestCase {
    func testMajorUnitsConversion() {
        let money = Money(amountMinor: 12_345, currency: "AED")
        XCTAssertEqual(money.majorUnits, Decimal(123.45))
    }

    func testFormattedIncludesCurrency() {
        let money = Money(amountMinor: 50_000, currency: "AED")
        let formatted = money.formatted(locale: Locale(identifier: "en_AE"))
        XCTAssertTrue(formatted.contains("500"), "Expected formatted string to include 500, got \(formatted)")
    }

    func testTransferStateTerminalSet() {
        XCTAssertTrue(TransferState.completed.isTerminal)
        XCTAssertTrue(TransferState.failed.isTerminal)
        XCTAssertTrue(TransferState.reversed.isTerminal)
        XCTAssertFalse(TransferState.pending.isTerminal)
        XCTAssertFalse(TransferState.authorized.isTerminal)
        XCTAssertFalse(TransferState.submitted.isTerminal)
    }
}

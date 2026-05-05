import XCTest

final class AmwaliLaunchTests: XCTestCase {
    func testAppLaunches() throws {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.staticTexts["Amwali"].waitForExistence(timeout: 5))
    }
}

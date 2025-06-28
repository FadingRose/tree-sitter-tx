import XCTest
import SwiftTreeSitter
import TreeSitterTx

final class TreeSitterTxTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_tx())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Tx grammar")
    }
}

package tree_sitter_tx_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_tx "github.com/fadingrose/tree-sitter-tx/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_tx.Language())
	if language == nil {
		t.Errorf("Error loading Tx grammar")
	}
}

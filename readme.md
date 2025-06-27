# Better Tx Trace

## Getting Started

Note: Fetching function source code requires an internet connection to query the **Etherscan/Sourcify API**. You may need to configure an API key for reliable performance.

## 1 Motivation

In smart contract attack analysis, we often need to trace existing transactions. One solution is to use a web-based UI solution, such as [Phalcon Explorer](https://blocksec.com/explorer).

If we want to directly inspect transaction traces in an editor, we can use the [cast](https://getfoundry.sh/cast/reference/cast-run/) suite to get plain text. However, directly manipulating the trace results is very difficult. We will use `.tx` as the file extension for plain text files.

> see example: [tx trace](./0x1f15a193db3f44713d56c4be6679b194f78c2bcdd2ced5b0c7495b7406f5e87a.tx)

In short, we aim to bring more advanced features for `.tx` files in editors (e.g., Neovim or VSCode), specifically:

1. Tree-sitter based syntax highlighting;
2. LSP based function call level folding;
3. LSP based definition and reference jumps (see [Definition and Reference](3a-definition-and-reference));
4. LSP based hover (see [Hover](#hover));
5. LSP based rename (see [Tagging by rename](#tagging));

## 2 Tree-sitter

### 2.a Highlight

#### Neovim Configuration

### 2.b Changing and Applying New Grammar

**You can skip this section if you do not wish to modify the parsing grammar and only want to use Tree-Sitter based syntax highlighting.**

`grammar.js` defines the parser's grammar rules. If modifications are needed, ensure that `tree-sitter` is an executable command (see [tree-sitter](https://tree-sitter.github.io/tree-sitter/)).

After each modification to `grammar.js`, you should execute the following commands to regenerate and test the parser:

```bash
rm -rf ./src/
tree-sitter generate
tree-sitter parse ./0x1f15a193db3f44713d56c4be6679b194f78c2bcdd2ced5b0c7495b7406f5e87a.tx
````

## 3 LSP

### 3.a Definition and Reference

#### Definition

Should jump to the first occurrence of the identifier.

#### Reference

Should expand all reference locations of the identifier.

### 3.b Rename

#### Tagging

A typical requirement is to tag an address as Attacker, Victim, Exploiter, etc. This requirement can be achieved through LSP's rename function.

We predefine some reserved keywords. For example, if you try to rename an address `0xCbEe4617ABF667830fe3ee7DC8d6f46380829DF9` to Attacker,

then LSP will rename it to `0xCbEe__Attacker__9DF9`;

In fact, any rename starting with a keyword will be fully parsed into a tag and the address will be abbreviated.

For example, if we use `Attacker 1` during rename, the LSP rename result will be `0xCbEe__Attacker_1__9DF9`.

#### Renaming

In a few cases, two addresses might have the same tag name. For now, manual modification is required to ensure independence. For any syntax that does not belong to Tagging, it will be treated as a normal rename.

### 3.c Hover

#### Function

Hovering over a Function Declaration should attempt to fetch the source code and be able to extract the corresponding contract code block.

#### Address

Hovering over a complete Address should attempt to provide its tag;
whereas hovering over any incomplete Address (e.g., a Tag) should attempt to provide its complete Address.

#### Emit

For an Emit event, Hover should provide its corresponding event name and parameters.

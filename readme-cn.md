# Better Tx Trace

## Getting Started

<!-- TODO: Installation -->

## 1 Motivation

在智能合约攻击分析中，我们往往需要追踪现有的 transaction，一个解决方案是采用基于 Web 的 UI 方案，例如 [
Phalcon Explorer](https://blocksec.com/explorer)

如果我们期望在 editor 中直接检查 transaction trace，我们可以使用 [cast](https://getfoundry.sh/cast/reference/cast-run/) 套件来获取纯文本，然而，直接操作该 trace 结果非常困难，我们将使用 `.tx` 作为纯文本文件的拓展名。

> see example: [tx trace](./0x1f15a193db3f44713d56c4be6679b194f78c2bcdd2ced5b0c7495b7406f5e87a.tx)

总之，我们期望在 editor（例如 neovim 或 vscode）中能够为 .tx 带来更多高级特性，具体而言：

1. 基于 tree-sitter 的语法高亮；
2. 基于 LSP 的函数调用级别折叠；
3. 基于 LSP 的 definition 和 reference 跳转 (see [Definition and Reference](3a-definition-and-reference))；
4. 基于 LSP 的 hover (see [Hover](#hover))；
5. 基于 LSP 的 rename (see [Tagging by rename](#tagging))；

## 2 Tree-sitter

### 2.a Highlight

#### Neovim Configuration

<!-- TODO: Neovim 配置 -->

### 2.b Changing nad Applying New Grammar

**如果你不希望修改解析语法，而只期望使用基于 Tree-Sitter 的语法高亮，你可以跳过这部分。**

`grammar.js` 定义了 parser 的语法规则，如果需要修改，请确保 tree-sitter 是可执行的命令（see [tree-sitter](https://tree-sitter.github.io/tree-sitter/)）

在每次修改 grammar.js 后，你都应该执行以下命令来重新生成和测试 parser：

```bash
rm -rf ./src/
tree-sitter generate
tree-sitter parse ./0x1f15a193db3f44713d56c4be6679b194f78c2bcdd2ced5b0c7495b7406f5e87a.tx
```

## 3 LSP

### 3.a Definition and Reference

#### Definition

应当跳转到 identifier 第一次出现的位置。

#### Reference

应当展开 identifier 的所有引用位置。

### 3.b Rename

#### Tagging

一个典型的需求是将一个 address 标记为 Attacker、Victim、Exploiter 等等，这个需求可以通过 LSP 的 rename 功能来实现.

我们预定义了部分保留关键字，例如如果试图将一个 address `0xCbEe4617ABF667830fe3ee7DC8d6f46380829DF9` 重命名为 Attacker，

那么 LSP 会将它重命名为 `0xCbEe__Attacker__9DF9`；

事实上，任何以关键字作为开头的 rename，都会被完整解析到 tag 并且缩写地址。

例如我们在 rename 时使用 `Attacker 1`，那么 LSP 重命名结果会是 `0xCbEe__Attacker_1__9DF9`。

#### Renaming

在少数情况下，可能会出现两个 Address 的 Tag 名称相同，此时暂时需要手动修改以保证独立性，对于任何不属于 Tagging 的语法，均作为普通 rename 处理。

### 3.c Hover

#### Function

在一个 Function Declaration 上执行 Hover，应当尝试 fetch source code 并且能够提取对应合约代码块

#### Address

在一个完整 Address 上执行 Hover，应当尝试给出其 tag；
而在任何一个不完整的 Address（例如 Tag）上执行 Hover，应当尝试给出其完整的 Address。

#### Emit

对于一个 Emit 事件，Hover 应当给出其对应的事件名称和参数。

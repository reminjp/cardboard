# Cardboard

**This tool is still experimental.
Not ready to accept feature requests and pull requests.**

A command line tool to generate cards.
It reads a card design template (JSX) and tabular data (CSV or Google Sheets) and outputs documents for desktop publishing (PDF).

カードを生成するコマンドラインツール。
カードデザインのテンプレート（JSX）と表形式のデータ（CSVまたはGoogleスプレッドシート）を読み込んで印刷用の原稿（PDF）を出力します。

## Installation

Requirements:

- Node.js or Bun
- fontconfig (`fc-list` command)

Install:

```sh
bun install --global github:reminjp/cardboard#npm
```

Uninstall:

```sh
bun uninstall --global github:reminjp/cardboard#npm
```

## Usage

Create a project root directory.
Place `cardboard.toml` and other resources in there.
Run `build` command in the project root directory:

```sh
cardboard build
```

### Examples

- [Card game](./examples/card_game)

### Project structure

#### cardboard.toml

**`cardboard.toml`** is a Cardboard project file.
It defines build **targets**, which specify references to **tables** and **templates**:

```toml
[[targets]]
name = "card_front"
table = "card"
template = "card_front"

[[tables]]
name = "card"
path = "./card.csv"

[[templates]]
name = "card_front"
path = "./card_front.jsx"
width = "63mm"
height = "88mm"
```

#### Tables

Each row of a table represents parameters for a single card.
This tool accepts a CSV file or a reference to Google Sheets as an input source.

#### Templates

A template is an JSX file that designs one type of card.
It supports a limited subset of HTML and CSS features.

- Layout
  - Features supported by [Satori](https://github.com/vercel/satori) (e.g. margin, position, size, flex)
- Background color, text color
  - CMYK (`cmyk(0% 0% 0% 100%)`)
  - RGB (`#000000`)
- Image
  - PDF (`<img src="image.pdf" style={{ width: '10mm', height: '10mm' }}/>`)

This tool uses [Satori](https://github.com/vercel/satori) internally to convert HTML to intermediate SVG.
Its documentation may be helpful for troubleshooting.
For example, you can specify a locale via the `lang` attribute:

```html
<div lang="ja-JP">海角骨刃直入</div>
```

## Author

Remin

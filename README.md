# Cardboard

A command line tool to generate cards.

It reads a card design template (EJS) and tabular data (CSV or Google Sheets) and generates cards for printing (PDF).

## Usage

Install requirements.

- [Deno](https://deno.com/)
- fontconfig (`fc-list` command)

Install the tool using [`deno install`](https://deno.land/manual/tools/script_installer).
(Run `deno uninstall` command to uninstall.)

```sh
deno install --allow-env --allow-net --allow-read --allow-run --allow-write --name cardboard https://raw.githubusercontent.com/reminjp/cardboard/master/mod.ts
```

Create `cardboard.toml` and other resources (see below).

Navigate to the root directory of your project.

```sh
cd /path/to/package
```

Run the build command.

```sh
cardboard build
```

### Example projects

- [Card game](./examples/card_game)

### Project structure

#### cardboard.toml

A `cardboard.toml` is a Cardboard project file.
It specifies references to tables and templates.

#### Tables

Each row of a table represents parameters for a single card.
This tool accepts a CSV file or a reference to Google Sheets as an input source.

#### Templates

A template is an EJS file that designs one type of card.
It supports a limited subset of HTML and CSS features.

- Layout
  - Features supported by [Satori](https://github.com/vercel/satori) (e.g. margin, position, size, flex)
- Background color, text color
  - CMYK (`cmyk(0% 0% 0% 100%)`)
  - RGB (`#000000`)
- Image
  - PDF (`<img src="image.pdf" style="width: 10mm; height: 10mm"/>`)

This tool uses [Satori](https://github.com/vercel/satori) internally to convert HTML to intermediate SVG.
Its documentation may be helpful for troubleshooting.
For example, you can specify a locale via the `lang` attribute:

```html
<div lang="ja-JP">海角骨刃直入</div>
```

## Contribution

This tool is still experimental.
Not ready to accept feature requests and pull requests.

## Author

Remin

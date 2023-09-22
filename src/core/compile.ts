import * as base64 from 'std/encoding/base64.ts';
import * as path from 'std/path/mod.ts';

import ejs from 'ejs';
import { html as satoriHtml } from 'satori-html';
import satori from 'satori';
import type { Font } from 'satori';
// @deno-types='@types/svg-parser'
import { parse as parseSvg } from 'svg-parser';
import type { Node, RootNode } from 'svg-parser';
import { Length, replaceAllSupportedLengthToIpx } from './utils/length.ts';
import {
  PLACEHOLDER_SVG_PREFIX,
  PLACEHOLDER_SVG_SUFFIX,
  SVG_DATA_URI_PREFIX,
} from './constants.ts';
import { CardAstNode, CompileResult, Table, Template } from './types.ts';
import { Color } from './utils/color.ts';

interface CompileInput {
  bleed: Length;
  fonts: Font[];
  table: Table;
  template: Template;
}

export async function compile(input: CompileInput): Promise<CompileResult> {
  const result: CompileResult = {
    cardBleed: input.bleed,
    cardHeight: input.template.height,
    cards: [],
    cardWidth: input.template.width,
    fonts: input.fonts,
    imageAbsolutePaths: [],
  };

  const imageAbsolutePathToIndex = new Map<string, number>();

  for (const record of input.table) {
    const cardHtmlAst = satoriHtml(ejs.render(input.template.ejs, record));

    transformHtmlAstInPlace(
      {
        cardEjsDirectoryAbsolutePath: path.dirname(input.template.absolutePath),
        imageAbsolutePathToIndex,
        imageAbsolutePaths: result.imageAbsolutePaths,
      },
      cardHtmlAst,
    );

    const cardSvg = await satori(cardHtmlAst, {
      width: input.template.width.toUnit('ipx').number,
      height: input.template.height.toUnit('ipx').number,
      fonts: input.fonts,
    });

    const cardSvgAst = parseSvg(cardSvg);
    const cardAstNodes = compileSvgAst({}, cardSvgAst);

    if (cardAstNodes.length >= 1) {
      result.cards.push({
        ast: cardAstNodes.length === 1 ? cardAstNodes[0] : {
          type: 'group',
          children: cardAstNodes,
        },
      });
    }
  }

  return result;
}

interface TransformHtmlAstInPlaceContext {
  cardEjsDirectoryAbsolutePath: string;
  imageAbsolutePathToIndex: Map<string, number>;
  imageAbsolutePaths: string[];
}

function transformHtmlAstInPlace(
  context: TransformHtmlAstInPlaceContext,
  node: ReturnType<typeof satoriHtml>,
): void {
  // Convert length units not supported by Satori (e.g. `mm`) to `px`.
  for (const [key, value] of Object.entries(node.props)) {
    if (key === 'children' || key === 'style') continue;
    if (typeof value !== 'string') continue;
    node.props[key] = replaceAllSupportedLengthToIpx(value);
  }
  if (node.props.style) {
    for (const [key, value] of Object.entries(node.props.style)) {
      if (typeof value !== 'string') continue;
      node.props.style[key] = replaceAllSupportedLengthToIpx(value);
    }
  }

  // Convert image paths.
  if (
    node.type === 'img' &&
    typeof node.props.src === 'string' &&
    !node.props.src.startsWith('data:') &&
    !node.props.src.startsWith('http:') &&
    !node.props.src.startsWith('https:')
  ) {
    const imageAbsolutePath = path.isAbsolute(node.props.src)
      ? node.props.src
      : path.join(context.cardEjsDirectoryAbsolutePath, node.props.src);

    const imageCount = context.imageAbsolutePathToIndex.size;
    const imageIndex =
      context.imageAbsolutePathToIndex.get(imageAbsolutePath) ?? imageCount;

    const placeholderSvg =
      `${PLACEHOLDER_SVG_PREFIX}${imageIndex}${PLACEHOLDER_SVG_SUFFIX}`;
    node.props.src = `${SVG_DATA_URI_PREFIX}${base64.encode(placeholderSvg)}`;

    if (imageIndex === imageCount) {
      context.imageAbsolutePathToIndex.set(imageAbsolutePath, imageIndex);
      context.imageAbsolutePaths[imageIndex] = imageAbsolutePath;
    }
  }

  if (!node.props.children) return;
  if (typeof node.props.children === 'string') return;

  if (Array.isArray(node.props.children)) {
    for (const childNode of node.props.children) {
      if (childNode) transformHtmlAstInPlace(context, childNode);
    }
    return;
  }

  transformHtmlAstInPlace(context, node.props.children);
}

type CompileSvgAstContext = Record<string | number | symbol, never>;

function compileSvgAst(
  context: CompileSvgAstContext,
  node: Node | RootNode,
): CardAstNode[] {
  const children: CardAstNode[] = [];

  if ('children' in node) {
    const isMask = node.type === 'element' && node.tagName === 'mask';
    for (const childNode of isMask ? node.children.slice(1) : node.children) {
      if (typeof childNode === 'string') continue;
      children.push(...compileSvgAst(context, childNode));
    }
  }

  if (node.type !== 'element') return children;

  const x = new Length('ipx', Number(node.properties?.x));
  const y = new Length('ipx', Number(node.properties?.y));
  const width = new Length('ipx', Number(node.properties?.width));
  const height = new Length('ipx', Number(node.properties?.height));

  switch (node.tagName) {
    case 'image': {
      const href = String(node.properties?.href ?? '');

      if (!href.startsWith(SVG_DATA_URI_PREFIX)) return [];

      const placeholderSvg = new TextDecoder().decode(
        base64.decode(href.slice(SVG_DATA_URI_PREFIX.length)),
      );
      const imageIndex = Number(
        placeholderSvg.slice(
          PLACEHOLDER_SVG_PREFIX.length,
          -PLACEHOLDER_SVG_SUFFIX.length,
        ),
      );

      return [
        {
          type: 'image',
          x,
          y,
          width,
          height,
          imageIndex,
        },
      ];
    }

    case 'path': {
      const fill = String(node.properties?.fill ?? '');

      return [
        {
          type: 'svgPath',
          fillColor: fill ? Color.from(fill) : Color.TRANSPARENT,
          svgPath: String(node.properties?.d),
        },
      ];
    }

    case 'rect': {
      const fill = String(node.properties?.fill ?? '');

      return [
        {
          type: 'rect',
          x,
          y,
          width,
          height,
          fillColor: fill ? Color.from(fill) : Color.TRANSPARENT,
        },
      ];
    }
  }

  return children;
}
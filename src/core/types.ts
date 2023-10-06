import type { Font } from '../../deps.ts';
import { Color } from './utils/color.ts';
import { Length } from './utils/length.ts';

export type Table = Record<string, string | undefined>[];

export interface Template {
  absolutePath: string;
  ejs: string;
  width: Length;
  height: Length;
}

export interface CompileResult {
  cardBleed: Length;
  cardHeight: Length;
  cards: Card[];
  cardWidth: Length;
  fonts: Font[];
  imageAbsolutePaths: string[];
}

interface Card {
  ast: CardAstNode;
}

export type CardAstNode =
  | {
    type: 'group';
    children: CardAstNode[];
  }
  | {
    type: 'image';
    x: Length;
    y: Length;
    width: Length;
    height: Length;
    imageIndex: number;
  }
  | {
    type: 'rect';
    x: Length;
    y: Length;
    width: Length;
    height: Length;
    fillColor: Color;
  }
  | {
    type: 'svgPath';
    svgPath: string;
    fillColor: Color;
  };

import type { Font, default as satori } from 'satori';
import type { Color } from './utils/color.ts';
import type { Length } from './utils/length.ts';

type TableRecord = Record<string, string | undefined>;
export type Table = TableRecord[];

export type ReactNode = Parameters<typeof satori>[0];

export interface Template {
  absolutePath: string;
  width: Length;
  height: Length;
  renderHtmlAst: (record: TableRecord) => ReactNode;
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

import { PDFDocument, cmyk } from 'pdf-lib';
import type { CompileResult } from './types.js';
import { Length } from './utils/length.js';

const PRINT_AND_PLAY_TRIM_MARK_LENGTH_PT = new Length('mm', 1.5).toUnit(
  'pt',
).number;
const TRIM_MARK_WIDTH_PT = 0.3;

interface PostProcessInput {
  compileResult: CompileResult;
  isBack: boolean;
  isPrintAndPlay: boolean;
  pdfBytes: Uint8Array;
}

export async function postProcess(
  input: PostProcessInput,
): Promise<Uint8Array> {
  if (!input.isPrintAndPlay) return input.pdfBytes;

  const mediaWidthPt = new Length('mm', 210).toUnit('pt').number;
  const mediaHeightPt = new Length('mm', 297).toUnit('pt').number;

  const cardWidthPt = input.compileResult.cardWidth.toUnit('pt').number;
  const cardHeightPt = input.compileResult.cardHeight.toUnit('pt').number;

  const columnCount = Math.floor(mediaWidthPt / cardWidthPt);
  const rowCount = Math.floor(mediaHeightPt / cardHeightPt);

  const pdfDocument = await PDFDocument.create();

  const inputPdfDocument = await PDFDocument.load(input.pdfBytes);
  const inputPdfPages = inputPdfDocument.getPages();
  const pdfEmbeddedPages = await pdfDocument.embedPages(inputPdfPages);

  for (
    let pageIndex = 0;
    pageIndex < Math.ceil(pdfEmbeddedPages.length / (columnCount * rowCount));
    pageIndex++
  ) {
    const pdfPage = pdfDocument.addPage([mediaWidthPt, mediaHeightPt]);

    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
        const cardIndex =
          pageIndex * (columnCount * rowCount) +
          rowIndex * columnCount +
          columnIndex;

        if (!pdfEmbeddedPages[cardIndex]) break;

        pdfPage.drawPage(pdfEmbeddedPages[cardIndex], {
          x:
            (mediaWidthPt - columnCount * cardWidthPt) / 2 +
            (input.isBack ? columnCount - columnIndex - 1 : columnIndex) *
              cardWidthPt,
          y:
            (mediaHeightPt - rowCount * cardHeightPt) / 2 +
            (rowCount - rowIndex - 1) * cardHeightPt,
          width: cardWidthPt,
          height: cardHeightPt,
        });
      }
    }

    for (let rowIndex = 0; rowIndex < rowCount + 1; rowIndex++) {
      for (let columnIndex = 0; columnIndex < columnCount + 1; columnIndex++) {
        const x =
          (mediaWidthPt - columnCount * cardWidthPt) / 2 +
          columnIndex * cardWidthPt;
        const y =
          (mediaHeightPt - rowCount * cardHeightPt) / 2 +
          rowIndex * cardHeightPt;

        pdfPage.drawLine({
          color: cmyk(1, 1, 1, 1),
          end: { x, y: y + PRINT_AND_PLAY_TRIM_MARK_LENGTH_PT },
          start: { x, y: y - PRINT_AND_PLAY_TRIM_MARK_LENGTH_PT },
          thickness: TRIM_MARK_WIDTH_PT,
        });
        pdfPage.drawLine({
          color: cmyk(1, 1, 1, 1),
          end: { x: x + PRINT_AND_PLAY_TRIM_MARK_LENGTH_PT, y },
          start: { x: x - PRINT_AND_PLAY_TRIM_MARK_LENGTH_PT, y },
          thickness: TRIM_MARK_WIDTH_PT,
        });
      }
    }
  }

  return await pdfDocument.save();
}

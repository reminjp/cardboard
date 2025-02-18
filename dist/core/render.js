import fs from 'node:fs/promises';
import { PDFDocument, cmyk, rgb } from 'pdf-lib';
import { Length } from './utils/length.js';
const SVG_PATH_SCALE = new Length('ipx', 1).toUnit('pt').number;
export async function render(input) {
    const pdfDocument = await PDFDocument.create();
    for (const card of input.compileResult.cards) {
        const cardWidthPt = input.compileResult.cardWidth.toUnit('pt').number;
        const cardHeightPt = input.compileResult.cardHeight.toUnit('pt').number;
        const cardBleedPt = input.compileResult.cardBleed.toUnit('pt').number;
        const pdfPage = pdfDocument.addPage([
            cardWidthPt + 2 * cardBleedPt,
            cardHeightPt + 2 * cardBleedPt,
        ]);
        pdfPage.setTrimBox(cardBleedPt, cardBleedPt, cardWidthPt, cardHeightPt);
        await renderCardAstToPdfDocument({
            cardBleedPt,
            cardHeightPt,
            pdfDocument,
            pdfPage,
            sheet: input.compileResult,
        }, card.ast);
    }
    return await pdfDocument.save();
}
async function renderCardAstToPdfDocument(context, node) {
    switch (node.type) {
        case 'group': {
            for (const childNode of node.children) {
                await renderCardAstToPdfDocument(context, childNode);
            }
            break;
        }
        case 'image': {
            const x = node.x.toUnit('pt').number;
            const y = node.y.toUnit('pt').number;
            const width = node.width.toUnit('pt').number;
            const height = node.height.toUnit('pt').number;
            try {
                const imagePath = context.sheet.imageAbsolutePaths[node.imageIndex];
                if (!imagePath) {
                    throw new Error('Unexpectedly failed to render an image.');
                }
                const imageBytes = await fs.readFile(imagePath);
                const pdf = await PDFDocument.load(imageBytes);
                const pdfEmbeddedPage = await context.pdfDocument.embedPage(pdf.getPage(0));
                context.pdfPage.drawPage(pdfEmbeddedPage, {
                    x: context.cardBleedPt + x,
                    y: context.cardBleedPt + context.cardHeightPt - y - height,
                    width,
                    height,
                });
            }
            catch (error) {
                console.error(error);
                context.pdfPage.drawRectangle({
                    x: context.cardBleedPt + x,
                    y: context.cardBleedPt + context.cardHeightPt - y - height,
                    width,
                    height,
                    color: cmyk(0, 1, 0, 0),
                });
            }
            break;
        }
        case 'rect': {
            const x = node.x.toUnit('pt').number;
            const y = node.y.toUnit('pt').number;
            const width = node.width.toUnit('pt').number;
            const height = node.height.toUnit('pt').number;
            context.pdfPage.drawRectangle({
                x: context.cardBleedPt + x,
                y: context.cardBleedPt + context.cardHeightPt - y - height,
                width,
                height,
                color: convertColorToPdfLibColor(node.fillColor),
            });
            break;
        }
        case 'svgPath': {
            context.pdfPage.drawSvgPath(node.svgPath, {
                x: context.cardBleedPt,
                y: context.cardBleedPt + context.cardHeightPt,
                scale: SVG_PATH_SCALE,
                color: convertColorToPdfLibColor(node.fillColor),
            });
            break;
        }
    }
}
function convertColorToPdfLibColor(color) {
    switch (color.type) {
        case 'cmyk':
            return cmyk(color.c, color.m, color.y, color.k);
        case 'rgba':
            // TODO: alpha
            return rgb(color.r, color.g, color.b);
    }
}

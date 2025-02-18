import fs from 'node:fs/promises';
import path from 'node:path';

import { parse as parseCsv } from 'csv-parse/sync';
import { parse as parseToml } from 'smol-toml';
import { compile } from './core/compile.js';
import { postProcess } from './core/postProcess.js';
import { render } from './core/render.js';
import type { Table, Template } from './core/types.js';
import { readFontsForSatori } from './core/utils/font.js';
import { buildTemplateJsx } from './core/utils/jsx.js';
import { Length } from './core/utils/length.js';
import {
  convertGoogleSheetToObjectArray,
  getGoogleSheet,
  getGoogleSheetNameById,
  initializeGoogle,
} from './infrastructures/google.js';
import { projectSchema } from './schemas.js';

export async function runBuild(
  projectDirectoryPath: string | undefined,
  isPrintAndPlay: boolean,
) {
  /*
   * Read source files.
   */

  const projectDirectoryAbsolutePath = projectDirectoryPath
    ? path.resolve(projectDirectoryPath)
    : process.cwd();
  const projectFileAbsolutePath = path.join(
    projectDirectoryAbsolutePath,
    'cardboard.toml',
  );
  const resolvePathInProjectFile = (value: string) =>
    path.resolve(projectDirectoryAbsolutePath, value);

  const project = projectSchema.parse(
    parseToml(
      await fs.readFile(projectFileAbsolutePath, { encoding: 'utf-8' }),
    ),
  );

  // TODO: Skip unused tables and templates.
  const tableByName = new Map<string, Table>();
  for (const tableConfig of project.tables) {
    let table: Table | undefined;

    if (tableConfig.type === 'google_sheets') {
      await initializeGoogle();
      const sheetName = await getGoogleSheetNameById(
        tableConfig.spreadsheet_id,
        tableConfig.sheet_id,
      );
      const sheet = await getGoogleSheet(tableConfig.spreadsheet_id, sheetName);
      table = convertGoogleSheetToObjectArray(sheet);
    } else {
      const tableCsvAbsolutePath = resolvePathInProjectFile(tableConfig.path);
      const tableCsv = await fs.readFile(tableCsvAbsolutePath, {
        encoding: 'utf-8',
      });
      table = parseCsv(tableCsv, { columns: true });
    }

    if (tableConfig.include_record_if) {
      const f = new Function(
        'record',
        `return ${tableConfig.include_record_if};`,
      );
      table = table?.filter((record) => f.call({}, { ...record }));
    }

    if (!table) continue;

    tableByName.set(tableConfig.name, table);
  }

  const templateByName = new Map<string, Template>();
  for (const templateConfig of project.templates) {
    const templatejsxAbsolutePath = resolvePathInProjectFile(
      templateConfig.path,
    );

    templateByName.set(templateConfig.name, {
      absolutePath: templatejsxAbsolutePath,
      width: Length.from(templateConfig.width),
      height: Length.from(templateConfig.height),
      renderHtmlAst: await buildTemplateJsx(templatejsxAbsolutePath),
    });
  }

  const fonts = await readFontsForSatori(project.activated_fonts);

  for (const targetConfig of project.targets) {
    let table = tableByName.get(targetConfig.table);
    if (!table) {
      throw new Error(`Undefined table: ${targetConfig.table}`);
    }
    if (isPrintAndPlay && targetConfig.print_and_play?.repeat_record_for) {
      const f = new Function(
        'record',
        `return ${targetConfig.print_and_play.repeat_record_for};`,
      );
      table = table.flatMap((record) => {
        const repeatCount = Number(f.call({}, { ...record })) || 0;
        return Array.from({ length: repeatCount }).map(() => record);
      });
    }

    const template = templateByName.get(targetConfig.template);
    if (!template) {
      throw new Error(`Undefined template: ${targetConfig.template}`);
    }

    /*
     * Build PDF.
     */

    const compileResult = await compile({
      bleed: isPrintAndPlay ? Length.ZERO : Length.from(targetConfig.bleed),
      fonts,
      table,
      template,
    });

    let pdfBytes = await render({ compileResult });

    pdfBytes = await postProcess({
      isBack: targetConfig.print_and_play?.is_back ?? false,
      isPrintAndPlay,
      pdfBytes,
      compileResult,
    });

    /*
     * Write PDF.
     */

    const pdfFileName = `${targetConfig.name}${
      isPrintAndPlay ? '_pnp' : ''
    }.pdf`;

    await fs.mkdir(resolvePathInProjectFile('build'), { recursive: true });
    await fs.writeFile(
      resolvePathInProjectFile(`build/${pdfFileName}`),
      pdfBytes,
    );
  }
}

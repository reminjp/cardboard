import { compile } from './core/compile.ts';
import { render } from './core/render.ts';
import { Length } from './core/utils/length.ts';
import { projectSchema } from './schemas.ts';
import { Table, Template } from './core/types.ts';
import { postProcess } from './core/postProcess.ts';
import { readFontsForSatori } from './core/utils/font.ts';
import {
  convertGoogleSheetToObjectArray,
  getGoogleSheet,
  getGoogleSheetNameById,
  initializeGoogle,
} from './infrastructures/google.ts';
import { csv, path, toml } from '../deps.ts';

export async function runBuild(
  projectDirectoryPath: string | undefined,
  isPrintAndPlay: boolean,
) {
  /*
   * Read source files.
   */

  const projectDirectoryAbsolutePath = projectDirectoryPath
    ? path.resolve(projectDirectoryPath)
    : Deno.cwd();
  const projectFileAbsolutePath = path.join(
    projectDirectoryAbsolutePath,
    'cardboard.toml',
  );
  const resolvePathInProjectFile = (value: string) =>
    path.resolve(projectDirectoryAbsolutePath, value);

  const project = projectSchema.parse(
    toml.parse(await Deno.readTextFile(projectFileAbsolutePath)),
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
      const sheet = await getGoogleSheet(
        tableConfig.spreadsheet_id,
        sheetName,
      );
      table = convertGoogleSheetToObjectArray(sheet);
    } else {
      const tableCsvAbsolutePath = resolvePathInProjectFile(tableConfig.path);
      const tableCsv = await Deno.readTextFile(tableCsvAbsolutePath);
      table = csv.parse(tableCsv, { skipFirstRow: true });
    }

    if (tableConfig.include_record_if) {
      const f = new Function(
        'record',
        `return ${tableConfig.include_record_if};`,
      );
      table = table.filter((record) => f.call({}, { ...record }));
    }

    tableByName.set(tableConfig.name, table);
  }

  const templateByName = new Map<string, Template>();
  for (const templateConfig of project.templates) {
    const templatejsxAbsolutePath = resolvePathInProjectFile(
      templateConfig.path,
    );
    const component =
      (await import(path.toFileUrl(templatejsxAbsolutePath).toString()))
        .default;
    templateByName.set(templateConfig.name, {
      absolutePath: templatejsxAbsolutePath,
      component,
      width: Length.from(templateConfig.width),
      height: Length.from(templateConfig.height),
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

    await Deno.mkdir(resolvePathInProjectFile('build'), { recursive: true });
    await Deno.writeFile(
      resolvePathInProjectFile(`build/${pdfFileName}`),
      pdfBytes,
    );
  }
}

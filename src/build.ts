import fs from 'node:fs/promises';
import path from 'node:path';

import { compile } from './build-steps/compile.js';
import { postProcess } from './build-steps/postProcess.js';
import { render } from './build-steps/render.js';
import type { Table, Template } from './build-steps/types.js';
import { readProject } from './file-readers/project.js';
import { readTable } from './file-readers/table.js';
import { readTemplate } from './file-readers/template.js';
import { readFontsForSatori } from './types/font.js';
import { Length } from './types/length.js';

export async function runBuild(
  projectDirectoryPath: string,
  isPrintAndPlay: boolean,
) {
  /*
   * Read source files.
   */
  const project = await readProject(projectDirectoryPath);

  const usedTableNameSet = new Set(
    project.targets.map((target) => target.table),
  );
  const usedTemplateNameSet = new Set(
    project.targets.map((target) => target.template),
  );

  const tableByName = new Map<string, Table>();
  for (const tableName of usedTableNameSet) {
    const tableConfig = project.tables.find(
      (table) => table.name === tableName,
    );
    if (!tableConfig) {
      throw new Error(`undefined table "${tableName}"`);
    }
    const table = await readTable(project.directoryPath, tableConfig);
    tableByName.set(tableConfig.name, table);
  }

  const templateByName = new Map<string, Template>();
  for (const templateName of usedTemplateNameSet) {
    const templateConfig = project.templates.find(
      (template) => template.name === templateName,
    );
    if (!templateConfig) {
      throw new Error(`undefined template "${templateName}"`);
    }
    const template = await readTemplate(project.directoryPath, templateConfig);
    templateByName.set(templateConfig.name, template);
  }

  const fonts = await readFontsForSatori(project.activated_fonts);

  for (const targetConfig of project.targets) {
    let table = tableByName.get(targetConfig.table);
    if (!table) continue;

    if (isPrintAndPlay && targetConfig.print_and_play?.repeat_record_for) {
      const f = new Function(
        'data',
        `return ${targetConfig.print_and_play.repeat_record_for};`,
      );
      table = table.flatMap((record) => {
        const repeatCount = Number(f.call({}, { ...record })) || 0;
        return Array.from({ length: repeatCount }).map(() => record);
      });
    }

    const template = templateByName.get(targetConfig.template);
    if (!template) continue;

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

    await fs.mkdir(path.resolve(project.directoryPath, 'build'), {
      recursive: true,
    });
    await fs.writeFile(
      path.resolve(project.directoryPath, `build/${pdfFileName}`),
      pdfBytes,
    );
  }
}

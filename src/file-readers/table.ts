import fs from 'node:fs/promises';
import path from 'node:path';
import { parse as parseCsv } from 'csv-parse/sync';
import type { Table } from '../build-steps/types.js';
import {
  convertGoogleSheetToObjectArray,
  getGoogleSheet,
  getGoogleSheetNameById,
  initializeGoogle,
} from '../infras/google.js';
import type { Project } from './project.js';

export async function readTable(
  projectDirectoryPath: string,
  tableConfig: Project['tables'][number],
): Promise<Table> {
  let table: Table;

  if (tableConfig.type === 'google_sheets') {
    await initializeGoogle();
    const sheetName = await getGoogleSheetNameById(
      tableConfig.spreadsheet_id,
      tableConfig.sheet_id,
    );
    const sheet = await getGoogleSheet(tableConfig.spreadsheet_id, sheetName);
    table = convertGoogleSheetToObjectArray(sheet);
  } else {
    const tableCsvPath = path.resolve(projectDirectoryPath, tableConfig.path);
    const tableCsv = await fs.readFile(tableCsvPath, {
      encoding: 'utf-8',
    });
    table = parseCsv(tableCsv, { columns: true });
  }

  if (tableConfig.include_record_if) {
    const f = new Function('data', `return ${tableConfig.include_record_if};`);
    table = table?.filter((record) => f.call({}, { ...record }));
  }

  return table;
}

import { google } from 'googleapis';
import { googleSheetSchema } from '../schemas.js';
import { getRequiredEnv } from './env.js';
const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets.readonly',
];
let sheets;
export async function initializeGoogle() {
    const jwtClient = new google.auth.JWT(getRequiredEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL'), undefined, getRequiredEnv('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY'), [...SCOPES], undefined);
    await jwtClient.authorize();
    sheets = google.sheets({ version: 'v4', auth: jwtClient });
}
export async function getGoogleSheet(spreadsheetId, sheetName) {
    if (!sheets)
        throw new Error('Google APIs client not initialized');
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${sheetName}'`,
    });
    const values = response.data.values;
    if (!values) {
        throw new Error(`Failed to read sheet: ${spreadsheetId} ${sheetName}`);
    }
    return googleSheetSchema.parse(values);
}
export async function getGoogleSheetNameById(spreadsheetId, sheetId) {
    if (!sheets)
        throw new Error('Google APIs client not initialized');
    const response = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = response.data.sheets?.find((sheet) => sheet.properties?.sheetId === sheetId);
    if (!sheet) {
        throw new Error(`Sheet not found: ${spreadsheetId} ${sheetId}`);
    }
    if (!sheet.properties?.title) {
        throw new Error(`Sheet has no title: ${spreadsheetId} ${sheetId}`);
    }
    return sheet.properties.title;
}
export function convertGoogleSheetToObjectArray(sheet) {
    const [fieldNames, ...rest] = sheet;
    if (!fieldNames)
        return [];
    return rest.map((array) => {
        const record = {};
        for (const [index, fieldName] of fieldNames.entries()) {
            if (!fieldName)
                continue;
            record[fieldName] = array[index] ?? '';
        }
        return record;
    });
}

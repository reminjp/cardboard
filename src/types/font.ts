import child_process from 'node:child_process';
import fs from 'node:fs/promises';

import groupBy from 'lodash.groupby';
import type { Font } from 'satori';

export async function readFontsForSatori(
  familyNames: string[],
): Promise<Font[]> {
  const fcListItems = await readFcListItems();
  const fcListItemsByFamilyName = groupBy(fcListItems, (item) => item.familyEn);

  const satoriFonts: Font[] = [];

  for (const familyName of familyNames) {
    const fcListItems = fcListItemsByFamilyName[familyName];

    if (!fcListItems) {
      throw Error(`font family not found "${familyName}"`);
    }

    for (const fcListItem of fcListItems) {
      const data = await fs.readFile(fcListItem.file);

      const weightAndStyle = parseWeightAndStyleForSatori(fcListItem.styleEn);

      if (!weightAndStyle) continue;

      satoriFonts.push({
        ...weightAndStyle,
        name: fcListItem.familyEn,
        data,
      });
    }
  }

  return satoriFonts;
}

interface FcListItem {
  familyEn: string;
  styleEn: string;
  file: string;
}

async function readFcListItems(): Promise<FcListItem[]> {
  const separator = crypto.randomUUID();

  const fcList = child_process.spawnSync(
    'fc-list',
    [
      '--format',
      `%{family}${separator}%{familylang}${separator}%{style}${separator}%{stylelang}${separator}%{file}\\n`,
    ],
    { encoding: 'utf8' },
  );

  if (fcList.status !== 0) {
    throw new Error('failed to read font list', { cause: fcList.stderr });
  }

  return fcList.stdout.split('\n').map<FcListItem>((line) => {
    const [
      family = '',
      familylang = '',
      style = '',
      stylelang = '',
      file = '',
    ] = line.split(separator);
    const familyEn =
      family.split(',')[familylang.split(',').indexOf('en')] ?? '';
    const styleEn = style.split(',')[stylelang.split(',').indexOf('en')] ?? '';
    return { familyEn, styleEn, file };
  });
}

function parseWeightAndStyleForSatori(
  fcListItemStyle: string,
): Pick<Font, 'style' | 'weight'> | undefined {
  let weight: Font['weight'] | undefined;
  let style: Font['style'] | undefined;

  if (/\bthin\b/i.test(fcListItemStyle)) {
    weight = 100;
  } else if (/\bextra\s*light\b/i.test(fcListItemStyle)) {
    weight = 200;
  } else if (/\blight\b/i.test(fcListItemStyle)) {
    weight = 300;
  } else if (/\bregular\b/i.test(fcListItemStyle)) {
    weight = 400;
  } else if (/\bmedium\b/i.test(fcListItemStyle)) {
    weight = 500;
  } else if (/\bsemi\s*bold\b/i.test(fcListItemStyle)) {
    weight = 600;
  } else if (/\bextra\s*bold\b/i.test(fcListItemStyle)) {
    weight = 800;
  } else if (/\bbold\b/i.test(fcListItemStyle)) {
    weight = 700;
  } else if (/\bblack\b/i.test(fcListItemStyle)) {
    weight = 900;
  }

  if (/\bitalic\b/i.test(fcListItemStyle)) {
    style = 'italic';
  } else {
    style = 'normal';
  }

  if (!weight || !style) return;

  return { style, weight };
}

import { z } from '../deps.ts';

// TODO
const lengthSchema = z.string().min(1);
const nameSchema = z.string().min(1);
const pathSchema = z.string().min(1);

export const projectSchema = z.object({
  activated_fonts: z.array(z.string().min(1)),
  targets: z.array(
    z.object({
      name: nameSchema,
      table: nameSchema,
      template: nameSchema,
      bleed: lengthSchema,
      print_and_play: z.object({
        is_back: z.boolean().optional(),
      }).optional(),
    }),
  ),
  tables: z.array(
    z.discriminatedUnion('type', [
      z.object({
        name: nameSchema,
        type: z.undefined(),
        path: pathSchema,
      }),
      z.object({
        name: nameSchema,
        type: z.literal('google_sheets'),
        spreadsheet_id: z.string().min(1),
        sheet_id: z.number().int().nonnegative(),
      }),
    ]),
  ),
  templates: z.array(
    z.object({
      name: nameSchema,
      path: pathSchema,
      width: lengthSchema,
      height: lengthSchema,
    }),
  ),
});

export const googleSheetSchema = z.array(z.array(z.string()));

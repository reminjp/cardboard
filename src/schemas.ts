import { z } from 'zod';

// TODO
const lengthSchema = z.string().min(1);
const nameSchema = z.string().min(1);
const pathSchema = z.string().min(1);

const tableBaseSchema = z.object({
  name: nameSchema,
  include_record_if: z.string().min(1).optional(),
});

export const projectSchema = z.object({
  activated_fonts: z.array(z.string().min(1)),
  targets: z.array(
    z.object({
      name: nameSchema,
      table: nameSchema,
      template: nameSchema,
      bleed: lengthSchema,
      print_and_play: z
        .object({
          is_back: z.boolean().optional(),
          repeat_record_for: z.string().min(1).optional(),
        })
        .optional(),
    }),
  ),
  tables: z.array(
    z.discriminatedUnion('type', [
      tableBaseSchema.extend({
        type: z.undefined(),
        path: pathSchema,
      }),
      tableBaseSchema.extend({
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

import { z } from 'zod';

// TODO
const lengthSchema = z.string().min(0);
const nameSchema = z.string().min(0);
const pathSchema = z.string().min(0);

export const projectSchema = z.object({
  activated_fonts: z.array(z.string().min(0)),
  targets: z.array(
    z.object({
      name: nameSchema,
      table: nameSchema,
      template: nameSchema,
      bleed: lengthSchema,
    }),
  ),
  tables: z.array(
    z.object({
      name: nameSchema,
      path: pathSchema,
    }),
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

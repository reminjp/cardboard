import { z } from 'zod';

// TODO
const lengthSchema = z.string().min(0);
const nameSchema = z.string().min(0);
const pathSchema = z.string().min(0);

export const projectSchema = z.object({
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
  fonts: z.array(
    z.object({
      name: z.string().min(0),
      path: pathSchema,
      weight: z.union([
        z.literal(100),
        z.literal(200),
        z.literal(300),
        z.literal(400),
        z.literal(500),
        z.literal(600),
        z.literal(700),
        z.literal(800),
        z.literal(900),
      ]),
      style: z.enum(['normal', 'italic']),
    }),
  ),
});

import { z } from 'zod';

export const googleSheetSchema = z.array(z.array(z.string()));

import { load } from 'std/dotenv/mod.ts';
import { cli } from './src/cli.ts';

if (import.meta.main) {
  await load({ export: true });
  cli.parse();
}

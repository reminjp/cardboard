import { dotenv } from './deps.ts';
import { cli } from './src/cli.ts';

if (import.meta.main) {
  await dotenv.load({ export: true });
  cli.parse();
}

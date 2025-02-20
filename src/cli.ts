import dotenv from 'dotenv';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { runBuild } from './build.js';

const cli = yargs(hideBin(process.argv))
  .scriptName('cardboard')
  .version('0.1.0')
  .option('cwd', {
    description: 'Specify a current working directory.',
    type: 'string',
  })
  .command('$0', false, {}, () => {
    cli.showHelp();
  })
  .command(
    'build',
    'Build a sheet.',
    (yargs) =>
      yargs.option('print-and-play', {
        description: 'Build for print and play.',
        type: 'boolean',
      }),
    async (argv) => {
      await runBuild(argv.cwd || process.cwd(), argv.printAndPlay ?? false);
    },
  )
  .help();

dotenv.config();
await cli.parse();

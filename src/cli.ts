import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { runBuild } from './build.js';

export const cli = yargs(hideBin(process.argv))
  .scriptName('cardboard')
  .version('0.1.0')
  .option('cwd', {
    description: 'Specify a current working directory.',
    type: 'string',
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
      await runBuild(argv.cwd, argv.printAndPlay ?? false);
    },
  )
  .help();

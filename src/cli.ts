import { Command } from 'cliffy/command/mod.ts';
import { runBuild } from './build.ts';

const build = new Command<{ cwd?: string }>()
  .description('Build a sheet.')
  .option('--print-and-play', 'Build for print and play.')
  .action(async (options) => {
    await runBuild(options.cwd, options.printAndPlay ?? false);
  });

export const cli = new Command()
  .name('cardboard')
  .version('0.1.0')
  .description('A command line tool to generate cards.')
  .globalOption('--cwd <path>', 'Specify a current working directory.')
  .command('build', build);

import { Command } from 'cliffy/command/mod.ts';
import { runBuild } from './build.ts';

const build = new Command()
  .arguments('<path:file>')
  .description('Build a sheet.')
  .action(async (_options, path: string) => {
    await runBuild(path);
  });

await new Command()
  .name('cardboard')
  .version('0.1.0')
  .description('A command line tool to generate cards.')
  .command('build', build)
  .parse(Deno.args);

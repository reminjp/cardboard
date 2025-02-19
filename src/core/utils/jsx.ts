import path from 'node:path';

import * as esbuild from 'esbuild';

import type { Template } from '../types.js';

const INDEX_JS_CODE = `globalThis.$Fragment = Symbol.for('react.fragment');
globalThis.$jsx = (type, props, ...children) => {
  const newChildren = [];
  for (const child of children) {
    if (!child) continue;
    if (child.type === $Fragment) {
      newChildren.push(...child.props.children);
    } else {
      newChildren.push(child);
    }
  }
  return { type, props: { ...props, children: newChildren } };
};
console.log($jsx('div', { style: { "display": "flex", "flexDirection": "column", "width": "100%", "height": "100%" } }, t({ data })));
`;

export async function buildTemplateJsx(
  templateJsxPath: string,
): Promise<Template['renderHtmlAst']> {
  const buildResult = await esbuild.build({
    stdin: {
      contents: `import { default as t } from './${path.parse(templateJsxPath).base}';\n${INDEX_JS_CODE}`,
      loader: 'jsx',
      resolveDir: path.parse(templateJsxPath).dir,
    },
    platform: 'node',
    jsxFactory: '$jsx',
    jsxFragment: '$Fragment',
    bundle: true,
    write: false,
  });

  if (!buildResult.outputFiles[0]) {
    throw new Error('Failed to build template.', { cause: buildResult.errors });
  }

  const functionBody = buildResult.outputFiles[0].text.replaceAll(
    /console\.log\(([\s\S]+)\);/g,
    (_, expression) => `return ${expression};`,
  );

  const f = new Function('data', functionBody);

  return (record) => f.call({}, { ...record });
}

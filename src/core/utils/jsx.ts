import path from 'node:path';
import vm from 'node:vm';

import swc from '@swc/core';

import type { Template } from '../types.ts';

const INDEX_JS_CODE = `import { default as t } from '$template';

globalThis.$Fragment = Symbol.for('react.fragment');

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

$output((record) => $jsx('div', { style: { "display": "flex", "flexDirection": "column", "width": "100%", "height": "100%" } }, t({ record })));
`;

export async function buildTemplateJsx(
  templateJsxPath: string,
  data: string,
): Promise<Template['renderHtmlAst']> {
  const { promise, resolve } =
    Promise.withResolvers<Template['renderHtmlAst']>();

  const context = vm.createContext({
    $output: (f: Template['renderHtmlAst']) => resolve(f),
  });

  const indexJsModule = new vm.SourceTextModule(INDEX_JS_CODE, {
    context,
  });

  const linker: vm.ModuleLinker = async (specifier, referencingModule) => {
    if (specifier === '$template') {
      const transformOutput = await swc.transform(data, {
        filename: path.parse(templateJsxPath).base,
        isModule: true,
        jsc: {
          parser: { syntax: 'typescript', tsx: true },
          transform: {
            react: {
              pragma: '$jsx',
              pragmaFrag: '$Fragment',
            },
          },
        },
      });
      return new vm.SourceTextModule(transformOutput.code, {
        context: referencingModule.context,
      });
    }
    throw new Error(`Unable to resolve dependency: ${specifier}`);
  };

  await indexJsModule.link(linker);
  await indexJsModule.evaluate();

  return await promise;
}

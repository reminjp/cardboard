import { Template } from '../types.ts';
import { bundle, path } from '../../../deps.ts';

const BUNDLE_LOAD_RESPONSE_HEADERS = {
  'content-type': 'application/javascript; charset=utf-8',
} as const;

const JSX_RUNTIME_MODULE_CONTENT =
  `export const _Fragment = Symbol.for('react.fragment');

export function _jsx(type, props, ...children) {
  const newChildren = [];
  for (const child of children) {
    if (!child) continue;
    if (child.type === _Fragment) {
      newChildren.push(...child.props.children);
    } else {
      newChildren.push(child);
    }
  }
  return { type, props: { ...props, children: newChildren } };
}
`;

export async function buildTemplateJsx(
  absolutePath: string,
  data: string,
): Promise<Template['renderHtmlAst']> {
  const templateModuleUrl = path.toFileUrl(absolutePath).toString();

  const rootModuleUrl = path.toFileUrl(path.join(
    path.dirname(absolutePath),
    `${crypto.randomUUID()}.jsx`,
  )).toString();
  const jsxRuntimeModuleUrl = path.toFileUrl(path.join(
    path.dirname(absolutePath),
    `${crypto.randomUUID()}.jsx`,
  )).toString();

  const bundleResult = await bundle(rootModuleUrl, {
    compilerOptions: {
      jsxFactory: '_jsx',
      jsxFragmentFactory: '_Fragment',
    },
    load(specifier) {
      switch (specifier) {
        case rootModuleUrl: {
          return Promise.resolve({
            kind: 'module',
            specifier,
            content: `import { _jsx, _Fragment } from '${jsxRuntimeModuleUrl}';
import { default as t } from '${templateModuleUrl}';
console.log(_jsx('div', { style: { "display": "flex", "flexDirection": "column", "width": "100%", "height": "100%" } }, t({ record })));`,
            headers: BUNDLE_LOAD_RESPONSE_HEADERS,
          });
        }
        case jsxRuntimeModuleUrl: {
          return Promise.resolve({
            kind: 'module',
            specifier,
            content: JSX_RUNTIME_MODULE_CONTENT,
            headers: BUNDLE_LOAD_RESPONSE_HEADERS,
          });
        }
        case templateModuleUrl: {
          return Promise.resolve({
            kind: 'module',
            specifier,
            content:
              `import { _jsx, _Fragment } from '${jsxRuntimeModuleUrl}';\n${data}`,
            headers: BUNDLE_LOAD_RESPONSE_HEADERS,
          });
        }
        default: {
          throw new Error(`Unexpected specifier: ${specifier}`);
        }
      }
    },
    minify: true,
  });

  const functionBody = bundleResult.code.replaceAll(
    /console\.log\(([\s\S]+)\);/g,
    (_, expression) => `return ${expression};`,
  );

  const f = new Function('record', functionBody);

  return (record) => f.call({}, { ...record });
}

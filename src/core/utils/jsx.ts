import { Template } from '../types.ts';
import { bundle, path } from '../../../deps.ts';

export async function buildTemplateJsx(
  absolutePath: string,
  data: string,
): Promise<Template['renderHtmlAst']> {
  const rootModuleUrl = path.toFileUrl(path.join(
    path.dirname(absolutePath),
    `${crypto.randomUUID()}.jsx`,
  )).toString();
  const templateModuleUrl = path.toFileUrl(absolutePath).toString();

  const bundleResult = await bundle(rootModuleUrl, {
    compilerOptions: {
      jsxFactory: '_jsx',
      jsxFragmentFactory: '_Fragment',
    },
    load(specifier) {
      if (specifier === rootModuleUrl) {
        return Promise.resolve({
          kind: 'module',
          specifier,
          content:
            `import { default as t } from '${templateModuleUrl}';console.log(t);`,
          headers: { 'content-type': 'application/javascript; charset=utf-8' },
        });
      }
      if (specifier === templateModuleUrl) {
        return Promise.resolve({
          kind: 'module',
          specifier,
          content: data,
          headers: { 'content-type': 'application/javascript; charset=utf-8' },
        });
      }
      throw new Error(`Unexpected specifier: ${specifier}`);
    },
  });

  const functionBody = `const _Fragment = Symbol.for('react.fragment');
function _jsx(type, props, ...children) {
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
${
    bundleResult.code.replaceAll(
      /console\.log\(([\w\$-]+)\);/g,
      (_, componentName) =>
        `return _jsx('div', { style: { "display": "flex", "flexDirection": "column", "width": "100%", "height": "100%" } }, ${componentName}({ record }));`,
    )
  }
`;

  const f = new Function('record', functionBody);

  return (record) => f.call({}, { ...record });
}

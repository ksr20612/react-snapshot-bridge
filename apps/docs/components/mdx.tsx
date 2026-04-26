import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { ScrollPreservationDemo } from './ScrollPreservationDemo';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    ScrollPreservationDemo,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}

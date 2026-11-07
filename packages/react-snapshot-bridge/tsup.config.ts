import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'tsup';

const root = dirname(fileURLToPath(import.meta.url));
const clientDirective = "'use client';\n";

function prependUseClient(filename: string) {
  const file = join(root, 'dist', filename);
  const source = readFileSync(file, 'utf8');
  if (source.startsWith(clientDirective)) return;
  writeFileSync(file, clientDirective + source);
}

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  target: 'es2020',
  outExtension: ({ format }) => ({
    js: format === 'cjs' ? '.cjs' : '.js',
  }),
  external: ['react', 'react-dom'],
  // esbuild drops the directive while bundling the entry with its helpers.
  // Put it back on the published files. The source entry keeps it for bundlers that compile src directly.
  onSuccess() {
    prependUseClient('index.js');
    prependUseClient('index.cjs');
  },
});

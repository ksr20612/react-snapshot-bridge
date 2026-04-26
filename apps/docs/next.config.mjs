import { createMDX } from 'fumadocs-mdx/next';

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Compile the workspace library on the fly so we can import it directly
  // without an explicit build step during dev.
  transpilePackages: ['react-snapshot-bridge'],
};

const withMDX = createMDX();

export default withMDX(config);

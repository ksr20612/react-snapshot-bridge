import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">react-snapshot-bridge</h1>
      <p className="max-w-xl text-lg text-fd-muted-foreground">
        Use React&rsquo;s class-only{' '}
        <code className="font-mono text-fd-foreground">getSnapshotBeforeUpdate</code> lifecycle from
        function components, via a tiny wrapper.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/docs"
          className="rounded-md bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground transition hover:opacity-90"
        >
          Read the docs
        </Link>
        <a
          href="https://github.com/ethan/react-snapshot-bridge"
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-fd-border px-5 py-2.5 text-sm font-medium text-fd-foreground transition hover:bg-fd-accent"
        >
          GitHub
        </a>
      </div>
    </main>
  );
}

import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-white/60 py-8 dark:bg-slate-950/40">
      <div className="container flex flex-col gap-6 text-sm text-slate-950/60 dark:text-slate-200/70 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-medium text-foreground">Yield Dashboard</p>
          <p>Demo & education only. Not financial advice.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-foreground">
            Docs
          </a>
          <Link href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-foreground">
            Contracts
          </Link>
          <Link href="https://thegraph.com" target="_blank" rel="noreferrer" className="hover:text-foreground">
            Subgraphs
          </Link>
          <span className="text-xs">Build {process.env.NEXT_PUBLIC_COMMIT_SHA ?? "dev"}</span>
        </div>
      </div>
    </footer>
  );
}

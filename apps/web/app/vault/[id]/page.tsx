import { notFound } from "next/navigation";

export default function VaultPage({ params }: { params: { id: string } }) {
  const { id } = params;

  if (!id) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-border bg-white/90 p-8 dark:bg-slate-950/60">
        <p className="text-sm uppercase tracking-wide text-slate-950/60">Vault preview</p>
        <h1 className="mt-2 text-3xl font-semibold">Vault {id}</h1>
        <p className="mt-3 text-slate-950/70 dark:text-slate-200/70">
          Detailed analytics, charts, and transaction panels will land in the next iteration. This placeholder keeps the
          route available for navigation and testing.
        </p>
      </div>
    </div>
  );
}

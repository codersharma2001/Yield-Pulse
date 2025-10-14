import { ShieldAlert } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OperatorPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-slate-950/60">Operator Console</p>
        <h1 className="text-3xl font-semibold">Rebalance & guardianship</h1>
        <p className="text-slate-950/70 dark:text-slate-200/70">
          Operator tooling for bridge-assisted rebalances, emergency pauses, and upgrade reviews will surface here.
        </p>
      </header>
      <Card className="bg-white/90 dark:bg-slate-950/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-warning" />
            Restricted area
          </CardTitle>
          <CardDescription>
            Access is gated to ADMIN/OPERATOR roles. Connect with a privileged wallet to unlock rebalance tooling once it
            ships.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-950/70 dark:text-slate-200/70">
          Foundation contracts support pausing, adapter updates, and bridge approvals. The UI will expose safe-guarded
          workflows, complete with Tenderly dry-runs before execution.
        </CardContent>
      </Card>
    </section>
  );
}

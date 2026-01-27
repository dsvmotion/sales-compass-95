import { Building2 } from 'lucide-react';

export function Header() {
  return (
    <header className="glass-card px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/20">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Pharmacy Tracker
          </h1>
          <p className="text-sm text-muted-foreground">
            CRM Dashboard
          </p>
        </div>
      </div>
    </header>
  );
}

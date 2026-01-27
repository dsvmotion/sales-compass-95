import { Map, ShoppingCart, Sparkles } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface HeaderProps {
  showHeatmap: boolean;
  onHeatmapToggle: (value: boolean) => void;
}

export function Header({ showHeatmap, onHeatmapToggle }: HeaderProps) {
  return (
    <header className="glass-card px-6 py-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-primary">
            <Map className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight glow-text">
              Sales Tracker
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <ShoppingCart className="h-3 w-3" />
              WooCommerce Integration
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch
              id="heatmap-toggle"
              checked={showHeatmap}
              onCheckedChange={onHeatmapToggle}
            />
            <Label htmlFor="heatmap-toggle" className="text-sm flex items-center gap-2 cursor-pointer">
              <Sparkles className="h-4 w-4 text-primary" />
              Heatmap View
            </Label>
          </div>
          
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10 border border-warning/20">
            <div className="h-2 w-2 rounded-full bg-warning animate-pulse" />
            <span className="text-xs text-warning font-medium">Demo Mode</span>
          </div>
        </div>
      </div>
    </header>
  );
}

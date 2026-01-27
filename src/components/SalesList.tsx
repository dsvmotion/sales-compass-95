import { Building2, Calendar, MapPin, Package, User } from 'lucide-react';
import { Sale } from '@/data/mockSales';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SalesListProps {
  sales: Sale[];
}

export function SalesList({ sales }: SalesListProps) {
  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-3">
        {sales.map((sale, index) => (
          <div
            key={sale.id}
            className="glass-card p-4 animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  sale.customerType === 'pharmacy' 
                    ? 'bg-pharmacy/10 text-pharmacy' 
                    : 'bg-accent/10 text-accent'
                }`}>
                  {sale.customerType === 'pharmacy' ? (
                    <Building2 className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{sale.customerName}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    sale.customerType === 'pharmacy'
                      ? 'bg-pharmacy/10 text-pharmacy'
                      : 'bg-accent/10 text-accent'
                  }`}>
                    {sale.customerType === 'pharmacy' ? 'Pharmacy' : 'Client'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-primary">€{sale.amount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{sale.orderId}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{sale.city}</span>
              </div>
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                <span>{sale.products} products</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(sale.date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

import { useState } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SPANISH_CITIES } from '@/types/pharmacy';

interface SearchLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (location: { lat: number; lng: number; name: string }) => void;
  isSearching: boolean;
}

export function SearchLocationDialog({
  open,
  onOpenChange,
  onSearch,
  isSearching,
}: SearchLocationDialogProps) {
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');

  const handleQuickSearch = (city: typeof SPANISH_CITIES[number]) => {
    onSearch({ lat: city.lat, lng: city.lng, name: city.name });
  };

  const handleCustomSearch = () => {
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    
    if (!isNaN(lat) && !isNaN(lng)) {
      onSearch({ lat, lng, name: 'Custom Location' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Pharmacies
          </DialogTitle>
          <DialogDescription>
            Select a city or enter custom coordinates to search for pharmacies
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Quick City Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Quick Select (Spain)</Label>
            <div className="grid grid-cols-2 gap-2">
              {SPANISH_CITIES.map((city) => (
                <Button
                  key={city.name}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSearch(city)}
                  disabled={isSearching}
                  className="justify-start"
                >
                  <MapPin className="h-3 w-3 mr-2" />
                  {city.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Custom Coordinates */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Custom Coordinates</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="lat" className="text-xs text-muted-foreground">Latitude</Label>
                <Input
                  id="lat"
                  type="number"
                  step="any"
                  placeholder="40.4168"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng" className="text-xs text-muted-foreground">Longitude</Label>
                <Input
                  id="lng"
                  type="number"
                  step="any"
                  placeholder="-3.7038"
                  value={customLng}
                  onChange={(e) => setCustomLng(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={handleCustomSearch}
              disabled={!customLat || !customLng || isSearching}
              className="w-full"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search This Location
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

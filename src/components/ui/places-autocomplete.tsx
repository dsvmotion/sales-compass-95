import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PlaceType = 'country' | 'administrative_area_level_1' | 'locality' | 'sublocality';

interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string, placeId?: string) => void;
  placeholder?: string;
  types?: PlaceType[];
  /** Restrict to country codes, e.g. ['es', 'fr'] */
  componentRestrictions?: { country: string | string[] };
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export function PlacesAutocomplete({
  value,
  onChange,
  placeholder = 'Search location...',
  types = ['locality', 'administrative_area_level_1'],
  componentRestrictions,
  disabled = false,
  className,
  icon,
}: PlacesAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize Google Places service
  useEffect(() => {
    if (typeof google !== 'undefined' && google.maps?.places) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      sessionToken.current = new google.maps.places.AutocompleteSessionToken();
    }
  }, []);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Fetch predictions
  const fetchPredictions = useCallback((query: string) => {
    if (!autocompleteService.current || !query.trim()) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);

    const request: google.maps.places.AutocompletionRequest = {
      input: query,
      types: types as string[],
      sessionToken: sessionToken.current!,
    };

    if (componentRestrictions) {
      request.componentRestrictions = componentRestrictions;
    }

    autocompleteService.current.getPlacePredictions(request, (results, status) => {
      setIsLoading(false);
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        setPredictions(results as Prediction[]);
        setShowDropdown(true);
        setHighlightedIndex(-1);
      } else {
        setPredictions([]);
      }
    });
  }, [types, componentRestrictions]);

  // Debounced input handler
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!newValue.trim()) {
      setPredictions([]);
      setShowDropdown(false);
      onChange('');
      return;
    }

    debounceTimer.current = setTimeout(() => {
      fetchPredictions(newValue);
    }, 300);
  }, [fetchPredictions, onChange]);

  // Select a prediction
  const handleSelect = useCallback((prediction: Prediction) => {
    const mainText = prediction.structured_formatting.main_text;
    setInputValue(mainText);
    setPredictions([]);
    setShowDropdown(false);
    onChange(mainText, prediction.place_id);
    
    // Reset session token after selection
    sessionToken.current = new google.maps.places.AutocompleteSessionToken();
  }, [onChange]);

  // Clear input
  const handleClear = useCallback(() => {
    setInputValue('');
    setPredictions([]);
    setShowDropdown(false);
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown || predictions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < predictions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : predictions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && predictions[highlightedIndex]) {
          handleSelect(predictions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  }, [showDropdown, predictions, highlightedIndex, handleSelect]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => predictions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400',
            icon && 'pl-10',
            inputValue && 'pr-8',
            className
          )}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
        {!isLoading && inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Predictions dropdown */}
      {showDropdown && predictions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {predictions.map((prediction, index) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handleSelect(prediction)}
              className={cn(
                'w-full px-3 py-2 text-left text-sm flex items-start gap-2 hover:bg-gray-50 transition-colors',
                index === highlightedIndex && 'bg-gray-100'
              )}
            >
              <MapPin className="h-4 w-4 mt-0.5 text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {prediction.structured_formatting.main_text}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {prediction.structured_formatting.secondary_text}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

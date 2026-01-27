import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SaveResult {
  saved: number;
  skipped: number;
}

/**
 * Hook for saving selected pharmacies to Operations.
 * Sets the `saved_at` timestamp to mark them as explicitly saved.
 */
export function useSavePharmacies() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pharmacyIds: string[]): Promise<SaveResult> => {
      if (pharmacyIds.length === 0) {
        throw new Error('No pharmacies selected');
      }

      // Check which pharmacies are already saved
      const { data: existing, error: fetchError } = await supabase
        .from('pharmacies')
        .select('id, saved_at')
        .in('id', pharmacyIds);

      if (fetchError) {
        throw new Error(`Failed to check existing pharmacies: ${fetchError.message}`);
      }

      // Filter to only unsaved pharmacies
      const alreadySaved = (existing || []).filter(p => p.saved_at !== null);
      const toSave = pharmacyIds.filter(id => !alreadySaved.some(p => p.id === id));

      if (toSave.length === 0) {
        return { saved: 0, skipped: alreadySaved.length };
      }

      // Update saved_at for selected pharmacies
      const { error: updateError } = await supabase
        .from('pharmacies')
        .update({ saved_at: new Date().toISOString() })
        .in('id', toSave);

      if (updateError) {
        throw new Error(`Failed to save pharmacies: ${updateError.message}`);
      }

      return {
        saved: toSave.length,
        skipped: alreadySaved.length,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacies'] });
      queryClient.invalidateQueries({ queryKey: ['saved-pharmacies'] });
      
      if (result.saved > 0 && result.skipped > 0) {
        toast.success(`Saved ${result.saved} pharmacies (${result.skipped} already saved)`);
      } else if (result.saved > 0) {
        toast.success(`Saved ${result.saved} pharmacies to Operations`);
      } else {
        toast.info('All selected pharmacies were already saved');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook for fetching only saved pharmacies (for Operations view).
 */
export function useSavedPharmacies() {
  return useQueryClient();
}

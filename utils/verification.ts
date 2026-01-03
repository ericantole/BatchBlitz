
import { supabase } from './supabase/client';

/**
 * Verifies if the current user has an active Pro subscription.
 * This effectively overrides any client-side state tampering.
 */
export const checkSubscriptionStatus = async (userId: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('is_pro')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Validation Error:', error);
            return false;
        }

        return data?.is_pro || false;
    } catch (err) {
        console.error('Validation Exception:', err);
        return false;
    }
};

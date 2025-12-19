import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { supabase } from '../utils/supabase/client';
import { getEnv } from '../utils/env';
import { useStore } from '../store/useStore';

export const PayPalSubscriptionButton: React.FC = () => {
  const { user, setPro } = useStore();
  const clientId = getEnv('NEXT_PUBLIC_PAYPAL_CLIENT_ID');
  const planId = getEnv('NEXT_PUBLIC_PAYPAL_PLAN_ID');

  const handleApprove = async (data: any) => {
    if (!user) return;

    // 1. Update Local State immediately for UX
    setPro(true);
    alert("Payment Successful! Welcome to BatchBlitz Pro.");

    // 2. Update Database
    // In a real production app, you should use a Supabase Edge Function to verify this securely.
    // For this implementation, we update the table directly from the client.
    try {
      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          status: 'active',
          paypal_sub_id: data.subscriptionID,
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 days
        });

      if (error) console.error('Error updating subscription:', error);
    } catch (err) {
      console.error('Subscription DB Error:', err);
    }
  };

  return (
    <div className="w-full max-w-[300px] mx-auto relative z-10">
      <PayPalScriptProvider options={{ 
          clientId: clientId, 
          vault: true, 
          intent: 'subscription' 
      }}>
        <PayPalButtons 
          style={{ 
            shape: 'rect', 
            color: 'gold', 
            layout: 'vertical', 
            label: 'subscribe' 
          }}
          createSubscription={(data, actions) => {
            return actions.subscription.create({
              'plan_id': planId
            });
          }}
          onApprove={handleApprove}
        />
      </PayPalScriptProvider>
    </div>
  );
};
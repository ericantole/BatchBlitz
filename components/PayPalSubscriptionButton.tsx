
import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useStore } from '../store/useStore';
import { supabase } from '../utils/supabase/client';
import { useToast } from './Toast';
import { useNavigate } from 'react-router-dom';

const CLIENT_ID = 'Ab00wJTTtdTA3Fe2R_oy5Wv0vrUTts4p9aqybdyhPyjy-NMQwKyn7nVn0eKDkhOx2VLVikNaPEXSp_75';
const PLAN_ID = 'P-22D04505AG394432VNFET4OY';

export const PayPalSubscriptionButton: React.FC = () => {
  const { user, setPro } = useStore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  return (
    <div className="w-full relative z-0">
      <PayPalScriptProvider options={{
        clientId: CLIENT_ID,
        intent: 'subscription',
        vault: true,
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
              plan_id: PLAN_ID
            });
          }}
          onApprove={async (data, actions) => {
            // 1. Show UI Success immediately
            showToast('Subscription successful! Unlocking Pro...', 'success');

            // 2. Update Database
            if (user) {
              const { error } = await supabase
                .from('profiles')
                .update({
                  is_pro: true,
                  subscription_id: data.subscriptionID,
                  updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

              if (error) {
                console.error('DB Update Failed:', error);
                // Fallback: Still enable locally so user isn't blocked, 
                // but admin should investigate failures.
                showToast('Account updated locally. Please contact support if issues persist.', 'success');
              }
            }

            // 3. Update Local State
            setPro(true);

            // 4. Redirect
            setTimeout(() => {
              navigate('/thanks');
            }, 1000);
          }}
          onError={(err) => {
            console.error('PayPal Error:', err);
            showToast('Payment failed. Please try again.', 'error');
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
};
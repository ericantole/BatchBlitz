export const getEnv = (key: string): string => {
  // Check process.env (Standard Node/Next.js)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  
  // Check import.meta.env (Vite)
  // Vite usually requires VITE_ prefix, but we can try direct access or fallback
  const meta = import.meta as any;
  if (meta.env && meta.env[key]) {
    return meta.env[key];
  }

  // Check if it's one of our hardcoded PayPal keys for the demo
  if (key === 'NEXT_PUBLIC_PAYPAL_CLIENT_ID') return 'Ab00wJTTtdTA3Fe2R_oy5Wv0vrUTts4p9aqybdyhPyjy-NMQwKyn7nVn0eKDkhOx2VLVikNaPEXSp_75';
  if (key === 'NEXT_PUBLIC_PAYPAL_PLAN_ID') return 'P-50W293849N777821BNE523QY';

  return '';
};
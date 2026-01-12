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



  return '';
};
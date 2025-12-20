import React, { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Checkout } from './pages/Checkout';
import { Login } from './pages/Login';
import { Pricing } from './pages/Pricing';
import { About } from './pages/About';
import { Thanks } from './pages/Thanks';
import { useStore } from './store/useStore';
import { supabase } from './utils/supabase/client';
import { ToastProvider } from './components/Toast';
import { AuthRedirectHandler } from './components/AuthRedirectHandler';

const App: React.FC = () => {
  const { setUser, reset } = useStore();

  // Global Auth Listener
  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (_event === 'SIGNED_OUT') {
        reset();
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, reset]);

  return (
    <ToastProvider>
      <HashRouter>
        <AuthRedirectHandler />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/thanks" element={<Thanks />} />
          <Route path="/login" element={<Login />} />
          {/* Catch-all route to handle dynamic preview paths or 404s gracefully */}
          <Route path="*" element={<Home />} />
        </Routes>
      </HashRouter>
    </ToastProvider>
  );
};

export default App;
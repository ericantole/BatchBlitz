import React from 'react';
import { useStore } from '../store/useStore';
import { supabase } from '../utils/supabase/client';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, Menu, X } from 'lucide-react';

interface NavbarProps {
  onLoginClick?: () => void;
  onReset?: () => void;
  hasImages?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onLoginClick, onReset, hasImages = false }) => {
  const { user, isPro, reset } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);

  // Reset error state when user changes
  React.useEffect(() => {
    setImgError(false);
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    reset();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = "/";
  };

  const handleManageBilling = () => {
    // Dodo Payments Customer Portal (Users log in with email)
    window.open('https://customer.dodopayments.com', '_blank');
  };

  return (
    <>
      <div className="absolute top-0 left-0 w-full h-20 flex items-center px-4 md:px-8 z-30 pointer-events-none sticky-navbar">

        {/* Logo Area */}
        <div className={`bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-card border border-white flex items-center gap-4 pointer-events-auto group mr-4 transition-opacity duration-300 ${(location.pathname === '/' && !hasImages) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <button onClick={handleLogoClick} className="relative h-8 flex items-center justify-center px-2">
            <div className="text-xl font-serif font-bold tracking-tight text-ink-main relative z-10 px-2">
              BatchBlitz
            </div>
            <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 32" preserveAspectRatio="none">
              <rect
                x="0" y="0" width="100%" height="100%"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="1.5"
                strokeLinecap="square"
                className="animate-draw-rect"
                rx="4"
              />
            </svg>
          </button>
        </div>

        {/* Right Actions */}
        <div className="ml-auto pointer-events-auto flex items-center gap-4">
          {!hasImages && (
            <>
              <button onClick={() => {
                if (location.pathname === '/') {
                  document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
                } else {
                  navigate('/?section=features');
                }
              }} className="text-sm font-bold text-ink-muted hover:text-ink-main transition-colors hidden md:block">
                Features
              </button>
              <Link to="/pricing" className="text-sm font-bold text-ink-muted hover:text-ink-main transition-colors hidden md:block">
                Pricing
              </Link>
              <Link to="/about" className="text-sm font-bold text-ink-muted hover:text-ink-main transition-colors hidden md:block">
                About
              </Link>
            </>
          )}

          {!user ? (
            <button
              onClick={onLoginClick}
              className="bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-card border border-white text-sm font-bold text-ink-main hover:bg-white transition-all hidden md:block"
            >
              Sign In
            </button>
          ) : (
            <div className="bg-white/80 backdrop-blur-md pl-1.5 pr-4 py-1.5 rounded-2xl shadow-card border border-white flex items-center gap-3 hidden md:flex">
              <div className="relative group cursor-pointer">
                {user.user_metadata?.avatar_url && !imgError ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="User"
                    className="w-8 h-8 rounded-full border border-gray-200"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-8 h-8 bg-accent-gold/20 rounded-full flex items-center justify-center text-xs font-bold text-accent-gold">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* User Dropdown */}
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-float border border-gray-100 overflow-hidden hidden group-hover:block animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-3 border-b border-gray-100">
                    <p className="text-xs font-bold text-ink-main truncate">{user.user_metadata?.full_name || user.email}</p>
                    <p className="text-[10px] text-ink-muted uppercase tracking-wider mt-1">{isPro ? 'Pro Plan' : 'Free Plan'}</p>
                  </div>
                  {isPro && (
                    <button onClick={handleManageBilling} className="w-full text-left px-4 py-2 text-xs text-ink-main hover:bg-gray-50">
                      Manage Billing
                    </button>
                  )}
                  <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50">
                    Sign Out
                  </button>
                </div>
              </div>

              <div className="flex flex-col hidden md:flex">
                <span className="text-xs font-bold text-ink-main max-w-[100px] truncate">{user.user_metadata?.full_name || "User"}</span>
                {isPro && <span className="text-[9px] text-accent-gold font-bold tracking-wider leading-none">PRO</span>}
              </div>
            </div>
          )}

          {/* Mobile Hamburger Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden bg-white/80 backdrop-blur-md p-2.5 rounded-xl shadow-card border border-white text-ink-main hover:bg-white transition-all"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute top-24 right-4 w-64 bg-white rounded-2xl shadow-float border border-white/20 p-4 flex flex-col gap-2 animate-in slide-in-from-top-4 fade-in duration-200" onClick={e => e.stopPropagation()}>

            {user && (
              <div className="p-3 bg-gray-50 rounded-xl mb-2 flex items-center gap-3">
                {user.user_metadata?.avatar_url && !imgError ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="User"
                    className="w-10 h-10 rounded-full border border-gray-200"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-10 h-10 bg-accent-gold/20 rounded-full flex items-center justify-center text-sm font-bold text-accent-gold">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-ink-main truncate">{user.user_metadata?.full_name || user.email}</p>
                  <p className="text-[10px] text-ink-muted uppercase tracking-wider">{isPro ? 'Pro Plan' : 'Free Plan'}</p>
                </div>
              </div>
            )}

            {!hasImages && (
              <>
                <button onClick={() => {
                  document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
                  setIsMobileMenuOpen(false);
                }} className="block w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 text-sm font-bold text-ink-main transition-colors">
                  Features
                </button>
                <Link to="/pricing" className="block px-4 py-3 rounded-xl hover:bg-gray-50 text-sm font-bold text-ink-main transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  Pricing
                </Link>
                <Link to="/about" className="block px-4 py-3 rounded-xl hover:bg-gray-50 text-sm font-bold text-ink-main transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  About
                </Link>
                <div className="h-px bg-gray-100 my-1"></div>
              </>
            )}

            {!user ? (
              <button
                onClick={() => {
                  if (onLoginClick) onLoginClick();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 text-sm font-bold text-ink-main text-accent-gold transition-colors"
              >
                Sign In
              </button>
            ) : (
              <>
                {isPro && (
                  <button onClick={handleManageBilling} className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 text-sm font-medium text-ink-main">
                    Manage Billing
                  </button>
                )}
                <button onClick={handleSignOut} className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 text-sm font-bold text-red-500 transition-colors">
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
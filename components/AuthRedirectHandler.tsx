import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

export const AuthRedirectHandler = () => {
    const { user } = useStore();
    const navigate = useNavigate();

    const [isRedirecting, setIsRedirecting] = useState(() => !!localStorage.getItem('batchblitz_redirect'));

    useEffect(() => {
        if (user) {
            const redirectPath = localStorage.getItem('batchblitz_redirect');
            if (redirectPath) {
                // Determine if we need to force reload or just navigate
                // Use replace to avoid back-button issues
                navigate(redirectPath, { replace: true });
                localStorage.removeItem('batchblitz_redirect');
                setIsRedirecting(false);
            } else {
                setIsRedirecting(false);
            }
        } else {
            // Safety timeout: give ample time for Supabase to restore session
            const timer = setTimeout(() => {
                // Double check session in case store is lagging
                setIsRedirecting(false);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [user, navigate]);

    if (isRedirecting) {
        return (
            <div className="fixed inset-0 z-[100] bg-paper-base flex items-center justify-center">
                <div className="text-center space-y-4 animate-pulse">
                    <img src="/favicon.svg" alt="Logo" className="w-16 h-16 mx-auto" />
                    <h3 className="text-ink-muted font-medium">Verifying Studio Access...</h3>
                </div>
            </div>
        );
    }

    return null;
};

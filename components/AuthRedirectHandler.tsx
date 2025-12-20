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
                localStorage.removeItem('batchblitz_redirect');
                navigate(redirectPath);
                setIsRedirecting(false);
            } else {
                setIsRedirecting(false);
            }
        } else {
            // Safety timeout: if auth takes too long or fails, stop showing loader
            const timer = setTimeout(() => setIsRedirecting(false), 2000);
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

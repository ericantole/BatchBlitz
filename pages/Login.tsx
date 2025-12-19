import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoginModal } from '../components/LoginModal';
import { useStore } from '../store/useStore';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') || '/';
  const { user } = useStore();

  useEffect(() => {
    if (user) {
      navigate(next);
    }
  }, [user, navigate, next]);

  // We reuse the modal UI but centered on a page
  return (
    <div className="min-h-screen bg-paper-base flex items-center justify-center p-4">
      <LoginModal onClose={() => navigate('/')} />
    </div>
  );
};
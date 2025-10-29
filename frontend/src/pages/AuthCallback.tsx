import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');
        const userStr = searchParams.get('user');

        if (!token || !userStr) {
          throw new Error('Missing authentication data');
        }

        const user = JSON.parse(decodeURIComponent(userStr));
        setAuth(user, token);

        toast.success(`Willkommen zurück, ${user.name}!`);
        navigate('/dashboard');
      } catch (error) {
        toast.error('Anmeldung fehlgeschlagen');
        navigate('/login');
      }
    };

    handleCallback();
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Anmeldung wird verarbeitet...</p>
      </div>
    </div>
  );
};

export default AuthCallback;

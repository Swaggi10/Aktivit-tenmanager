import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { LogIn, Zap, Trophy, Users, TrendingUp, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, setAuth } = useAuthStore();
  const [demoMode, setDemoMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }

    // Prüfe ob Demo-Modus verfügbar ist
    const checkDemoMode = async () => {
      try {
        const response = await axios.get('http://localhost:4000/api/auth/demo/status');
        setDemoMode(response.data.data.enabled);
      } catch {
        setDemoMode(false);
      }
    };

    checkDemoMode();
  }, [isAuthenticated, navigate, setAuth]);

  const handleMicrosoftLogin = () => {
    // Redirect zu Microsoft Login
    window.location.href = 'http://localhost:4000/api/auth/microsoft';
  };

  const handleDemoLogin = async (email: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:4000/api/auth/demo/login', { email });
      const { user, token } = response.data.data;

      setAuth(user, token);
      toast.success(`Willkommen, ${user.name}!`);
      navigate('/dashboard');
    } catch (error) {
      toast.error('Demo-Login fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Echtzeit-Zusammenarbeit',
      description: 'Arbeite live mit deinem Team zusammen',
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: 'Gamification',
      description: 'Punkte sammeln und Achievements freischalten',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Team-Management',
      description: 'Organisiere dein Team effizient',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Leaderboards',
      description: 'Vergleiche deine Leistung mit anderen',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding & Features */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-white space-y-8"
        >
          <div>
            <h1 className="text-5xl font-bold mb-4">
              Aktivitäten<span className="text-primary-200">manager</span>
            </h1>
            <p className="text-xl text-primary-100">
              Die gamifizierte Aufgabenmanagement-Plattform für produktive Teams
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4"
              >
                <div className="text-primary-200 mb-2">{feature.icon}</div>
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-primary-200">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Side - Login Card */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-2xl p-8"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <Trophy className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Willkommen zurück!</h2>
            <p className="text-gray-600">
              Melde dich mit deinem Microsoft-Account an
            </p>
          </div>

          {demoMode && (
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <Play className="w-4 h-4 text-primary-600" />
                <span className="font-medium">Demo-Modus</span>
                <span className="text-gray-400">– Sofort testen ohne Azure AD</span>
              </div>

              <button
                onClick={() => handleDemoLogin('admin@demo.com')}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium py-2.5 px-4 rounded-lg transition-all disabled:opacity-50"
              >
                🎯 Als Admin einloggen
              </button>

              <button
                onClick={() => handleDemoLogin('teamleader@demo.com')}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2.5 px-4 rounded-lg transition-all disabled:opacity-50"
              >
                👥 Als Team Leader einloggen
              </button>

              <button
                onClick={() => handleDemoLogin('member@demo.com')}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-2.5 px-4 rounded-lg transition-all disabled:opacity-50"
              >
                👤 Als Member einloggen
              </button>
            </div>
          )}

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">oder</span>
            </div>
          </div>

          <button
            onClick={handleMicrosoftLogin}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-colors"
          >
            <LogIn className="w-5 h-5" />
            Mit Microsoft anmelden
          </button>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Durch die Anmeldung stimmst du unseren{' '}
              <a href="#" className="text-primary-600 hover:underline">
                Nutzungsbedingungen
              </a>{' '}
              und der{' '}
              <a href="#" className="text-primary-600 hover:underline">
                Datenschutzerklärung
              </a>{' '}
              zu.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;

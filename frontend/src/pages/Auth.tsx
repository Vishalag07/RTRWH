import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthBar } from '../components/AuthBar';
import { Logo } from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';

export function Auth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login: authLogin, register: authRegister, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    if (modeParam === 'register') {
      setMode('register');
    }
  }, []);

  async function register() {
    setSubmitting(true);
    setMessage(null);
    try {
      const success = await authRegister(name.trim(), email.trim(), password);
      if (success) {
        setMessage({ type: 'success', text: t('auth.register_success') });
        setMode('login');
      } else {
        setMessage({ type: 'error', text: t('auth.register_failed') });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: t('auth.register_failed') });
    } finally {
      setSubmitting(false);
    }
  }

  async function login() {
    setSubmitting(true);
    setMessage(null);
    try {
      const success = await authLogin(email.trim(), password);
      if (success) {
        setMessage({ type: 'success', text: t('auth.login_success') });
        // Redirect to dashboard after successful login
        navigate('/dashboard');
      } else {
        setMessage({ type: 'error', text: t('auth.login_failed') });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: t('auth.login_failed') });
    } finally {
      setSubmitting(false);
    }
  }

  const voiceCommands = {
    [t('voice_commands.set_email')]: (email: string) => setEmail(email),
    [t('voice_commands.set_password')]: (password: string) => setPassword(password),
    [t('voice_commands.set_name')]: (name: string) => setName(name),
    [t('voice_commands.switch_to_login')]: () => setMode('login'),
    [t('voice_commands.switch_to_register')]: () => setMode('register'),
    [t('voice_commands.login')]: login,
    [t('voice_commands.register')]: register,
    [t('voice_commands.go_home')]: () => navigate('/'),
  };

  // Voice assistant handled globally in navbar

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="max-w-6xl mx-auto px-6 py-8 flex justify-between items-center">
          <a href="/" className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900" aria-label={t('aria.back_to_home')}>
            <Logo size={32} withWordmark />
          </a>
          {/* Language switcher available in navbar */}
      </header>

      <main className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="order-2 lg:order-1">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('auth.welcome')}</h1>
            <p className="text-slate-600 mb-4">{t('auth.welcome_subtitle')}</p>
            <AuthBar 
              email={email} setEmail={setEmail} 
              password={password} setPassword={setPassword} 
              name={name} setName={setName} 
              mode={mode} setMode={(newMode) => { setMode(newMode); setMessage(null); }} 
              login={login} register={register} 
              submitting={submitting} message={message} 
            />
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-xl">
              <div className="relative p-6">
                <div className="h-64 sm:h-80 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-slate-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl">🔑</div>
                    <div className="mt-2 text-slate-700">{t('auth.secure_access_title')}</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <div className="rounded-lg border border-slate-200 p-3 bg-white">{t('auth.feature_1')}</div>
                  <div className="rounded-lg border border-slate-200 p-3 bg-white">{t('auth.feature_2')}</div>
                  <div className="rounded-lg border border-slate-200 p-3 bg-white">{t('auth.feature_3')}</div>
                  <div className="rounded-lg border border-slate-200 p-3 bg-white">{t('auth.feature_4')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Voice assistant UI available globally in navbar */}
    </div>
  );
}

export default Auth;
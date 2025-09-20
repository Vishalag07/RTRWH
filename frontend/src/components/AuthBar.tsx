import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, setAuth } from '../services/api';
import { FiEye, FiMapPin, FiLoader } from 'react-icons/fi';
import { getCurrentLocation, getLocationErrorText, GeolocationError } from '../utils/geolocation';

interface AuthBarProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  name: string;
  setName: (name: string) => void;
  location: string;
  setLocation: (location: string) => void;
  mode: 'login' | 'register';
  setMode: (mode: 'login' | 'register') => void;
  login: () => void;
  register: () => void;
  submitting: boolean;
  message: { type: 'error' | 'success'; text: string } | null;
}

export function AuthBar({ email, setEmail, password, setPassword, name, setName, location, setLocation, mode, setMode, login, register, submitting, message }: AuthBarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [showPassword, setShowPassword] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  useEffect(() => { setAuth(token) }, [token]);

  const emailValid = useMemo(() => /.+@.+\..+/.test(email.trim()), [email]);
  const passwordValid = useMemo(() => password.length >= 8, [password]);
  const nameValid = useMemo(() => mode === 'login' || name.trim().length > 0, [name, mode]);
  const formValid = emailValid && passwordValid && nameValid;

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
  }

  async function handleFetchLocation() {
    setIsFetchingLocation(true);
    try {
      const locationData = await getCurrentLocation();
      setLocation(locationData.city);
    } catch (error) {
      const errorMessage = getLocationErrorText(error as GeolocationError);
      // You could show a toast or error message here
      console.error('Location fetch error:', errorMessage);
    } finally {
      setIsFetchingLocation(false);
    }
  }

  if (token) {
    return (
      <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md border border-slate-200 rounded-full px-3 py-1 shadow-sm">
        <span className="text-sm text-slate-600">{t('auth.signed_in')}</span>
        <button
          className="text-sm px-3 py-1 rounded-full bg-slate-800 text-white hover:bg-slate-900 transition"
          onClick={logout}
          aria-label={t('aria.logout')}
        >
          {t('auth.logout')}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl">
      <div className="relative rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-10 pointer-events-none" />
        <div className="relative p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2 p-1 bg-slate-100 rounded-full">
              <button
                id="login-toggle-btn"
                className={`px-3 py-1 text-sm rounded-full transition ${mode === 'login' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
                onClick={() => setMode('login')}
                aria-pressed={mode === 'login'}
              >
                {t('auth.login')}
              </button>
              <button
                id="register-toggle-btn"
                className={`px-3 py-1 text-sm rounded-full transition ${mode === 'register' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
                onClick={() => setMode('register')}
                aria-pressed={mode === 'register'}
              >
                Sign Up
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-sm text-slate-700 mb-1" htmlFor="email">{t('auth.email')}</label>
              <input
                id="email"
                className={`w-full rounded-lg border px-3 py-2 outline-none transition focus:ring-2 focus:ring-blue-500 ${email && !emailValid ? 'border-red-400 focus:ring-red-500' : 'border-slate-300'}`}
                placeholder={t('auth.email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                aria-label={t('aria.email')}
                aria-invalid={!!email && !emailValid}
              />
              {email && !emailValid && (
                <p className="mt-1 text-xs text-red-600">{t('auth.email_invalid')}</p>
              )}
            </div>

            {mode === 'register' && (
              <div className="sm:col-span-2">
                <label className="block text-sm text-slate-700 mb-1" htmlFor="name">{t('auth.name')}</label>
                <input
                  id="name"
                  className={`w-full rounded-lg border px-3 py-2 outline-none transition focus:ring-2 focus:ring-blue-500 ${name && !nameValid ? 'border-red-400 focus:ring-red-500' : 'border-slate-300'}`}
                  placeholder={t('auth.name_placeholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-label={t('aria.name')}
                  aria-invalid={!!name && !nameValid}
                />
                {name && !nameValid && (
                  <p className="mt-1 text-xs text-red-600">{t('auth.name_required')}</p>
                )}
              </div>
            )}

            {mode === 'register' && (
              <div className="sm:col-span-2">
                <label className="block text-sm text-slate-700 mb-1" htmlFor="location">City</label>
                <div className="relative">
                  <input
                    id="location"
                    className="w-full rounded-lg border px-3 py-2 pr-12 outline-none transition focus:ring-2 focus:ring-blue-500 border-slate-300"
                    placeholder="Enter your city"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    aria-label="City"
                  />
                  <button
                    type="button"
                    onClick={handleFetchLocation}
                    disabled={isFetchingLocation}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Auto-fetch location"
                  >
                    {isFetchingLocation ? (
                      <FiLoader className="w-4 h-4 animate-spin" />
                    ) : (
                      <FiMapPin className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500">Optional: Click the location icon to auto-detect your city</p>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="block text-sm text-slate-700 mb-1" htmlFor="password">{t('auth.password')}</label>
              <div className="relative">
                <input
                  id="password"
                  className={`w-full rounded-lg border pr-10 px-3 py-2 outline-none transition focus:ring-2 focus:ring-blue-500 ${password && !passwordValid ? 'border-red-400 focus:ring-red-500' : 'border-slate-300'}`}
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-label={t('aria.password')}
                  aria-invalid={!!password && !passwordValid}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-2 flex items-center px-2 text-slate-500 hover:text-slate-700"
                  aria-label="Show password while pressed"
                  onMouseDown={() => setShowPassword(true)}
                  onMouseUp={() => setShowPassword(false)}
                  onMouseLeave={() => setShowPassword(false)}
                  onTouchStart={() => setShowPassword(true)}
                  onTouchEnd={() => setShowPassword(false)}
                  onTouchCancel={() => setShowPassword(false)}
                >
                  <FiEye className="w-4 h-4" />
                </button>
              </div>
              {password && !passwordValid && (
                <p className="mt-1 text-xs text-red-600">{t('auth.password_invalid')}</p>
              )}
            </div>
          </div>

          {message && (
            <div className={`mt-3 text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message.text}</div>
          )}

          <div className="mt-4 flex items-center justify-end gap-2">
            {mode === 'register' ? (
              <button
                disabled={!formValid || submitting}
                className={`px-4 py-2 rounded-lg text-white transition shadow ${(!formValid || submitting) ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}`}
                onClick={register}
                aria-label={t('aria.create_account')}
              >
                {submitting ? t('auth.creating_account') : t('auth.create_account')}
              </button>
            ) : (
              <button
                disabled={!formValid || submitting}
                className={`px-4 py-2 rounded-lg text-white transition shadow ${(!formValid || submitting) ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}`}
                onClick={login}
                aria-label={t('aria.sign_in')}
              >
                {submitting ? t('auth.signing_in') : t('auth.sign_in')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
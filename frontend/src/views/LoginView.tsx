import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Rocket, Mail, Lock, User } from 'lucide-react';

import { login, register } from '../api/auth';
import { Starfield, AmbientGlow } from '../components';

const INPUT_CLASS =
  'w-full pl-12 pr-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all';

type ApiDetailItem = {
  msg?: string;
};

const getErrorMessage = (detail: unknown, fallback: string) => {
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (typeof item === 'object' && item ? (item as ApiDetailItem).msg : ''))
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join('; ');
    }
  }

  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  return fallback;
};

export default function LoginView() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = new URLSearchParams(location.search).get('redirect') || '/projects';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isRegister) {
        await register({ email, username, password });
        setSuccess('\u6ce8\u518c\u6210\u529f\uff0c\u6b63\u5728\u81ea\u52a8\u767b\u5f55...');
        await new Promise((resolve) => setTimeout(resolve, 1000));

        try {
          await login(email, password);
        } catch (loginError: any) {
          setError(
            getErrorMessage(
              loginError.response?.data?.detail,
              '\u6ce8\u518c\u6210\u529f\uff0c\u8bf7\u624b\u52a8\u767b\u5f55\u3002'
            )
          );
          setIsRegister(false);
          return;
        }
      } else {
        await login(email, password);
      }

      navigate(redirectTo);
    } catch (err: any) {
      setError(
        getErrorMessage(
          err.response?.data?.detail,
          isRegister ? '\u6ce8\u518c\u5931\u8d25' : '\u767b\u5f55\u5931\u8d25'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex items-center justify-center px-4 relative overflow-hidden">
      <Starfield />
      <AmbientGlow />

      <div className="glass-panel rounded-2xl p-8 md:p-10 w-full max-w-md relative z-10 shadow-[0_20px_60px_rgba(78,168,217,0.15)]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/30 mb-4 glow-primary">
            <Rocket size={32} className="text-primary" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-primary italic font-headline mb-2">
            MARTIAN BIOLAB AI
          </h1>
          <p className="text-sm text-on-surface-variant font-headline tracking-wider uppercase">
            {isRegister ? '\u521b\u5efa\u8d26\u6237' : '\u767b\u5f55'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-2 font-headline tracking-wide">
                {'\u7528\u6237\u540d'}
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50"
                />
                <input
                  type="text"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-2 font-headline tracking-wide">
              {'\u90ae\u7bb1'}
            </label>
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50"
              />
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-2 font-headline tracking-wide">
              {'\u5bc6\u7801'}
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50"
              />
              <input
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-error-container/20 border border-error/30 rounded-lg">
              <p className="text-error text-sm font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-500/15 border border-green-400/40 rounded-lg">
              <p className="text-green-300 text-sm font-medium">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-6 rounded-lg font-headline font-bold tracking-wide uppercase text-sm transition-all ${
              loading
                ? 'bg-surface-variant text-on-surface-variant/50 cursor-not-allowed'
                : 'bg-primary-container text-on-primary hover:bg-primary hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] glow-primary'
            }`}
          >
            {loading
              ? (isRegister ? '\u6ce8\u518c\u4e2d...' : '\u767b\u5f55\u4e2d...')
              : (isRegister ? '\u6ce8\u518c' : '\u767b\u5f55')}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
                setSuccess('');
              }}
              className="text-sm text-on-surface-variant hover:text-primary transition-colors"
            >
              {isRegister
                ? '\u5df2\u6709\u8d26\u6237\uff1f\u53bb\u767b\u5f55'
                : '\u6ca1\u6709\u8d26\u6237\uff1f\u53bb\u6ce8\u518c'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

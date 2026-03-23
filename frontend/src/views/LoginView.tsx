import { useState } from 'react';
import { login, register } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import { Starfield, AmbientGlow } from '../components';
import { Rocket, Mail, Lock, User } from 'lucide-react';

const INPUT_CLASS = "w-full pl-12 pr-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all";

export default function LoginView() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register({ email, username, password });
        await login(email, password);
      } else {
        await login(email, password);
      }
      navigate('/projects');
    } catch (err: any) {
      setError(err.response?.data?.detail || (isRegister ? '注册失败' : '登录失败'));
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
            {isRegister ? '创建新账户' : '登录系统'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-2 font-headline tracking-wide">
                用户名
              </label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
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
              邮箱地址
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
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
              密码
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-error-container/20 border border-error/30 rounded-lg">
              <p className="text-error text-sm font-medium">⚠️ {error}</p>
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
            {loading ? (isRegister ? '注册中...' : '登录中...') : (isRegister ? '注册账户' : '登录系统')}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-sm text-on-surface-variant hover:text-primary transition-colors"
            >
              {isRegister ? '已有账户？立即登录' : '没有账户？立即注册'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

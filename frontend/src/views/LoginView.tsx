import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Rocket, Mail, Lock, User } from "lucide-react";
import { login, register } from "../api/auth";
import { Starfield, AmbientGlow } from "../components";
import { useLocale } from "../i18n/context";

const INPUT_CLASS =
  "w-full pl-12 pr-4 py-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl text-on-surface placeholder:text-muted/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-body";

type ApiDetailItem = {
  msg?: string;
};

const getErrorMessage = (detail: unknown, fallback: string) => {
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (typeof item === "object" && item ? (item as ApiDetailItem).msg : ""))
      .filter(Boolean);
    if (messages.length > 0) return messages.join("; ");
  }
  if (typeof detail === "string" && detail.trim()) return detail;
  return fallback;
};

export default function LoginView() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = new URLSearchParams(location.search).get("redirect") || "/projects";
  const { locale } = useLocale();
  const isZh = locale === "zh";

  const text = isZh
    ? {
      createAccount: "创建账户",
      signIn: "登录",
      username: "用户名",
      email: "邮箱",
      password: "密码",
      registering: "注册中...",
      loggingIn: "登录中...",
      register: "注册",
      hasAccount: "已有账户？去登录",
      noAccount: "没有账户？去注册",
      registerSuccess: "注册成功，正在自动登录...",
      registerSuccessManual: "注册成功，请手动登录。",
      registerFailed: "注册失败",
      loginFailed: "登录失败",
    }
    : {
      createAccount: "Create Account",
      signIn: "Sign In",
      username: "Username",
      email: "Email",
      password: "Password",
      registering: "Registering...",
      loggingIn: "Signing in...",
      register: "Register",
      hasAccount: "Already have an account? Sign in",
      noAccount: "No account? Register",
      registerSuccess: "Registration succeeded. Signing in...",
      registerSuccessManual: "Registration succeeded. Please sign in manually.",
      registerFailed: "Registration failed",
      loginFailed: "Sign in failed",
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isRegister) {
        await register({ email, username, password });
        setSuccess(text.registerSuccess);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        try {
          await login(email, password);
        } catch (loginError: any) {
          setError(getErrorMessage(loginError.response?.data?.detail, text.registerSuccessManual));
          setIsRegister(false);
          return;
        }
      } else {
        await login(email, password);
      }

      navigate(redirectTo);
    } catch (err: any) {
      setError(getErrorMessage(err.response?.data?.detail, isRegister ? text.registerFailed : text.loginFailed));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex items-center justify-center px-4 relative overflow-hidden">
      <Starfield />
      <AmbientGlow />

      <div className="glass-panel p-8 md:p-10 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/30 mb-4 glow-primary">
            <Rocket size={32} className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-[0.1em] text-primary font-headline mb-2 uppercase">
            MARTIAN BIOLAB AI
          </h1>
          <p className="text-sm text-on-surface-variant font-headline tracking-wider uppercase">
            {isRegister ? text.createAccount : text.signIn}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-2 font-headline tracking-wide">
                {text.username}
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
              {text.email}
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
              {text.password}
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
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
            className={`w-full py-3 px-6 rounded-full font-headline font-bold tracking-[0.1em] uppercase text-sm transition-all ${
              loading
                ? "bg-[rgba(255,255,255,0.05)] text-muted cursor-not-allowed"
                : "bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 hover:shadow-[0_0_24px_rgba(0,229,255,0.3)] active:scale-[0.98]"
            }`}
          >
            {loading ? (isRegister ? text.registering : text.loggingIn) : (isRegister ? text.register : text.signIn)}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
                setSuccess("");
              }}
              className="text-sm text-on-surface-variant hover:text-primary transition-colors"
            >
              {isRegister ? text.hasAccount : text.noAccount}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

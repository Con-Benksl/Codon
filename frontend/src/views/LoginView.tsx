import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, User } from "lucide-react";
import { login, register } from "../api/auth";
import { DnaParticles } from "../components";
import { useLocale } from "../i18n/context";

const INPUT_CLASS =
  "w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg text-text placeholder:text-text-dim focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all text-sm";

type ApiDetailItem = { msg?: string };

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
  const { t } = useLocale();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isRegister) {
        await register({ email, username, password });
        setSuccess(t("login.registerSuccess"));
        await new Promise((resolve) => setTimeout(resolve, 1000));
        try {
          await login(email, password);
        } catch (loginError: any) {
          setError(getErrorMessage(loginError.response?.data?.detail, t("login.registerSuccessManual")));
          setIsRegister(false);
          return;
        }
      } else {
        await login(email, password);
      }
      navigate(redirectTo);
    } catch (err: any) {
      setError(getErrorMessage(err.response?.data?.detail, isRegister ? t("login.registerFailed") : t("login.loginFailed")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 relative overflow-hidden">
      <DnaParticles opacity={0.08} particleCount={1000} />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-primary text-3xl mb-3">◇</div>
          <h1 className="text-2xl font-headline font-semibold tracking-wide text-text">
            CODON
          </h1>
          <p className="text-sm text-text-muted mt-2">
            {isRegister ? t("login.createAccount") : t("login.signIn")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                {t("login.username")}
              </label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
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
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              {t("login.email")}
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
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
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              {t("login.password")}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
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
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg">
              <p className="text-danger text-xs">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
              <p className="text-success text-xs">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-medium text-sm transition-colors ${
              loading
                ? "bg-card text-text-muted cursor-not-allowed"
                : "bg-primary text-bg hover:bg-primary/90"
            }`}
          >
            {loading
              ? isRegister ? t("login.registering") : t("login.loggingIn")
              : isRegister ? t("login.register") : t("login.signIn")}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(""); setSuccess(""); }}
              className="text-xs text-text-muted hover:text-primary transition-colors"
            >
              {isRegister ? t("login.hasAccount") : t("login.noAccount")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

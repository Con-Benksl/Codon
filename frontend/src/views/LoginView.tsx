import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, User } from "lucide-react";
import { register } from "../api/auth";
import { useAuth } from "../auth/context";
import { useLocale } from "../i18n/context";
import { motion } from "motion/react";
import { viewTransition } from "../lib/motion";

const INPUT_CLASS =
  "w-full pl-14 pr-4 py-4 bg-card border border-white/15 rounded-xl text-text placeholder:text-text-dim focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-lg";

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
  const { signIn } = useAuth();
  const redirectFromQuery = new URLSearchParams(location.search).get("redirect");
  const redirectTo =
    redirectFromQuery && redirectFromQuery.startsWith("/") && !redirectFromQuery.startsWith("//")
      ? redirectFromQuery
      : "/projects";
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
          await signIn(email, password);
        } catch (loginError: any) {
          setError(getErrorMessage(loginError.response?.data?.detail, t("login.registerSuccessManual")));
          setIsRegister(false);
          return;
        }
      } else {
        await signIn(email, password);
      }
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      setError(getErrorMessage(err.response?.data?.detail, isRegister ? t("login.registerFailed") : t("login.loginFailed")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-bg flex items-center justify-center px-6 relative overflow-hidden"
    >
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-12">
          <div className="text-primary text-5xl mb-4 leading-none">◆</div>
          <h1 className="text-4xl font-headline font-semibold tracking-wider text-text">
            CODON
          </h1>
          <p className="text-lg text-text-muted mt-3">
            {isRegister ? t("login.createAccount") : t("login.signIn")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isRegister && (
            <div>
              <label className="block text-base font-medium text-text-muted mb-2">
                {t("login.username")}
              </label>
              <div className="relative">
                <User size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-text-dim" />
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
            <label className="block text-base font-medium text-text-muted mb-2">
              {t("login.email")}
            </label>
            <div className="relative">
              <Mail size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-text-dim" />
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
            <label className="block text-base font-medium text-text-muted mb-2">
              {t("login.password")}
            </label>
            <div className="relative">
              <Lock size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-text-dim" />
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
            <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl">
              <p className="text-danger text-base">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-success/10 border border-success/20 rounded-xl">
              <p className="text-success text-base">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-colors ${
              loading
                ? "bg-card text-text-muted cursor-not-allowed"
                : "bg-primary text-bg hover:bg-primary/90"
            }`}
          >
            {loading
              ? isRegister ? t("login.registering") : t("login.loggingIn")
              : isRegister ? t("login.register") : t("login.signIn")}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(""); setSuccess(""); }}
              className="text-base text-text-muted hover:text-primary transition-colors"
            >
              {isRegister ? t("login.hasAccount") : t("login.noAccount")}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

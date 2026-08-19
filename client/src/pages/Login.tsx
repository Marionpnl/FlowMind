import { useState, type FormEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import AuthLayout, { AuthField } from "@/components/auth/AuthLayout";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const location = useLocation();
  const passwordReset = Boolean(
    (location.state as { passwordReset?: boolean } | null)?.passwordReset,
  );

  // On extrait uniquement la fonction "login" du store.
  // Ce composant ne se re-rendra QUE si "login" change (jamais en pratique),
  // pas à chaque changement de "user" ailleurs dans l'app — c'est l'intérêt
  // de sélectionner précisément ce dont on a besoin.
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/"); // redirection vers le Dashboard après connexion
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      mode="login"
      title="Content de te revoir"
      subtitle="Connecte-toi pour retrouver ta journée."
      error={error}
      submitting={submitting}
      submitLabel="Se connecter"
      submittingLabel="Connexion..."
      onSubmit={handleSubmit}
      footer={
        <p className="mt-4 text-center text-sm text-black/70 text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link to="/register" className="text-flowday hover:underline">
            Créer un compte
          </Link>
        </p>
      }
    >
      {passwordReset && (
        <p className="rounded-lg bg-flowday-bg px-3 py-2 text-xs text-flowday">
          Mot de passe mis à jour — connecte-toi avec ton nouveau mot de passe.
        </p>
      )}
      <AuthField
        label="Adresse e-mail"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="marion@exemple.ch"
        Icon={Mail}
        autoComplete="email"
      />
      <div>
        <AuthField
          label="Mot de passe"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          Icon={Lock}
          autoComplete="current-password"
        />
        <Link
          to="/forgot-password"
          className="mt-2 block text-right text-xs text-black/70 hover:underline"
        >
          Mot de passe oublié ?
        </Link>
      </div>
    </AuthLayout>
  );
}

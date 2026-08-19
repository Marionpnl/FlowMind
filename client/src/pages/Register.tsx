import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import AuthLayout, { AuthField } from "@/components/auth/AuthLayout";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(name, email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'inscription");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      mode="register"
      title="Bienvenue"
      subtitle="Crée ton compte pour commencer."
      error={error}
      submitting={submitting}
      submitLabel="Créer mon compte"
      submittingLabel="Création..."
      onSubmit={handleSubmit}
      footer={
        <p className="mt-4 text-center text-sm text-black/70 text-muted-foreground">
          Déjà un compte ?{" "}
          <Link to="/login" className="text-flowday hover:underline">
            Se connecter
          </Link>
        </p>
      }
    >
      <AuthField
        label="Prénom"
        type="text"
        value={name}
        onChange={setName}
        placeholder="Marion"
        Icon={User}
        autoComplete="given-name"
      />
      <AuthField
        label="Adresse e-mail"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="marion@exemple.ch"
        Icon={Mail}
        autoComplete="email"
      />
      <AuthField
        label="Mot de passe"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="••••••••"
        Icon={Lock}
        autoComplete="new-password"
      />
    </AuthLayout>
  );
}

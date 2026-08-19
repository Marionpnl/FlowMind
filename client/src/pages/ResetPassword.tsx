import { useState, type FormEvent } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import AuthLayout, { AuthField } from "@/components/auth/AuthLayout";

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    if (!token) {
      setError("Lien de réinitialisation invalide.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(token, password);
      navigate("/login", { state: { passwordReset: true } });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la réinitialisation",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      mode="standalone"
      title="Nouveau mot de passe"
      subtitle="Choisis un nouveau mot de passe pour ton compte."
      error={error}
      submitting={submitting}
      submitLabel="Réinitialiser"
      submittingLabel="Enregistrement..."
      onSubmit={handleSubmit}
      footer={
        <p className="mt-4 text-center text-sm text-black/70 text-muted-foreground">
          <Link to="/login" className="text-flowday hover:underline">
            Retour à la connexion
          </Link>
        </p>
      }
    >
      <AuthField
        label="Nouveau mot de passe"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="••••••••"
        Icon={Lock}
        autoComplete="new-password"
      />
      <AuthField
        label="Confirmer le mot de passe"
        type="password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        placeholder="••••••••"
        Icon={Lock}
        autoComplete="new-password"
      />
    </AuthLayout>
  );
}

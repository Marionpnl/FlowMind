import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import AuthLayout, { AuthField } from "@/components/auth/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const forgotPassword = useAuthStore((s) => s.forgotPassword);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await forgotPassword(email);
      // Toujours le même écran de confirmation, que l'email existe ou non
      // — le backend ne révèle jamais quels comptes existent.
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la demande",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <AuthLayout
        mode="standalone"
        title="Vérifie ta boîte mail"
        subtitle={`Si un compte existe pour ${email}, un lien de réinitialisation vient d'être envoyé.`}
        hideForm
        footer={
          <p className="text-center text-sm text-black/70 text-muted-foreground">
            <Link to="/login" className="text-flowday hover:underline">
              Retour à la connexion
            </Link>
          </p>
        }
      >
        <></>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      mode="standalone"
      title="Mot de passe oublié"
      subtitle="Indique ton email, on t'envoie un lien pour le réinitialiser."
      error={error}
      submitting={submitting}
      submitLabel="Envoyer le lien"
      submittingLabel="Envoi..."
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
        label="Adresse e-mail"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="marion@exemple.ch"
        Icon={Mail}
        autoComplete="email"
      />
    </AuthLayout>
  );
}

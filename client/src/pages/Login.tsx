import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // On extrait uniquement la fonction "login" du store.
  // Ce composant ne se re-rendra QUE si "login" change (jamais en pratique),
  // pas à chaque changement de "user" ailleurs dans l'app — c'est l'intérêt
  // de sélectionner précisément ce dont on a besoin.
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/"); // redirection vers le Dashboard après connexion
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Connexion</h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded p-2"
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded p-2"
          required
        />
        <button
          type="submit"
          className="w-full bg-black text-white rounded p-2"
        >
          Se connecter
        </button>
        <p className="text-sm text-center">
          Pas de compte ?{" "}
          <Link to="/register" className="underline">
            S'inscrire
          </Link>
        </p>
      </form>
    </div>
  );
}

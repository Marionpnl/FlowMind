import { Resend } from "resend";

// Sans domaine vérifié sur Resend, l'envoi ne fonctionne que vers l'adresse
// email du compte Resend lui-même — limitation acceptée pour l'instant.
// À lever le jour où un domaine est configuré et vérifié.
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  // Instancié à l'intérieur de la fonction (pas au niveau racine du fichier) sinon
  // ce module s'exécuterait avant que dotenv.config() ait chargé les variables d'env.
  //
  await resend.emails.send({
    from: "FlowMind <onboarding@resend.dev>",
    to,
    subject: "Réinitialisation de ton mot de passe FlowMind",
    html: `
      <p>Tu as demandé à réinitialiser ton mot de passe FlowMind.</p>
      <p><a href="${resetUrl}">Clique ici pour choisir un nouveau mot de passe</a></p>
      <p>Ce lien expire dans 1 heure. Si tu n'es pas à l'origine de cette demande, ignore cet email.</p>
    `,
  });
}

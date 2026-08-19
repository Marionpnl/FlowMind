// Aucun fournisseur d'e-mail n'est configuré pour l'instant (même limitation
// que le "résumé quotidien par e-mail" désactivé dans Paramètres. En attendant, on logue le lien côté serveur au lieu de
// l'envoyer réellement. À remplacer par un vrai envoi (Resend, Nodemailer...)
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<void> {
  console.log(
    `[emailService] Lien de réinitialisation de mot de passe pour ${to} : ${resetUrl}`,
  );
}

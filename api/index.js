// Simple base de données en mémoire pour le prototype (à remplacer par une vraie base plus tard)
let users = []; 

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ status: "online", message: "API active." });
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const { action, nom, email, password, imei } = body;

      // 1. CAS DE LA VÉRIFICATION IMEI
      if (imei) {
        const estVole = imei.endsWith('999');
        return res.status(200).json({
          success: true,
          imei,
          isStolen: estVole,
          message: estVole ? "ALERTE : Appareil volé." : "Appareil sécurisé."
        });
      }

      // 2. CAS DE L'INSCRIPTION
      if (action === 'register') {
        if (!email || !password || !nom) {
          return res.status(400).json({ success: false, error: 'Tous les champs sont obligatoires.' });
        }
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
          return res.status(400).json({ success: false, error: 'Cet e-mail est déjà utilisé.' });
        }
        users.push({ nom, email, password });
        return res.status(200).json({ success: true, message: 'Inscription réussie.' });
      }

      // 3. CAS DE LA CONNEXION
      if (action === 'login') {
        if (!email || !password) {
          return res.status(400).json({ success: false, error: 'E-mail et mot de passe requis.' });
        }
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) {
          return res.status(401).json({ success: false, error: 'Identifiants incorrects ou compte inexistant. Veuillez vous inscrire.' });
        }
        return res.status(200).json({ success: true, message: 'Connexion réussie.', nom: user.nom });
      }

      // 4. CAS DU MOT DE PASSE OUBLIÉ
      if (action === 'forgot-password') {
        if (!email) {
          return res.status(400).json({ success: false, error: 'E-mail requis.' });
        }
        const user = users.find(u => u.email === email);
        if (!user) {
          return res.status(404).json({ success: false, error: 'Aucun compte associé à cet e-mail.' });
        }
        
        // TODO: Ici vous brancherez un service comme Nodemailer ou SendGrid pour envoyer le vrai mail.
        // Pour l'instant, on simule l'envoi réussi vers le Gmail de l'utilisateur.
        return res.status(200).json({ 
          success: true, 
          message: `Un lien de réinitialisation a été envoyé à ${email}.` 
        });
      }

      return res.status(400).json({ success: false, error: 'Action non reconnue.' });

    } catch (error) {
      return res.status(500).json({ success: false, error: 'Erreur interne du serveur.' });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}

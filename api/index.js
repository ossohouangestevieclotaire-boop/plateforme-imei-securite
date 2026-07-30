export default async function handler(req, res) {
  // Configuration des en-têtes CORS pour autoriser l'application mobile à appeler l'API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Réponse immédiate pour les requêtes de pré-contrôle (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Permet aussi de tester rapidement l'API depuis un navigateur web (GET)
  if (req.method === 'GET') {
    return res.status(200).json({
      status: "online",
      message: "L'API de la plateforme de sécurité IMEI est opérationnelle."
    });
  }

  // Traitement principal de la requête de l'application (POST)
  if (req.method === 'POST') {
    try {
      const { imei } = req.body || {};

      if (!imei || imei.length !== 15) {
        return res.status(400).json({
          success: false,
          error: 'Numéro IMEI invalide ou manquant (15 chiffres requis).'
        });
      }

      // --- LOGIQUE DE VÉRIFICATION DU STATUT DE L'APPAREIL ---
      // TODO: Remplacez cette simulation par la connexion à votre base de données (ex: MongoDB, Supabase, PostgreSQL)
      // Exemple : const appareil = await db.collection('imei_table').findOne({ imei });
      
      // Simulation pour le test : 
      // Si l'IMEI se termine par "999", on simule qu'il est volé (isStolen: true). Sinon, il est sécurisé.
      const estVole = imei.endsWith('999');

      return res.status(200).json({
        success: true,
        imei: imei,
        isStolen: estVole,
        message: estVole ? "ALERTE : Cet appareil est signalé volé." : "Appareil authentifié et sécurisé."
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur lors du traitement.'
      });
    }
  }

  // Si une autre méthode HTTP non gérée est utilisée
  return.status(405).json({ error: 'Méthode non autorisée' });
}

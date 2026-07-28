export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method } = req;
  const action = req.query.action;

  if (!global.usersMemory) global.usersMemory = [];
  if (!global.devicesMemory) global.devicesMemory = [];

  switch (method) {
    case 'POST':
      if (action === 'register') {
        const { username, email, password } = req.body;
        if (!username || !email || !password) return res.status(400).json({ error: 'Tous les champs sont requis.' });
        
        if (global.usersMemory.find(u => u.email === email)) {
          return res.status(409).json({ error: 'Cet e-mail est déjà associé à un compte existant.' });
        }
        if (global.usersMemory.find(u => u.username === username)) {
          return res.status(409).json({ error: 'Ce nom d\'utilisateur est déjà pris.' });
        }

        global.usersMemory.push({ username, email, password });
        return res.status(201).json({ message: 'Inscription réussie.' });
      }

      if (action === 'login') {
        const { username, password } = req.body;
        const user = global.usersMemory.find(u => u.username === username && u.password === password);
        if (!user) return res.status(401).json({ error: 'Identifiants incorrects ou compte non existant.' });
        return res.status(200).json({ message: 'Connexion réussie.' });
      }

      if (action === 'admin-login') {
        const { adminUser, adminPass } = req.body;
        if (adminUser === 'admin' && adminPass === 'SecuriteAdmin2026*') {
          return res.status(200).json({ message: 'Accès administrateur autorisé.' });
        }
        return res.status(401).json({ error: 'Identifiants administrateur incorrects.' });
      }

      if (action === 'forgot-password') {
        const { email } = req.body;
        const user = global.usersMemory.find(u => u.email === email);
        if (!user) return res.status(404).json({ error: 'Aucun compte associé à cet e-mail.' });
        return res.status(200).json({ message: 'Un lien de réinitialisation sécurisé a été envoyé à ' + email });
      }

      const { imei, status, latitude, longitude, owner, lockScreen, blacklistImei } = req.body;
      if (!imei) return res.status(400).json({ error: 'L\'IMEI est obligatoire.' });

      let deviceIndex = global.devicesMemory.findIndex(d => d.imei === imei);
      const currentTime = new Date().toISOString();

      if (deviceIndex !== -1) {
        let existingDevice = global.devicesMemory[deviceIndex];
        let history = existingDevice.history || [];

        // Si de nouvelles coordonnées valides sont fournies, on les ajoute à l'historique
        if (latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null) {
          history.unshift({ latitude, longitude, time: currentTime });
          // Garder uniquement les 10 dernières positions
          if (history.length > 10) history.pop();
        }

        global.devicesMemory[deviceIndex] = {
          ...existingDevice,
          status: status || existingDevice.status,
          latitude: latitude !== undefined ? latitude : existingDevice.latitude,
          longitude: longitude !== undefined ? longitude : existingDevice.longitude,
          lockScreen: lockScreen !== undefined ? lockScreen : existingDevice.lockScreen,
          blacklistImei: blacklistImei !== undefined ? blacklistImei : existingDevice.blacklistImei,
          history: history,
          lastUpdate: currentTime
        };
        return res.status(200).json({ message: 'Appareil mis à jour.', device: global.devicesMemory[deviceIndex] });
      } else {
        let history = [];
        if (latitude !== null && longitude !== null) {
          history.push({ latitude, longitude, time: currentTime });
        }
        const newDevice = {
          imei,
          owner: owner || 'Inconnu',
          status: status || 'ACTIF',
          latitude: latitude || null,
          longitude: longitude || null,
          lockScreen: lockScreen || false,
          blacklistImei: blacklistImei || false,
          history: history,
          lastUpdate: currentTime
        };
        global.devicesMemory.push(newDevice);
        return res.status(201).json({ message: 'Appareil enregistré.', device: newDevice });
      }

    case 'GET':
      const { imei: queryImei, userOwner } = req.query;
      if (queryImei) {
        const device = global.devicesMemory.find(d => d.imei === queryImei);
        if (!device) return res.status(404).json({ error: 'Appareil introuvable.' });
        return res.status(200).json(device);
      }
      if (userOwner) {
        const userDevices = global.devicesMemory.filter(d => d.owner === userOwner);
        return res.status(200).json({ total: userDevices.length, devices: userDevices });
      }
      return res.status(200).json({ totalUsers: global.usersMemory.length, totalDevices: global.devicesMemory.length, devices: global.devicesMemory });

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Méthode ${method} non autorisée`);
  }
}

let usersDB = [];    
let devicesDB = [];  

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

  switch (method) {
    case 'POST':
      if (action === 'register') {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Identifiants requis.' });
        if (usersDB.find(u => u.username === username)) return res.status(409).json({ error: 'Existe déjà.' });
        usersDB.push({ username, password });
        return res.status(201).json({ message: 'Inscription réussie.' });
      }

      if (action === 'login') {
        const { username, password } = req.body;
        const user = usersDB.find(u => u.username === username && u.password === password);
        if (!user) return res.status(401).json({ error: 'Identifiants incorrects.' });
        return res.status(200).json({ message: 'Connexion réussie.' });
      }

      const { imei, status, latitude, longitude, owner, lockScreen, blacklistImei } = req.body;
      if (!imei) return res.status(400).json({ error: 'L\'IMEI est obligatoire.' });

      let deviceIndex = devicesDB.findIndex(d => d.imei === imei);

      if (deviceIndex !== -1) {
        devicesDB[deviceIndex] = {
          ...devicesDB[deviceIndex],
          status: status || devicesDB[deviceIndex].status,
          latitude: latitude !== undefined ? latitude : devicesDB[deviceIndex].latitude,
          longitude: longitude !== undefined ? longitude : devicesDB[deviceIndex].longitude,
          lockScreen: lockScreen !== undefined ? lockScreen : devicesDB[deviceIndex].lockScreen,
          blacklistImei: blacklistImei !== undefined ? blacklistImei : devicesDB[deviceIndex].blacklistImei,
          lastUpdate: new Date().toISOString()
        };
        return res.status(200).json({ message: 'Appareil mis à jour.', device: devicesDB[deviceIndex] });
      } else {
        const newDevice = {
          imei,
          owner: owner || 'Inconnu',
          status: status || 'ACTIF',
          latitude: latitude || null,
          longitude: longitude || null,
          lockScreen: lockScreen || false,
          blacklistImei: blacklistImei || false,
          lastUpdate: new Date().toISOString()
        };
        devicesDB.push(newDevice);
        return res.status(201).json({ message: 'Appareil enregistré.', device: newDevice });
      }

    case 'GET':
      const { imei: queryImei, userOwner } = req.query;
      if (queryImei) {
        const device = devicesDB.find(d => d.imei === queryImei);
        if (!device) return res.status(404).json({ error: 'Appareil introuvable.' });
        return res.status(200).json(device);
      }
      if (userOwner) {
        const userDevices = devicesDB.filter(d => d.owner === userOwner);
        return res.status(200).json({ total: userDevices.length, devices: userDevices });
      }
      return res.status(200).json({ totalUsers: usersDB.length, totalDevices: devicesDB.length, devices: devicesDB });

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Méthode ${method} non autorisée`);
  }
}

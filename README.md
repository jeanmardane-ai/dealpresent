# 🏢 DealPresent

**Générez des présentations immobilières premium en 2 minutes.**

## 🚀 Installation & Lancement

### 1. Installer les dépendances

```bash
cd backend
npm install
```

### 2. Lancer le serveur

```bash
npm start
```

Le serveur démarre sur **http://localhost:3500**

### 3. Configurer l'API IA

Ouvrez http://localhost:3500 dans votre navigateur et :

1. Entrez votre clé API (Claude ou OpenAI)
2. Sélectionnez le provider
3. Cliquez sur "Enregistrer la configuration"

**Où trouver une clé API ?**
- **Claude (Anthropic)** : https://console.anthropic.com/settings/keys
- **OpenAI** : https://platform.openai.com/api-keys

## 📋 Utilisation

1. Remplissez le formulaire avec les infos du bien
2. Ajoutez les unités locatives (loyers, surfaces)
3. Cliquez sur "Générer la présentation"
4. Récupérez l'URL à partager !

## 💰 Coûts

**API Claude Sonnet 4.5 :**
- ~0,02-0,05€ par génération
- À 1€/présentation → marge de 0,95€

**API GPT-4o :**
- ~0,03-0,08€ par génération
- À 1€/présentation → marge de 0,92€

## 📁 Structure

```
dealpresent/
├── backend/          # API Node.js
├── frontend/         # Interface web
├── generated/        # Pages HTML générées
└── config/           # Configuration API
```

## 🔧 Configuration avancée

Éditez `config/config.json` :

```json
{
  "apiKey": "votre-clé-api",
  "provider": "anthropic",
  "model": "claude-sonnet-4-5"
}
```

**Modèles disponibles :**
- Anthropic: `claude-sonnet-4-5`, `claude-haiku-4-5`, `claude-opus-4-6`
- OpenAI: `gpt-4o`, `gpt-4o-mini`

## 🌐 Déploiement

### Option 1 : VPS (Hostinger, etc.)

```bash
# Installer Node.js si nécessaire
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Cloner le projet
cd /var/www
git clone <votre-repo>

# Installer et lancer
cd dealpresent/backend
npm install
npm start
```

### Option 2 : Docker

```dockerfile
FROM node:20
WORKDIR /app
COPY backend/ ./
RUN npm install
EXPOSE 3500
CMD ["npm", "start"]
```

## 📊 API Endpoints

- `GET /` — Interface web
- `GET /api/health` — Status
- `GET /api/config` — Config actuelle
- `POST /api/config` — Mettre à jour la config
- `POST /api/generate` — Générer une présentation
- `GET /api/presentations` — Lister les présentations
- `GET /deals/:filename` — Accéder à une présentation

## 🐛 Debug

**L'API ne répond pas ?**
- Vérifiez que le serveur tourne : `ps aux | grep node`
- Logs : consultez la console où tourne `npm start`

**La clé API ne fonctionne pas ?**
- Vérifiez qu'elle est valide sur console.anthropic.com ou platform.openai.com
- Assurez-vous d'avoir des crédits

**La génération échoue ?**
- Vérifiez la connexion internet
- Essayez avec un autre modèle (haiku au lieu de sonnet)

## 📝 TODO

- [ ] Authentification utilisateurs
- [ ] Système de paiement Stripe
- [ ] Dashboard analytics
- [ ] Templates multiples
- [ ] Export PDF
- [ ] Custom domains per user

---

**Développé par Jean-Mardane 🤝**

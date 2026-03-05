const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3500;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/deals', express.static(path.join(__dirname, '../generated')));

// Upload configuration
const upload = multer({ dest: path.join(__dirname, '../uploads') });

// Load config (prioritize ENV vars for Railway deployment)
let config = {
  apiKey: process.env.API_KEY || process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY,
  provider: process.env.API_PROVIDER || 'openrouter',
  model: process.env.API_MODEL || 'anthropic/claude-sonnet-4-5'
};

// Fallback to config file if no env vars
if (!config.apiKey) {
  try {
    const fileConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/config.json'), 'utf8'));
    config = { ...config, ...fileConfig };
  } catch (e) {
    console.warn('No config file found and no ENV vars set');
  }
}

// Helper: Generate slug from address
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Helper: Call AI API to generate HTML
async function generateHTML(propertyData) {
  const accentColor = propertyData.accentColor || '#c8a45c';
  const customTitle = propertyData.customTitle || '';
  
  const prompt = `Tu es un expert en présentation immobilière. Génère une page HTML complète et professionnelle pour ce bien immobilier.

Données du bien:
${JSON.stringify(propertyData, null, 2)}

Instructions:
- Design premium et élégant, moderne
- Structure: Hero avec photo, barre de prix, sections (présentation, lots, rentabilité, projet)
- Calcule automatiquement: investissement total, revenus annuels, rendement brut %, ROI en années
- Inclus toutes les sections: description, lots détaillés avec cartes, rentabilité avec highlight du rendement, timeline du projet
- Design responsive, animations au scroll
- Retourne UNIQUEMENT le HTML complet (<!DOCTYPE html>... </html>), rien d'autre

PERSONNALISATION OBLIGATOIRE:
- Couleur d'accent: ${accentColor} (à utiliser pour boutons, highlights, accents)
${customTitle ? `- Ajoute en footer ou header: "${customTitle}"` : ''}

Template de référence: page style magazine immobilier, typographie Playfair Display + Inter, dark theme avec couleur accent personnalisée.`;

  const apiKey = config.apiKey;
  const apiProvider = config.provider || 'anthropic';

  if (!apiKey) {
    throw new Error('API key not configured');
  }

  if (apiProvider === 'anthropic') {
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: config.model || 'claude-sonnet-4-5',
      max_tokens: 16000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    }, {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    });

    return response.data.content[0].text;
  } else if (apiProvider === 'openai') {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: config.model || 'gpt-4o',
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: 16000
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  } else if (apiProvider === 'openrouter') {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: config.model || 'anthropic/claude-sonnet-4-5',
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: 16000
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://dealpresent.io',
        'X-Title': 'DealPresent'
      }
    });

    return response.data.choices[0].message.content;
  }

  throw new Error('Unsupported API provider');
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Admin: Get config status (without exposing the key)
app.get('/api/admin/config', (req, res) => {
  res.json({
    configured: !!config.apiKey,
    provider: config.provider || 'openrouter',
    model: config.model || 'anthropic/claude-sonnet-4-5'
  });
});

// Admin: Update config (password-protected)
app.post('/api/admin/config', (req, res) => {
  const adminPassword = req.headers['x-admin-password'];
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'dealpresent2026';
  
  if (adminPassword !== ADMIN_PASSWORD) {
    return res.status(403).json({ success: false, error: 'Non autorisé' });
  }
  
  const { apiKey, provider, model } = req.body;
  
  if (!apiKey) {
    return res.status(400).json({ success: false, error: 'Clé API manquante' });
  }
  
  // Update in-memory config
  config.apiKey = apiKey;
  config.provider = provider || 'openrouter';
  config.model = model || 'anthropic/claude-sonnet-4-5';
  
  // Save to file (for persistence across restarts)
  try {
    fs.mkdirSync(path.join(__dirname, '../config'), { recursive: true });
    fs.writeFileSync(
      path.join(__dirname, '../config/config.json'),
      JSON.stringify(config, null, 2)
    );
    res.json({ success: true, message: 'Configuration sauvegardée' });
  } catch (err) {
    console.error('Error saving config:', err);
    res.status(500).json({ success: false, error: 'Erreur de sauvegarde' });
  }
});

// Generate presentation
app.post('/api/generate', upload.single('photo'), async (req, res) => {
  try {
    const propertyData = {
      address: req.body.address,
      purchasePrice: parseFloat(req.body.purchasePrice),
      renovationCost: parseFloat(req.body.renovationCost) || 0,
      photo: req.file ? `/uploads/${req.file.filename}` : null,
      units: JSON.parse(req.body.units || '[]'),
      accentColor: req.body.accentColor || '#c8a45c',
      customTitle: req.body.customTitle || ''
    };

    // Calculate totals
    const totalInvestment = propertyData.purchasePrice + propertyData.renovationCost;
    const monthlyRent = propertyData.units.reduce((sum, unit) => sum + parseFloat(unit.rent || 0), 0);
    const annualRent = monthlyRent * 12;
    const yieldPercent = ((annualRent / totalInvestment) * 100).toFixed(1);
    const roiYears = (totalInvestment / annualRent).toFixed(1);

    propertyData.calculations = {
      totalInvestment,
      monthlyRent,
      annualRent,
      yieldPercent,
      roiYears
    };

    // Generate HTML via AI
    const html = await generateHTML(propertyData);

    // Create slug and save
    const slug = slugify(req.body.address);
    const filename = `${slug}-${Date.now()}.html`;
    const filepath = path.join(__dirname, '../generated', filename);

    fs.writeFileSync(filepath, html);

    // Save metadata
    const metadata = {
      slug,
      filename,
      propertyData,
      createdAt: new Date().toISOString()
    };

    const metadataPath = path.join(__dirname, '../generated', `${slug}-${Date.now()}.json`);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    res.json({
      success: true,
      url: `/deals/${filename}`,
      slug,
      calculations: propertyData.calculations
    });

  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List all generated presentations
app.get('/api/presentations', (req, res) => {
  const generatedDir = path.join(__dirname, '../generated');
  
  if (!fs.existsSync(generatedDir)) {
    return res.json({ presentations: [] });
  }

  const files = fs.readdirSync(generatedDir)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const content = fs.readFileSync(path.join(generatedDir, f), 'utf8');
      return JSON.parse(content);
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ presentations: files });
});

app.listen(PORT, () => {
  console.log(`✅ DealPresent API running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔑 Config API key in /config/config.json or via POST /api/config`);
});

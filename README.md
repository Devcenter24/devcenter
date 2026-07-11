# Dev Center — Setup Guide

## Structure des fichiers
```
devcenter/
├── index.html                  ← Page principale
├── assets/
│   ├── css/
│   │   ├── theme.css           ← Variables dark/light
│   │   ├── main.css            ← Styles globaux
│   │   └── admin.css           ← Styles panel admin
│   ├── js/
│   │   ├── supabase.js         ← Config Supabase + helpers DB
│   │   └── main.js             ← Particles, terminal, thème, search…
│   └── img/
│       └── favicon.svg
├── admin/
│   └── index.html              ← Panel admin complet
└── pages/
    └── auth-callback.html      ← Page login / OAuth Discord
```

---

## 1. Configurer Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Ouvrez `assets/js/supabase.js` et remplacez :
   ```js
   const SUPABASE_URL = 'https://VOTRE_PROJET.supabase.co';
   const SUPABASE_ANON_KEY = 'VOTRE_ANON_KEY';
   ```

### Tables à créer dans Supabase :

```sql
-- Profiles (liés aux users auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT,
  discord_username TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders (commandes de services)
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL,        -- discord | web | bot | other
  service TEXT,
  description TEXT,
  discord TEXT,
  email TEXT,
  status TEXT DEFAULT 'pending', -- pending | in_progress | completed | cancelled
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts (formulaire de contact)
CREATE TABLE contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT,
  subject TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS) :
```sql
-- Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can send contact" ON contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read all" ON orders FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

---

## 2. Activer Discord OAuth dans Supabase

1. Dashboard Supabase → **Authentication** → **Providers**
2. Activer **Discord**
3. Entrer votre **Client ID** et **Client Secret** Discord
4. Redirect URI : `https://VOTRE_PROJET.supabase.co/auth/v1/callback`

---

## 3. Déploiement

### Option A — Netlify (recommandé)
```bash
# Glissez le dossier sur netlify.com/drop
# ou via CLI :
npm install -g netlify-cli
netlify deploy --dir=. --prod
```

### Option B — GitHub Pages
```bash
git init && git add . && git commit -m "init"
git push origin main
# Activer Pages dans les settings du repo
```

### Option C — Vercel
```bash
npm install -g vercel
vercel --prod
```

---

## 4. Accès Admin

- URL : `/admin/index.html`
- En production, protégez cette URL via RLS Supabase ou un middleware auth
- Le panel fonctionne en mode démo sans Supabase (données mockées)

---

## 5. Thème dark/light

Le système de thème est entièrement géré via CSS variables dans `theme.css`.
Le toggle en haut à droite sauvegarde le choix dans `localStorage`.

```js
Theme.toggle();     // Basculer
Theme.set('light'); // Forcer light
Theme.set('dark');  // Forcer dark
```

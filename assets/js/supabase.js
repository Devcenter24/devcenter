const SUPABASE_URL = 'https://buneezcxklpmmkfhgpwe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bmVlemN4a2xwbW1rZmhncHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NzQ1NjQsImV4cCI6MjA5NjA1MDU2NH0.BG7j6rU_ideWqMgrSKazgH5sjGHbXtum7VGdcgVf6os';
const DISCORD_REDIRECT_URI = `${window.location.origin}/pages/auth-callback.html`;
let _supabaseClient = null;
let supabaseReady = false;
async function initSupabase() {
  if (supabaseReady) return _supabaseClient;
  if (typeof window.supabase !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      _supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
      });
    } catch (e) { _supabaseClient = null; }
  }
  supabaseReady = true;
  window._supabaseClient = _supabaseClient;
  return _supabaseClient;
}
function isSupabaseConfigured() { return !!_supabaseClient; }
window.isSupabaseConfigured = isSupabaseConfigured;
const Auth = {
  async getSession() { if (!_supabaseClient) return null; const { data } = await _supabaseClient.auth.getSession(); return data?.session || null; },
  async getUser() { if (!_supabaseClient) return null; const { data } = await _supabaseClient.auth.getUser(); return data?.user || null; },
  async getCurrentProfile() {
    if (!_supabaseClient) return null;
    const user = await this.getUser(); if (!user) return null;
    const { data, error } = await _supabaseClient.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (error) return null; return data;
  },
  async loginWithDiscord() {
    if (!_supabaseClient) { showToast('Supabase non configure', 'error'); return; }
    const { error } = await _supabaseClient.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo: DISCORD_REDIRECT_URI, scopes: 'identify email' } });
    if (error) showToast(error.message, 'error');
  },
  async loginWithEmail(email, password) {
    if (!_supabaseClient) { showToast('Supabase non configure', 'error'); return null; }
    const { data, error } = await _supabaseClient.auth.signInWithPassword({ email, password });
    if (error) { showToast(error.message, 'error'); return null; } return data;
  },
  async signUpWithEmail(email, password) {
    if (!_supabaseClient) { showToast('Supabase non configure', 'error'); return null; }
    const { data, error } = await _supabaseClient.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/admin/index.html` }
    });
    if (error) { showToast(error.message, 'error'); return null; }
    return data;
  },
  async resetPassword(email) {
    if (!_supabaseClient) { showToast('Supabase non configure', 'error'); return false; }
    const { error } = await _supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/index.html`
    });
    if (error) { showToast(error.message, 'error'); return false; }
    showToast('Email de reinitialisation envoye', 'success');
    return true;
  },
  async logout() { if (!_supabaseClient) return; await _supabaseClient.auth.signOut(); },
  async isAdmin() { const p = await this.getCurrentProfile(); return p?.role === 'admin'; },
  onAuthChange(cb) { if (!_supabaseClient) return; _supabaseClient.auth.onAuthStateChange(cb); }
};
window.Auth = Auth;
const DB = {
  async getOrders() { if (!_supabaseClient) return [...mockOrders]; const { data, error } = await _supabaseClient.from('orders').select('*').order('created_at', { ascending: false }); if (error) return [...mockOrders]; return data || []; },
  async createOrder(order) {
    if (!_supabaseClient) { showToast('Commande recue (mode demo)', 'success'); return order; }
    const user = await Auth.getUser();
    const { data, error } = await _supabaseClient.from('orders').insert({ name: order.name || null, discord: order.discord || null, email: order.email || null, service: order.service || 'other', description: order.description || null, user_id: user?.id || null, status: 'pending' }).select().single();
    if (error) { showToast(error.message, 'error'); return null; }
    showToast('Commande envoyee avec succes', 'success'); return data;
  },
  async updateOrderStatus(id, status) { if (!_supabaseClient) return true; const { error } = await _supabaseClient.from('orders').update({ status }).eq('id', id); if (error) { showToast(error.message, 'error'); return false; } showToast('Statut mis a jour', 'success'); return true; },
  async deleteOrder(id) { if (!_supabaseClient) return true; const { data, error } = await _supabaseClient.from('orders').delete().eq('id', id).select(); if (error) { showToast(error.message, 'error'); return false; } if (!data || !data.length) { showToast('Suppression refusee (droits admin manquants ?)', 'error'); return false; } return true; },
  async getProfiles() { if (!_supabaseClient) return [...mockUsers]; const { data, error } = await _supabaseClient.from('profiles').select('*').order('created_at', { ascending: false }); if (error) return [...mockUsers]; return data || []; },
  async updateProfile(id, updates) { if (!_supabaseClient) return true; const { error } = await _supabaseClient.from('profiles').update(updates).eq('id', id); if (error) { showToast(error.message, 'error'); return false; } showToast('Profil mis a jour', 'success'); return true; },
  async getStats() {
    if (!_supabaseClient) return { ...mockStats };
    try {
      const [orders, users, pending] = await Promise.all([
        _supabaseClient.from('orders').select('id', { count: 'exact', head: true }),
        _supabaseClient.from('profiles').select('id', { count: 'exact', head: true }),
        _supabaseClient.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending')
      ]);
      if (orders.error || users.error || pending.error) throw (orders.error || users.error || pending.error);
      return { totalOrders: orders.count || 0, totalUsers: users.count || 0, pendingOrders: pending.count || 0 };
    } catch { return { ...mockStats }; }
  },
  async getServices() { if (!_supabaseClient) return [...mockServices]; const { data, error } = await _supabaseClient.from('services').select('*').order('sort_order', { ascending: true }); if (error) return [...mockServices]; return data || []; },
  async createService(service) { if (!_supabaseClient) return { id: Date.now(), ...service }; const { data, error } = await _supabaseClient.from('services').insert(service).select().single(); if (error) { showToast(error.message, 'error'); return null; } return data; },
  async updateService(id, updates) { if (!_supabaseClient) return true; const { error } = await _supabaseClient.from('services').update(updates).eq('id', id); if (error) { showToast(error.message, 'error'); return false; } return true; },
  async deleteService(id) { if (!_supabaseClient) return true; const { data, error } = await _supabaseClient.from('services').delete().eq('id', id).select(); if (error) { showToast(error.message, 'error'); return false; } if (!data || !data.length) { showToast('Suppression refusee (droits admin manquants ?)', 'error'); return false; } return true; },
  async getTestimonials() { if (!_supabaseClient) return [...mockTestimonials]; const { data, error } = await _supabaseClient.from('testimonials').select('*').order('created_at', { ascending: false }); if (error) return [...mockTestimonials]; return data || []; },
  async createTestimonial(t) { if (!_supabaseClient) return { id: Date.now(), ...t }; const { data, error } = await _supabaseClient.from('testimonials').insert(t).select().single(); if (error) { showToast(error.message, 'error'); return null; } return data; },
  async deleteTestimonial(id) { if (!_supabaseClient) return true; const { data, error } = await _supabaseClient.from('testimonials').delete().eq('id', id).select(); if (error) { showToast(error.message, 'error'); return false; } if (!data || !data.length) { showToast('Suppression refusee (droits admin manquants ?)', 'error'); return false; } return true; },
  async getSiteSettings() {
    if (!_supabaseClient) return { ...mockSettings };
    const { data, error } = await _supabaseClient.from('site_settings').select('*').eq('id', 1).maybeSingle();
    if (error || !data) return { ...mockSettings };
    return data;
  },
  async updateSiteSettings(updates) {
    if (!_supabaseClient) {
      Object.assign(mockSettings, updates);
      showToast('Parametres sauvegardes (mode demo)', 'success');
      return { ...mockSettings };
    }
    const { data, error } = await _supabaseClient.from('site_settings').update(updates).eq('id', 1).select().maybeSingle();
    if (error) { showToast(error.message, 'error'); return null; }
    showToast('Parametres sauvegardes', 'success');
    return data;
  },
  async createContactMessage(msg) {
    if (!_supabaseClient) { showToast('Message recu (mode demo)', 'success'); return msg; }
    const { data, error } = await _supabaseClient.from('contact_messages').insert({ name: msg.name || null, email: msg.email || null, subject: msg.subject || null, message: msg.message || null }).select().single();
    if (error) { showToast(error.message, 'error'); return null; }
    showToast('Message envoye avec succes', 'success'); return data;
  }
};
window.DB = DB;
const mockOrders = [
  { id: '001', service: 'discord', user: 'Alex#1234', name: 'Alex', discord: 'Alex#1234', status: 'completed', created_at: '2025-06-01T10:00:00Z', description: 'Configuration serveur gaming' },
  { id: '002', service: 'web', user: 'Marie#5678', name: 'Marie', discord: 'Marie#5678', status: 'in_progress', created_at: '2025-06-02T14:30:00Z', description: 'Portfolio photographe' },
  { id: '003', service: 'bot', user: 'Tom#9012', name: 'Tom', discord: 'Tom#9012', status: 'pending', created_at: '2025-06-03T09:15:00Z', description: 'Bot moderation + economie' },
  { id: '004', service: 'discord', user: 'Lea#3456', name: 'Lea', discord: 'Lea#3456', status: 'pending', created_at: '2025-06-04T16:45:00Z', description: 'Serveur communaute creative' },
  { id: '005', service: 'web', user: 'Max#7890', name: 'Max', discord: 'Max#7890', status: 'completed', created_at: '2025-06-05T11:20:00Z', description: 'Dashboard analytics' },
];
const mockUsers = [
  { id: '1', username: 'Alex', discord_username: 'Alex#1234', email: 'alex@ex.com', role: 'user', created_at: '2025-05-10', status: 'active' },
  { id: '2', username: 'Marie', discord_username: 'Marie#5678', email: 'marie@ex.com', role: 'user', created_at: '2025-05-12', status: 'active' },
  { id: '3', username: 'Tom', discord_username: 'Tom#9012', email: 'tom@ex.com', role: 'admin', created_at: '2025-04-01', status: 'active' },
  { id: '4', username: 'Lea', discord_username: 'Lea#3456', email: 'lea@ex.com', role: 'user', created_at: '2025-05-18', status: 'active' },
  { id: '5', username: 'Max', discord_username: 'Max#7890', email: 'max@ex.com', role: 'mod', created_at: '2025-05-20', status: 'inactive' },
];
const mockStats = { totalOrders: mockOrders.length, totalUsers: mockUsers.length, pendingOrders: mockOrders.filter(o => o.status === 'pending').length };
const mockServices = [
  { id: 1, icon: '', name: 'Serveur Discord', type: 'discord', active: true, sort_order: 1, description: 'Configuration complete de votre communaute Discord. Roles automatiques, canaux organises, bots integres et systeme de moderation robuste.' },
  { id: 2, icon: '', name: 'Site Web', type: 'web', active: true, sort_order: 2, description: 'Sites vitrines et applications web professionnelles. De la landing page percutante au e-commerce complet, pense pour la performance.' },
  { id: 3, icon: '', name: 'Bot Discord', type: 'bot', active: true, sort_order: 3, description: "Bots sur mesure avec commandes personnalisees. Moderation intelligente, systeme d'economie, musique, jeux et integrations API tierces." },
];
const mockTestimonials = [
  { id: 1, name: 'Alexandre L.', role: 'Developpeur Full-Stack', stars: 5, text: "Dev Center m'a permis de deployer mon premier projet en production en moins d'une heure. L'equipe est incrediblement reactive et bienveillante." },
  { id: 2, name: 'Marie R.', role: 'Developpeuse Web Junior', stars: 5, text: "La communaute est incroyable, tout le monde s'entraide. J'ai appris plus en 3 semaines qu'en 6 mois sur des plateformes payantes." },
  { id: 3, name: 'Thomas K.', role: 'Createur de Bot Discord', stars: 5, text: "100% gratuit avec une qualite pareille, c'est incroyable. Mon bot Discord tourne depuis 6 mois sans la moindre interruption." },
];
let mockSettings = {
  id: 1,
  site_name: 'Dev Center',
  tagline: 'Votre espace de developpement tout-en-un.',
  discord_invite_url: 'https://discord.gg/H2tqMh86YP',
  discord_client_id: '',
  maintenance_mode: false,
  accept_orders: true
};

document.addEventListener('DOMContentLoaded', initSupabase);
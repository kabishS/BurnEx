/* =========================================================================
   BURN-EX — app.js
   Shared across every page: async Supabase data layer, auth guard,
   sidebar/topbar chrome, and small utility helpers. Loaded after
   js/supabase.js and before any page-specific script.
   ========================================================================= */

/* -------------------- Row <-> app-object mapping --------------------
   Tables use snake_case columns; the rest of the app works with the same
   camelCase shapes it always has. These are the only functions that know
   about column names. */
function gymRowToObj(r){ return { code:r.code, name:r.name, ownerUsername:r.owner_username, created:r.created }; }
function gymObjToRow(o){ return { code:o.code, name:o.name, owner_username:o.ownerUsername, created:o.created }; }

function userRowToObj(r){
  return { username:r.username, password:r.password, role:r.role, name:r.name, email:r.email,
           age:r.age, gender:r.gender, weight:r.weight, height:r.height, goal:r.goal,
           gymCode:r.gym_code, joined:r.joined };
}
function userObjToRow(o){
  return { username:o.username, password:o.password, role:o.role, name:o.name, email:o.email,
           age:o.age, gender:o.gender, weight:o.weight, height:o.height, goal:o.goal,
           gym_code:o.gymCode ?? null, joined:o.joined };
}

function walkRowToObj(r){
  return { id:r.id, date:r.date, duration:r.duration, distance:r.distance, pace:r.pace, calories:r.calories,
           startPlace:r.start_place, endPlace:r.end_place,
           startLat:r.start_lat, startLng:r.start_lng, endLat:r.end_lat, endLng:r.end_lng };
}
function walkObjToRow(o, username){
  return { id:o.id, username, date:o.date, duration:o.duration, distance:o.distance, pace:o.pace, calories:o.calories,
           start_place:o.startPlace ?? null, end_place:o.endPlace ?? null,
           start_lat:o.startLat ?? null, start_lng:o.startLng ?? null,
           end_lat:o.endLat ?? null, end_lng:o.endLng ?? null };
}

/* -------------------- Data layer (Supabase) --------------------
   Every method is async. No demo/seed data is ever written here — every
   list starts empty until real users register. */
const DB = {
  session:      () => localStorage.getItem('burnex_session'),
  setSession:   (username) => localStorage.setItem('burnex_session', username),
  clearSession: () => localStorage.removeItem('burnex_session'),

  async getGyms(){
    const { data, error } = await supabaseClient.from('gyms').select('*');
    if (error) throw error;
    return (data || []).map(gymRowToObj);
  },
  async getGymByCode(code){
    const { data, error } = await supabaseClient.from('gyms').select('*').eq('code', code).maybeSingle();
    if (error) throw error;
    return data ? gymRowToObj(data) : null;
  },
  async createGym(gym){
    const { error } = await supabaseClient.from('gyms').insert(gymObjToRow(gym));
    if (error) throw error;
  },

  async getUsers(){
    const { data, error } = await supabaseClient.from('users').select('*');
    if (error) throw error;
    return (data || []).map(userRowToObj);
  },
  async getUserByUsername(username){
    const { data, error } = await supabaseClient.from('users').select('*').eq('username', username).maybeSingle();
    if (error) throw error;
    return data ? userRowToObj(data) : null;
  },
  async createUser(user){
    const { error } = await supabaseClient.from('users').insert(userObjToRow(user));
    if (error) throw error;
  },
  async updateUser(user){
    const { error } = await supabaseClient.from('users').update(userObjToRow(user)).eq('username', user.username);
    if (error) throw error;
  },

  async getWorkouts(username){
    const { data, error } = await supabaseClient.from('workouts').select('*').eq('username', username);
    if (error) throw error;
    return data || [];
  },
  async addWorkout(username, session){
    const { error } = await supabaseClient.from('workouts').insert({ ...session, username });
    if (error) throw error;
  },
  async deleteWorkout(id){
    const { error } = await supabaseClient.from('workouts').delete().eq('id', id);
    if (error) throw error;
  },
  async clearWorkouts(username){
    const { error } = await supabaseClient.from('workouts').delete().eq('username', username);
    if (error) throw error;
  },

  async getWalks(username){
    const { data, error } = await supabaseClient.from('walks').select('*').eq('username', username);
    if (error) throw error;
    return (data || []).map(walkRowToObj);
  },
  async addWalk(username, walk){
    const { error } = await supabaseClient.from('walks').insert(walkObjToRow(walk, username));
    if (error) throw error;
  },
  async deleteWalk(id){
    const { error } = await supabaseClient.from('walks').delete().eq('id', id);
    if (error) throw error;
  },
  async clearWalks(username){
    const { error } = await supabaseClient.from('walks').delete().eq('username', username);
    if (error) throw error;
  },

  async getTaskCompletions(username){
    const { data, error } = await supabaseClient.from('task_completions').select('*').eq('username', username);
    if (error) throw error;
    return (data || []).map(r => ({ id:r.id, date:r.task_date }));
  },
  async markTaskComplete(username, dateStr){
    const { error } = await supabaseClient.from('task_completions').insert({ id: uid(), username, task_date: dateStr });
    if (error) throw error;
  },
  async unmarkTaskComplete(username, dateStr){
    const { error } = await supabaseClient.from('task_completions').delete().eq('username', username).eq('task_date', dateStr);
    if (error) throw error;
  },
};

/* -------------------- Small utils -------------------- */
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function simpleHash(str){ // demo-grade, client-only — not cryptographic
  let h = 0;
  for (let i = 0; i < str.length; i++){ h = (Math.imul(31, h) + str.charCodeAt(i)) | 0; }
  return 'h' + h.toString(36);
}

async function genGymCode(){
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const existing = (await DB.getGyms()).map(g => g.code);
  let code;
  do {
    code = Array.from({length: 6}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (existing.includes(code));
  return code;
}

function toast(msg){
  const box = document.getElementById('toastBox');
  if (!box) return;
  box.textContent = msg;
  box.classList.add('show');
  clearTimeout(window._toastT);
  window._toastT = setTimeout(() => box.classList.remove('show'), 2600);
}

function fmtDuration(sec){ const m = Math.floor(sec/60), s = Math.round(sec%60); return `${m}m ${s}s`; }

const EX_META = {
  squat:  { icon:'🦵', name:'Squats' },
  pushup: { icon:'💪', name:'Push-ups' },
  curl:   { icon:'🏋️', name:'Bicep Curls' },
  jack:   { icon:'⭐', name:'Jumping Jacks' },
  walk:   { icon:'🚶', name:'Walking' },
};
function exIcon(ex){ return (EX_META[ex] || {}).icon || '🏃'; }
function exName(ex){ return (EX_META[ex] || {}).name || ex; }

function chartBaseOpts(legend){
  return {
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{ display:!!legend, labels:{color:'#8B93A1', font:{family:'Inter'}} } },
    scales:{
      x:{ grid:{color:'#2A303A'}, ticks:{color:'#8B93A1', font:{family:'Inter',size:11}} },
      y:{ grid:{color:'#2A303A'}, ticks:{color:'#8B93A1', font:{family:'Inter',size:11}}, beginAtZero:true }
    }
  };
}

/* Combine workouts + walking sessions into one normalized activity list */
async function allSessions(username){
  const [w, walks] = await Promise.all([DB.getWorkouts(username), DB.getWalks(username)]);
  const workoutSessions = w.map(s => ({ ...s, kind:'workout' }));
  const walkSessions = walks.map(s => ({
    id:s.id, date:s.date, exercise:'walk', reps:0, duration:s.duration, calories:s.calories, kind:'walk',
    startPlace:s.startPlace, endPlace:s.endPlace
  }));
  return [...workoutSessions, ...walkSessions];
}

function calcStreak(sessions){
  if (!sessions.length) return 0;
  const daySet = new Set(sessions.map(s => { const d = new Date(s.date); d.setHours(0,0,0,0); return d.getTime(); }));
  let streak = 0;
  let cursor = new Date(); cursor.setHours(0,0,0,0);
  while (daySet.has(cursor.getTime())){ streak++; cursor.setDate(cursor.getDate()-1); }
  return streak;
}

/* -------------------- Auth guard -------------------- */
async function getCurrentUser(){
  const username = DB.session();
  if (!username) return null;
  try { return await DB.getUserByUsername(username); }
  catch(e){ console.error(e); return null; }
}

/* Redirects to the login/landing page if not signed in, or to the correct
   dashboard if the role doesn't match what the page expects. Returns the
   user object (or null, after redirecting). */
async function requireAuth(expectedRole){
  const user = await getCurrentUser();
  if (!user){ window.location.href = 'index.html'; return null; }
  if (expectedRole && user.role !== expectedRole){
    window.location.href = user.role === 'admin' ? 'admin.html' : 'dashboard.html';
    return null;
  }
  return user;
}

function logout(){
  if (!confirm('Log out of Burn-Ex?')) return;
  DB.clearSession();
  window.location.href = 'index.html';
}

function toggleSidebar(){ document.getElementById('sidebarMount').classList.toggle('open'); }

/* -------------------- Sidebar + topbar chrome -------------------- */
const MEMBER_NAV = [
  { key:'dashboard',   href:'dashboard.html',   icon:'🏠', label:'Dashboard' },
  { key:'workout',     href:'workout.html',     icon:'🏋️', label:'Live Workout' },
  { key:'history',     href:'history.html',     icon:'📜', label:'History' },
  { key:'analytics',   href:'analytics.html',   icon:'📊', label:'Analytics' },
  { key:'food',        href:'food.html',        icon:'🍎', label:'Food' },
  { key:'walking',     href:'walking.html',     icon:'🚶', label:'Walking' },
  { key:'weektask',    href:'weektask.html',    icon:'✅', label:'Weekly Tasks' },
  { key:'profile',     href:'profile.html',     icon:'👤', label:'Profile' },
];
const ADMIN_NAV = [
  { key:'admin',            href:'admin.html',            icon:'🏠', label:'Admin Dashboard' },
  { key:'admin-members',    href:'admin-members.html',    icon:'👥', label:'Members' },
  { key:'admin-leaderboard',href:'admin-leaderboard.html',icon:'🏆', label:'Leaderboard' },
  { key:'profile',          href:'profile.html',          icon:'👤', label:'Profile' },
];
const VIEW_META = {
  dashboard:{title:'Dashboard', sub:"Your training overview"},
  workout:{title:'Live Workout', sub:'On-device pose tracking & rep counting'},
  history:{title:'History', sub:'Every logged session'},
  analytics:{title:'Analytics', sub:'Trends across your training'},
  food:{title:'Food', sub:'Suggestions based on today\u2019s calorie burn'},
  walking:{title:'Walking', sub:'Log walks and track your route'},
  weektask:{title:'Weekly Tasks', sub:'Monday\u2013Saturday challenges \u2014 mark each day, build your streak'},
  profile:{title:'Profile', sub:'Personal details used for calorie math'},
  admin:{title:'Admin Dashboard', sub:'Your gym at a glance'},
  'admin-members':{title:'Members', sub:'Everyone linked to your gym code'},
  'admin-leaderboard':{title:'Gym Leaderboard', sub:'Rank members by calories burned'},
};

function injectChrome(pageKey, user){
  if (!user) return;
  const nav = user.role === 'admin' ? ADMIN_NAV : MEMBER_NAV;
  const initials = (user.name || user.username).split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase();

  const sidebar = document.getElementById('sidebarMount');
  if (sidebar){
    sidebar.classList.add('sidebar');
    sidebar.innerHTML = `
      <div class="sidebar-brand">
        <div class="brand-mark" style="font-size:1.25rem;">
          <span class="flame" style="width:28px;height:28px;font-size:.9rem;">🔥</span> Burn-Ex
        </div>
      </div>
      <nav class="nav-burnex">
        ${nav.map(item => `<button class="nav-item-btn ${item.key===pageKey?'active':''}" onclick="location.href='${item.href}'"><span class="ic">${item.icon}</span> ${item.label}</button>`).join('')}
        <button class="nav-item-btn" onclick="logout()"><span class="ic">🚪</span> Logout</button>
      </nav>
      <div class="sidebar-foot">
        <div class="user-chip">
          <div class="avatar-circle ${user.role==='admin'?'admin':''}">${initials}</div>
          <div style="min-width:0;">
            <div style="font-size:.85rem;font-weight:600;">${user.name || user.username}</div>
            <div class="text-faint" style="font-size:.72rem;">${user.role==='admin' ? 'Gym owner' : ('Goal: ' + (user.goal||400) + ' kcal/day')}</div>
          </div>
        </div>
      </div>`;
  }

  const topbar = document.getElementById('topbarMount');
  if (topbar){
    topbar.classList.add('topbar');
    const meta = VIEW_META[pageKey] || {title:'', sub:''};
    topbar.innerHTML = `
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-sm btn-outline-teal mobile-toggle" onclick="toggleSidebar()">☰</button>
        <div>
          <h4 class="font-d mb-0">${meta.title}</h4>
          <div class="text-dim" style="font-size:.82rem;">${meta.sub}</div>
        </div>
      </div>
      <div class="badge-soft">${new Date().toLocaleDateString(undefined,{weekday:'long', month:'short', day:'numeric'})}</div>`;
  }
}

/* =========================================================================
   BURN-EX — admin.js  (admin.html, admin-members.html, admin-leaderboard.html)
   ========================================================================= */
let _adminUser = null;
let _adminGym = null;

async function getGymMembers(){
  const users = await DB.getUsers();
  return users.filter(u => u.gymCode === _adminGym.code && u.role === 'member');
}

/* ---------- admin.html ---------- */
async function renderAdminDashboard(){
  document.getElementById('adminGymName').textContent = _adminGym.name;
  document.getElementById('adminGymCode').textContent = _adminGym.code;

  const members = await getGymMembers();
  const today = new Date(); today.setHours(0,0,0,0);
  const weekStart = today.getTime() - 6*86400000;

  let weekCal = 0, todayCal = 0;
  const memberSessions = await Promise.all(members.map(m => allSessions(m.username)));
  memberSessions.forEach(sessions => {
    weekCal += sessions.filter(s => s.date >= weekStart).reduce((a,s)=>a+s.calories,0);
    todayCal += sessions.filter(s => s.date >= today.getTime()).reduce((a,s)=>a+s.calories,0);
  });

  document.getElementById('adminMemberCount').textContent = members.length;
  document.getElementById('adminTodayCal').textContent = Math.round(todayCal);
  document.getElementById('adminWeekCal').textContent = Math.round(weekCal);

  const ranked = members.map((m,i) => ({
    name: m.name || m.username,
    calories: memberSessions[i].filter(s => s.date >= weekStart).reduce((a,s)=>a+s.calories,0)
  })).sort((a,b) => b.calories-a.calories).slice(0,5);

  const list = document.getElementById('adminTopMembers');
  if (!members.length){
    list.innerHTML = `<div class="empty-state"><div class="ic">👥</div>No members yet — share your gym code <b>${_adminGym.code}</b> so members can join at signup.</div>`;
  } else {
    list.innerHTML = ranked.map((r,i) => `
      <div class="leaderboard-row">
        <div class="rank-badge ${i===0?'r1':i===1?'r2':i===2?'r3':''}">${i+1}</div>
        <div class="flex-grow-1" style="font-weight:600;font-size:.9rem;">${r.name}</div>
        <div class="mono text-ember fw-bold">${Math.round(r.calories)} kcal</div>
      </div>`).join('');
  }
}

/* ---------- admin-members.html ---------- */
async function renderAdminMembers(){
  const members = await getGymMembers();
  const list = document.getElementById('memberList');
  document.getElementById('memberEmpty').classList.toggle('d-none', members.length > 0);

  const rows = await Promise.all(members.map(async m => {
    const sessions = await allSessions(m.username);
    const totalCal = sessions.reduce((a,s)=>a+s.calories,0);
    const initials = (m.name||m.username).split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase();
    return `
      <div class="member-row">
        <div class="member-id">
          <div class="avatar-circle">${initials}</div>
          <div>
            <div style="font-weight:600;">${m.name || m.username}</div>
            <div class="text-faint" style="font-size:.76rem;">@${m.username}</div>
          </div>
        </div>
        <div class="member-stats">
          <div class="ms"><div class="v">${sessions.length}</div><div class="l">Sessions</div></div>
          <div class="ms"><div class="v text-ember">${Math.round(totalCal)}</div><div class="l">Kcal</div></div>
        </div>
        <button class="icon-btn" onclick="removeMember('${m.username}')" title="Remove from gym">✕</button>
      </div>`;
  }));
  list.innerHTML = rows.join('');
}

async function removeMember(username){
  if (!confirm('Remove this member from your gym?')) return;
  try {
    const user = await DB.getUserByUsername(username);
    if (!user) return;
    user.gymCode = null;
    await DB.updateUser(user);
    await renderAdminMembers();
    toast('Member removed from gym');
  } catch (e){ console.error(e); toast('Could not remove member — try again'); }
}

/* ---------- admin-leaderboard.html ---------- */
let _adminLbPeriod = 'week';
function setAdminLbPeriod(period, btn){
  _adminLbPeriod = period;
  document.querySelectorAll('#adminLbPeriodTabs button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderAdminLeaderboard();
}
async function renderAdminLeaderboard(){
  const start = periodStart(_adminLbPeriod);
  const members = await getGymMembers();
  const ranked = (await Promise.all(members.map(async m => {
    const sessions = await allSessions(m.username);
    return { name: m.name || m.username, calories: sessions.filter(s => s.date >= start).reduce((a,s)=>a+s.calories,0) };
  }))).sort((a,b) => b.calories-a.calories);

  const wrap = document.getElementById('adminLeaderboardWrap');
  if (!ranked.length){
    wrap.innerHTML = `<div class="empty-state"><div class="ic">🏆</div>No members yet.</div>`;
    return;
  }
  wrap.innerHTML = ranked.map((r,i) => `
    <div class="leaderboard-row">
      <div class="rank-badge ${i===0?'r1':i===1?'r2':i===2?'r3':''}">${i+1}</div>
      <div class="flex-grow-1" style="font-weight:600;font-size:.92rem;">${r.name}</div>
      <div class="mono text-ember fw-bold">${Math.round(r.calories)} kcal</div>
    </div>`).join('');
}
function periodStart(period){
  const d = new Date(); d.setHours(0,0,0,0);
  if (period === 'today') return d.getTime();
  if (period === 'week') return d.getTime() - 6*86400000;
  if (period === 'month') return d.getTime() - 29*86400000;
  return 0;
}

/* ---------- boot ---------- */
async function initAdminPage(pageKey, renderFn){
  _adminUser = await requireAuth('admin');
  if (!_adminUser) return;
  injectChrome(pageKey, _adminUser);
  const gyms = await DB.getGyms();
  _adminGym = gyms.find(g => g.ownerUsername === _adminUser.username);
  if (!_adminGym){ toast('No gym found for this account'); return; }
  renderFn();
}

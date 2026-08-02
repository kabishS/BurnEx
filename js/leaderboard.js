/* =========================================================================
   BURN-EX — leaderboard.js  (leaderboard.html)
   ========================================================================= */
let _lbUser = null;
let _lbPeriod = 'week';

function periodStart(period){
  const d = new Date(); d.setHours(0,0,0,0);
  if (period === 'today') return d.getTime();
  if (period === 'week') return d.getTime() - 6*86400000;
  if (period === 'month') return d.getTime() - 29*86400000;
  return 0;
}

function setLbPeriod(period, btn){
  _lbPeriod = period;
  document.querySelectorAll('#lbPeriodTabs button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderLeaderboard();
}

async function renderLeaderboard(){
  const wrap = document.getElementById('leaderboardWrap');

  if (!_lbUser.gymCode){
    wrap.innerHTML = `<div class="empty-state"><div class="ic">🏆</div>You're not linked to a gym yet.<br>Add a gym code from your Profile page to see your gym's leaderboard.</div>`;
    return;
  }

  wrap.innerHTML = `<div class="empty-state"><div class="ic">⏳</div>Loading leaderboard…</div>`;

  const gym = await DB.getGymByCode(_lbUser.gymCode);
  const allUsers = await DB.getUsers();
  const members = allUsers.filter(u => u.gymCode === _lbUser.gymCode && u.role === 'member');
  const start = periodStart(_lbPeriod);

  const ranked = (await Promise.all(members.map(async m => {
    const sessions = await allSessions(m.username);
    const cal = sessions.filter(s => s.date >= start).reduce((a,s) => a+s.calories, 0);
    return { username: m.username, name: m.name || m.username, calories: cal };
  }))).sort((a,b) => b.calories - a.calories);

  if (!ranked.length){
    wrap.innerHTML = `<div class="empty-state"><div class="ic">🏆</div>No members in ${gym ? gym.name : 'this gym'} yet.</div>`;
    return;
  }

  wrap.innerHTML = ranked.map((r, i) => {
    const rankClass = i===0?'r1':i===1?'r2':i===2?'r3':'';
    const isMe = r.username === _lbUser.username;
    return `
      <div class="leaderboard-row ${isMe?'me':''}">
        <div class="rank-badge ${rankClass}">${i+1}</div>
        <div class="flex-grow-1">
          <div style="font-weight:600;font-size:.92rem;">${r.name}${isMe?' <span class="text-faint" style="font-size:.75rem;">(you)</span>':''}</div>
        </div>
        <div class="mono text-ember fw-bold">${Math.round(r.calories)} kcal</div>
      </div>`;
  }).join('');
}

window.addEventListener('DOMContentLoaded', async () => {
  _lbUser = await requireAuth('member');
  if (!_lbUser) return;
  injectChrome('leaderboard', _lbUser);
  renderLeaderboard();
});

/* =========================================================================
   BURN-EX — dashboard.js  (dashboard.html)
   ========================================================================= */
let _miniChart = null;

async function renderDashboard(){
  const user = await requireAuth('member');
  if (!user) return;
  injectChrome('dashboard', user);

  const sessions = await allSessions(user.username);
  const today = new Date(); today.setHours(0,0,0,0);
  const todayCal = sessions.filter(s => s.date >= today.getTime()).reduce((a,s) => a+s.calories, 0);
  const weekStart = today.getTime() - 6*86400000;
  const weekCal = sessions.filter(s => s.date >= weekStart).reduce((a,s) => a+s.calories, 0);

  document.getElementById('statToday').textContent = Math.round(todayCal);
  document.getElementById('statWeek').textContent = Math.round(weekCal);
  document.getElementById('statCount').textContent = sessions.length;
  document.getElementById('statStreak').innerHTML = calcStreak(sessions) + '<span style="font-size:1rem;color:var(--text-dim);"> days</span>';

  const goal = user.goal || 400;
  const pct = Math.min(100, Math.round((todayCal/goal)*100));
  const circumference = 389;
  document.getElementById('goalRing').style.strokeDashoffset = circumference - (circumference*pct/100);
  document.getElementById('goalPct').textContent = pct + '%';
  document.getElementById('goalCaption').textContent = `${Math.round(todayCal)} / ${goal} kcal today`;

  const listEl = document.getElementById('recentActivityList');
  const recent = [...sessions].sort((a,b) => b.date-a.date).slice(0,5);
  if (!recent.length){
    listEl.innerHTML = `<div class="empty-state"><div class="ic">🕓</div>No activity yet — head to Live Workout or Walking to log your first session.</div>`;
  } else {
    listEl.innerHTML = recent.map(s => `
      <div class="activity-row">
        <div class="d-flex align-items-center gap-3">
          <div class="activity-ic">${exIcon(s.exercise)}</div>
          <div>
            <div style="font-weight:600;font-size:.9rem;">${exName(s.exercise)}</div>
            <div class="text-faint" style="font-size:.76rem;">${new Date(s.date).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
          </div>
        </div>
        <div class="text-end">
          <div class="text-ember mono fw-bold">${s.calories.toFixed(1)} kcal</div>
          <div class="text-faint" style="font-size:.76rem;">${s.reps ? s.reps + ' reps · ' : ''}${fmtDuration(s.duration)}</div>
        </div>
      </div>`).join('');
  }

  const days = [...Array(7)].map((_,i) => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-(6-i)); return d; });
  const data = days.map(d => { const next = d.getTime()+86400000; return sessions.filter(s => s.date>=d.getTime() && s.date<next).reduce((a,s)=>a+s.calories,0); });
  const labels = days.map(d => d.toLocaleDateString(undefined,{weekday:'short'}));
  if (_miniChart) _miniChart.destroy();
  _miniChart = new Chart(document.getElementById('chartWeekMini'), {
    type:'line',
    data:{ labels, datasets:[{ data, borderColor:'#FF6A39', backgroundColor:'rgba(255,106,57,.15)', fill:true, tension:.35, pointRadius:3, pointBackgroundColor:'#FF6A39' }]},
    options: chartBaseOpts(false)
  });
}

window.addEventListener('DOMContentLoaded', renderDashboard);

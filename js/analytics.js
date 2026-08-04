/* =========================================================================
   BURN-EX — analytics.js  (analytics.html)
   ========================================================================= */
let trendChart=null, mixChart=null, weeklyChart=null;

async function renderAnalytics(user){
  const sessions = await allSessions(user.username);
  const totalCal = sessions.reduce((a,s) => a+s.calories, 0);
  const totalReps = sessions.reduce((a,s) => a+(s.reps||0), 0);
  document.getElementById('anTotalCal').textContent = Math.round(totalCal);
  document.getElementById('anTotalReps').textContent = totalReps;
  document.getElementById('anAvgCal').textContent = sessions.length ? Math.round(totalCal/sessions.length) : 0;

  const counts = {};
  sessions.forEach(s => counts[s.exercise] = (counts[s.exercise]||0)+1);
  const favEx = Object.keys(counts).sort((a,b) => counts[b]-counts[a])[0];
  document.getElementById('anFav').textContent = favEx ? (exIcon(favEx)+' '+exName(favEx)) : '—';

  const days = [...Array(30)].map((_,i) => { const d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-(29-i)); return d; });
  const trendData = days.map(d => { const next=d.getTime()+86400000; return sessions.filter(s=>s.date>=d.getTime()&&s.date<next).reduce((a,s)=>a+s.calories,0); });
  const trendLabels = days.map(d => d.toLocaleDateString(undefined,{day:'numeric',month:'short'}));
  if (trendChart) trendChart.destroy();
  trendChart = new Chart(document.getElementById('chartTrend'), {
    type:'line',
    data:{ labels:trendLabels, datasets:[{ data:trendData, borderColor:'#29C6B7', backgroundColor:'rgba(41,198,183,.15)', fill:true, tension:.3, pointRadius:0 }]},
    options: chartBaseOpts(false)
  });

  const mixLabels = Object.keys(counts).map(exName);
  const mixData = Object.values(counts);
  if (mixChart) mixChart.destroy();
  mixChart = new Chart(document.getElementById('chartMix'), {
    type:'doughnut',
    data:{ labels: mixLabels.length?mixLabels:['No data'], datasets:[{ data: mixData.length?mixData:[1], backgroundColor:['#FF6A39','#29C6B7','#F2C744','#EF476F','#7C8CF8'], borderColor:'#1E232B', borderWidth:3 }]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{color:'#8B93A1', font:{family:'Inter',size:11}} } } }
  });

  const weeks = [...Array(8)].map((_,i) => {
    const start = new Date(); start.setHours(0,0,0,0);
    start.setDate(start.getDate() - start.getDay() - (7*(7-i)));
    return start;
  });
  const weekData = weeks.map(startD => {
    const start = startD.getTime(), end = start + 7*86400000;
    return sessions.filter(s => s.date>=start && s.date<end).reduce((a,s)=>a+s.calories,0);
  });
  const weekLabels = weeks.map(d => d.toLocaleDateString(undefined,{month:'short',day:'numeric'}));
  if (weeklyChart) weeklyChart.destroy();
  weeklyChart = new Chart(document.getElementById('chartWeekly'), {
    type:'bar',
    data:{ labels: weekLabels, datasets:[{ data: weekData, backgroundColor:'#FF6A39', borderRadius:6, maxBarThickness:38 }]},
    options: chartBaseOpts(false)
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAuth('member');
  if (!user) return;
  injectChrome('analytics', user);
  renderAnalytics(user);
});

/* =========================================================================
   BURN-EX — history.js  (history.html)
   ========================================================================= */
let _historyUser = null;

async function renderHistory(){
  const filter = document.getElementById('historyFilter').value;
  let sessions = (await allSessions(_historyUser.username)).sort((a,b) => b.date-a.date);
  if (filter !== 'all') sessions = sessions.filter(s => s.exercise === filter);

  const body = document.getElementById('historyBody');
  document.getElementById('historyEmpty').classList.toggle('d-none', sessions.length > 0);
  body.innerHTML = sessions.map(s => `
    <tr>
      <td class="text-dim">${new Date(s.date).toLocaleString(undefined,{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'})}</td>
      <td>${exIcon(s.exercise)} ${exName(s.exercise)}${s.kind==='walk' && s.startPlace && s.endPlace ? `<div class="text-faint" style="font-size:.72rem;">${s.startPlace} → ${s.endPlace}</div>` : ''}</td>
      <td class="mono">${fmtDuration(s.duration)}</td>
      <td class="mono">${s.reps || '—'}</td>
      <td class="mono text-ember">${s.calories.toFixed(1)}</td>
      <td><button class="icon-btn" onclick="deleteSession('${s.kind}','${s.id}')" title="Delete">✕</button></td>
    </tr>`).join('');
}

async function deleteSession(kind, id){
  try {
    if (kind === 'walk') await DB.deleteWalk(id);
    else await DB.deleteWorkout(id);
    await renderHistory();
    toast('Session deleted');
  } catch (e){ console.error(e); toast('Could not delete — try again'); }
}

async function clearHistory(){
  if (!confirm('Delete all logged workouts and walks? This cannot be undone.')) return;
  try {
    await Promise.all([DB.clearWorkouts(_historyUser.username), DB.clearWalks(_historyUser.username)]);
    await renderHistory();
    toast('History cleared');
  } catch (e){ console.error(e); toast('Could not clear history — try again'); }
}

window.addEventListener('DOMContentLoaded', async () => {
  _historyUser = await requireAuth('member');
  if (!_historyUser) return;
  injectChrome('history', _historyUser);
  renderHistory();
});

/* =========================================================================
   BURN-EX — weektask.js  (weektask.html)
   Monday–Saturday task checklist with a streak counter. Sunday is treated
   as a rest day — it never has a task and never breaks the streak.
   ========================================================================= */
let _wtUser = null;
let _wtTemplate = {};
let _wtCompletedDates = new Set(); // 'YYYY-MM-DD' strings

function fmtDateKey(d){
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function isSameDay(a, b){ return fmtDateKey(a) === fmtDateKey(b); }

/** Monday of the week containing `d`. */
function getMonday(d){
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun..6=Sat
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0,0,0,0);
  return date;
}

function calcTaskStreak(){
  let streak = 0;
  let cursor = new Date(); cursor.setHours(0,0,0,0);
  // If today is a task day but hasn't been marked yet, don't let an
  // unfinished "today" zero out an otherwise-intact streak — start
  // counting from yesterday instead.
  if (cursor.getDay() !== 0 && !_wtCompletedDates.has(fmtDateKey(cursor))){
    cursor.setDate(cursor.getDate() - 1);
  }
  while (true){
    if (cursor.getDay() === 0){ cursor.setDate(cursor.getDate() - 1); continue; } // Sunday: skip, doesn't break streak
    if (_wtCompletedDates.has(fmtDateKey(cursor))){
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

async function initWeekTaskPage(){
  _wtUser = await requireAuth('member');
  if (!_wtUser) return;
  injectChrome('weektask', _wtUser);

  const res = await fetch('data/weektasks.json');
  _wtTemplate = await res.json();

  await loadCompletions();
  renderWeek();
}

async function loadCompletions(){
  const rows = await DB.getTaskCompletions(_wtUser.username);
  _wtCompletedDates = new Set(rows.map(r => r.date));
}

function renderWeek(){
  const monday = getMonday(new Date());
  const today = new Date(); today.setHours(0,0,0,0);

  document.getElementById('wtStreak').textContent = calcTaskStreak();

  let doneThisWeek = 0;
  const cards = [];
  for (let i = 0; i < 6; i++){
    const date = new Date(monday); date.setDate(monday.getDate() + i);
    const key = fmtDateKey(date);
    const dow = i + 1; // 1=Mon..6=Sat
    const tpl = _wtTemplate[String(dow)] || { day:'', task:'', icon:'✅' };
    const isDone = _wtCompletedDates.has(key);
    const isToday = isSameDay(date, today);
    const isFuture = date.getTime() > today.getTime();
    if (isDone) doneThisWeek++;

    cards.push(`
      <div class="col-md-6 col-lg-4">
        <div class="card-b h-100 ${isToday ? 'wt-today' : ''}" style="${isDone ? 'border-color:#3ddc84;' : ''}">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <div class="text-faint" style="font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;">${tpl.day}${isToday ? ' · Today' : ''}</div>
              <div style="font-weight:600;font-size:1.05rem;">${tpl.icon} ${date.toLocaleDateString(undefined,{month:'short',day:'numeric'})}</div>
            </div>
            ${isDone ? '<div class="badge-green-soft">✓ Done</div>' : isFuture ? '<div class="badge-soft">Upcoming</div>' : ''}
          </div>
          <div class="text-dim mb-3" style="font-size:.9rem;">${tpl.task}</div>
          <button class="btn ${isDone ? 'btn-outline-teal' : 'btn-ember'} w-100" ${isFuture ? 'disabled' : ''} onclick="toggleTask('${key}')">
            ${isDone ? 'Mark incomplete' : 'Mark complete'}
          </button>
        </div>
      </div>`);
  }

  document.getElementById('wtWeekGrid').innerHTML = cards.join('');
  document.getElementById('wtWeekProgress').textContent = `${doneThisWeek} / 6 this week`;
  const pct = Math.round((doneThisWeek/6)*100);
  document.getElementById('wtWeekBar').style.width = pct + '%';
}

async function toggleTask(dateKey){
  try {
    if (_wtCompletedDates.has(dateKey)){
      await DB.unmarkTaskComplete(_wtUser.username, dateKey);
      _wtCompletedDates.delete(dateKey);
      toast('Marked incomplete');
    } else {
      await DB.markTaskComplete(_wtUser.username, dateKey);
      _wtCompletedDates.add(dateKey);
      toast('Nice — marked complete 🔥');
    }
    renderWeek();
  } catch (e){ console.error(e); toast('Could not update — try again'); }
}

window.addEventListener('DOMContentLoaded', initWeekTaskPage);

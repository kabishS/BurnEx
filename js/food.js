/* =========================================================================
   BURN-EX — food.js  (food.html)
   ========================================================================= */
let _foodUser = null;
let _foods = [];
let _activeCategory = 'all';

async function initFoodPage(){
  _foodUser = await requireAuth('member');
  if (!_foodUser) return;
  injectChrome('food', _foodUser);

  const res = await fetch('data/foods.json');
  _foods = await res.json();

  const sessions = await allSessions(_foodUser.username);
  const today = new Date(); today.setHours(0,0,0,0);
  const todayCal = sessions.filter(s => s.date >= today.getTime()).reduce((a,s)=>a+s.calories,0);
  const goal = _foodUser.goal || 400;
  const remaining = Math.max(0, goal - todayCal);

  document.getElementById('foodBurned').textContent = Math.round(todayCal);
  document.getElementById('foodGoal').textContent = goal;
  document.getElementById('foodRemaining').textContent = Math.round(remaining);

  renderFoodList();
}

function setFoodCategory(cat, btn){
  _activeCategory = cat;
  document.querySelectorAll('#foodCategoryTabs button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderFoodList();
}

function renderFoodList(){
  const list = _activeCategory === 'all' ? _foods : _foods.filter(f => f.category === _activeCategory);
  const grid = document.getElementById('foodGrid');
  if (!list.length){
    grid.innerHTML = `<div class="empty-state"><div class="ic">🍽️</div>No items in this category.</div>`;
    return;
  }
  grid.innerHTML = list.map(f => `
    <div class="col-md-6 col-lg-4">
      <div class="card-b h-100">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <div style="font-weight:600;">${f.name}</div>
            <div class="badge-soft mt-2" style="text-transform:capitalize;">${f.category}</div>
          </div>
          <div class="text-end">
            <div class="mono text-ember fw-bold">${f.calories}</div>
            <div class="text-faint" style="font-size:.7rem;">kcal</div>
          </div>
        </div>
        <div class="text-faint mt-2" style="font-size:.78rem;">~${f.protein}g protein</div>
      </div>
    </div>`).join('');
}

window.addEventListener('DOMContentLoaded', initFoodPage);

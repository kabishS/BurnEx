/* =========================================================================
   BURN-EX — food.js  (food.html)
   BMI speedometer + BMR daily burn + food suggestions ordered by BMI band.
   ========================================================================= */
let _foodUser = null;
let _foods = [];
let _activeCategory = 'all';
let _bmi = null;
let _bmiCat = null;

async function initFoodPage(){
  _foodUser = await requireAuth('member');
  if (!_foodUser) return;
  injectChrome('food', _foodUser);

  const res = await fetch('data/foods.json');
  _foods = await res.json();

  renderBmiSection();

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

/* -------------------- BMI gauge (speedometer) -------------------- */
function polarToCartesian(cx, cy, r, angleDeg){
  const rad = (angleDeg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function describeArc(cx, cy, r, startAngle, endAngle){
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

const GAUGE_MIN = 10, GAUGE_MAX = 40;
const GAUGE_ZONES = [
  { from:10,   to:18.5, color:'#29C6B7' }, // underweight
  { from:18.5, to:25,   color:'#3ddc84' }, // good weight
  { from:25,   to:30,   color:'#F2C744' }, // overweight
  { from:30,   to:40,   color:'#EF476F' }, // overfat
];
function valueToAngle(v){
  const clamped = Math.max(GAUGE_MIN, Math.min(GAUGE_MAX, v));
  return -90 + ((clamped - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN)) * 180;
}

function renderGauge(bmi){
  const cx = 120, cy = 130, r = 100, sw = 18;
  let zonesSvg = GAUGE_ZONES.map(z => {
    const a1 = valueToAngle(z.from), a2 = valueToAngle(z.to);
    return `<path d="${describeArc(cx, cy, r, a1, a2)}" stroke="${z.color}" stroke-width="${sw}" fill="none" opacity="0.9"/>`;
  }).join('');

  const needleAngle = valueToAngle(bmi);
  const tip = polarToCartesian(cx, cy, r - 26, needleAngle);

  return `
    <svg viewBox="0 0 240 150" xmlns="http://www.w3.org/2000/svg">
      ${zonesSvg}
      <line x1="${cx}" y1="${cy}" x2="${tip.x}" y2="${tip.y}" stroke="#EEF1F5" stroke-width="4" stroke-linecap="round"/>
      <circle cx="${cx}" cy="${cy}" r="8" fill="#FF6A39" stroke="#12151A" stroke-width="2"/>
    </svg>`;
}

function renderBmiSection(){
  const wrap = document.getElementById('bmiSectionBody');
  const weight = _foodUser.weight, height = _foodUser.height, age = _foodUser.age, gender = _foodUser.gender;

  if (!weight || !height){
    wrap.innerHTML = `<div class="empty-state"><div class="ic">📏</div>Add your weight and height in Profile to see your BMI.</div>`;
    return;
  }

  _bmi = calcBMI(weight, height);
  _bmiCat = bmiCategory(_bmi);
  const bmr = age ? calcBMR(weight, height, age, gender) : null;

  wrap.innerHTML = `
    <div class="row g-3 align-items-center">
      <div class="col-md-5">
        <div class="gauge-wrap">
          ${renderGauge(_bmi)}
          <div class="gauge-readout">
            <div class="bmi-val" style="color:${_bmiCat.color};">${_bmi.toFixed(1)}</div>
            <div class="bmi-lbl">BMI</div>
          </div>
        </div>
        <div class="gauge-zone-caps"><span>Under</span><span>Good</span><span>Over</span><span>Obese</span></div>
        <div class="bmi-alert ${_bmiCat.key}">
          ${_bmiCat.key==='under'?'⬇️':_bmiCat.key==='good'?'✅':_bmiCat.key==='over'?'⚠️':'🔴'}
          ${_bmiCat.label}
        </div>
      </div>
      <div class="col-md-7">
        <div class="row g-3">
          <div class="col-6">
            <div class="card-b stat-card">
              <span class="stat-icon">🔥</span>
              <div class="stat-label">BMR — burned per day</div>
              <div class="stat-value text-ember">${bmr ? Math.round(bmr) : '—'}</div>
              <div class="text-faint mt-1" style="font-size:.72rem;">Calories your body burns at rest, before any exercise</div>
            </div>
          </div>
          <div class="col-6">
            <div class="card-b stat-card">
              <span class="stat-icon">📏</span>
              <div class="stat-label">Weight / Height</div>
              <div class="stat-value" style="font-size:1.3rem;">${weight}kg · ${height}cm</div>
              <div class="text-faint mt-1" style="font-size:.72rem;"><a href="profile.html">Update in Profile →</a></div>
            </div>
          </div>
          <div class="col-12">
            <div class="text-dim" style="font-size:.85rem;">${bmiFoodNote(_bmiCat.key)}</div>
          </div>
        </div>
      </div>
    </div>`;
}

function bmiFoodNote(key){
  if (key === 'under') return 'You\u2019re in the underweight range — we\u2019ve prioritized calorie-dense, protein-rich options below to help you build up sustainably.';
  if (key === 'over')  return 'You\u2019re in the overweight range — we\u2019ve prioritized lighter, high-protein options below to help manage your intake.';
  if (key === 'obese') return 'You\u2019re in the overfat range — we\u2019ve prioritized the lowest-calorie, high-protein options below. Consider talking to a professional for a full plan.';
  return 'You\u2019re in a healthy weight range — here\u2019s a balanced mix of options to maintain it.';
}

/* -------------------- Food list -------------------- */
function setFoodCategory(cat, btn){
  _activeCategory = cat;
  document.querySelectorAll('#foodCategoryTabs button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderFoodList();
}

function renderFoodList(){
  let list = _activeCategory === 'all' ? [..._foods] : _foods.filter(f => f.category === _activeCategory);

  // Order by BMI band: underweight -> calorie-dense first, overweight/obese
  // -> lighter first, good weight -> leave in balanced default order.
  if (_bmiCat){
    if (_bmiCat.key === 'under') list.sort((a,b) => b.calories - a.calories);
    else if (_bmiCat.key === 'over' || _bmiCat.key === 'obese') list.sort((a,b) => a.calories - b.calories);
  }

  const grid = document.getElementById('foodGrid');
  if (!list.length){
    grid.innerHTML = `<div class="empty-state"><div class="ic">🍽️</div>No items in this category.</div>`;
    return;
  }
  grid.innerHTML = list.map((f, i) => {
    const recommended = _bmiCat && i < 3;
    return `
    <div class="col-md-6 col-lg-4">
      <div class="card-b h-100">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <div style="font-weight:600;">${f.name}</div>
            <div class="d-flex gap-2 mt-2 flex-wrap">
              <div class="badge-soft" style="text-transform:capitalize;">${f.category}</div>
              ${recommended ? `<div class="badge-green-soft">Recommended for you</div>` : ''}
            </div>
          </div>
          <div class="text-end">
            <div class="mono text-ember fw-bold">${f.calories}</div>
            <div class="text-faint" style="font-size:.7rem;">kcal</div>
          </div>
        </div>
        <div class="text-faint mt-2" style="font-size:.78rem;">~${f.protein}g protein</div>
      </div>
    </div>`;
  }).join('');
}

window.addEventListener('DOMContentLoaded', initFoodPage);

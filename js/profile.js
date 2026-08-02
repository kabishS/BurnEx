/* =========================================================================
   BURN-EX — profile.js  (profile.html)
   ========================================================================= */
let _profUser = null;

async function renderProfile(){
  const u = _profUser;
  const initials = (u.name||u.username).split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase();
  document.getElementById('profAvatar').textContent = initials;
  document.getElementById('profName').textContent = u.name || u.username;
  document.getElementById('profSince').textContent = 'Member since ' + new Date(u.joined||Date.now()).toLocaleDateString(undefined,{month:'long',year:'numeric'});
  const bmi = u.weight / Math.pow(u.height/100, 2);
  document.getElementById('profBmi').textContent = bmi.toFixed(1);
  document.getElementById('profWorkouts').textContent = (await allSessions(u.username)).length;

  document.getElementById('pfName').value = u.name || '';
  document.getElementById('pfAge').value = u.age || 25;
  document.getElementById('pfGender').value = u.gender || 'other';
  document.getElementById('pfWeight').value = u.weight || 70;
  document.getElementById('pfHeight').value = u.height || 170;
  document.getElementById('pfGoal').value = u.goal || 400;

  const gymBox = document.getElementById('gymStatusBox');
  if (u.role === 'admin'){
    const gyms = await DB.getGyms();
    const gym = gyms.find(g => g.ownerUsername === u.username);
    gymBox.innerHTML = gym ? `You own <b>${gym.name}</b> — share this code with members:<div class="gym-code-box mt-2">${gym.code}</div>` : `No gym found.`;
    document.getElementById('joinGymForm').classList.add('d-none');
  } else if (u.gymCode){
    const gym = await DB.getGymByCode(u.gymCode);
    gymBox.innerHTML = `Linked to <b>${gym ? gym.name : u.gymCode}</b><div class="gym-code-box mt-2">${u.gymCode}</div>`;
    document.getElementById('joinGymForm').classList.add('d-none');
  } else {
    gymBox.innerHTML = `You're not linked to a gym yet.`;
    document.getElementById('joinGymForm').classList.remove('d-none');
  }
}

async function joinGym(e){
  e.preventDefault();
  const code = document.getElementById('joinGymCode').value.trim().toUpperCase();
  try {
    const gym = await DB.getGymByCode(code);
    if (!gym){ toast('Gym code not found'); return false; }
    _profUser.gymCode = code;
    await DB.updateUser(_profUser);
    renderProfile();
    toast(`Joined ${gym.name}`);
  } catch (e){ console.error(e); toast('Could not join gym — try again'); }
  return false;
}

async function saveProfile(e){
  e.preventDefault();
  _profUser.name = document.getElementById('pfName').value.trim();
  _profUser.age = parseInt(document.getElementById('pfAge').value);
  _profUser.gender = document.getElementById('pfGender').value;
  _profUser.weight = parseFloat(document.getElementById('pfWeight').value);
  _profUser.height = parseFloat(document.getElementById('pfHeight').value);
  _profUser.goal = parseInt(document.getElementById('pfGoal').value);
  try {
    await DB.updateUser(_profUser);

    const msg = document.getElementById('profSavedMsg');
    msg.classList.remove('d-none');
    setTimeout(() => msg.classList.add('d-none'), 2000);
    renderProfile();
    injectChrome('profile', _profUser);
    toast('Profile updated');
  } catch (e){ console.error(e); toast('Could not save — try again'); }
  return false;
}

window.addEventListener('DOMContentLoaded', async () => {
  _profUser = await requireAuth();
  if (!_profUser) return;
  injectChrome('profile', _profUser);
  renderProfile();
});

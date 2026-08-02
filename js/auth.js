/* =========================================================================
   BURN-EX — auth.js  (index.html)
   ========================================================================= */

function switchAuthTab(tab){
  document.getElementById('tabLoginBtn').classList.toggle('active', tab==='login');
  document.getElementById('tabRegisterBtn').classList.toggle('active', tab==='register');
  document.getElementById('loginForm').classList.toggle('d-none', tab!=='login');
  document.getElementById('registerForm').classList.toggle('d-none', tab!=='register');
  document.getElementById('authError').classList.add('d-none');
}

function switchRole(role){
  document.getElementById('roleMember').checked = role==='member';
  document.getElementById('roleAdmin').checked = role==='admin';
  document.getElementById('gymNameGroup').classList.toggle('d-none', role!=='admin');
  document.getElementById('gymCodeGroup').classList.toggle('d-none', role!=='member');
}

function showAuthError(msg){
  const el = document.getElementById('authError');
  el.textContent = msg;
  el.classList.remove('d-none');
}

function setBusy(formEl, busy){
  formEl.querySelectorAll('button[type=submit]').forEach(b => b.disabled = busy);
}

async function handleRegister(e){
  e.preventDefault();
  const form = document.getElementById('registerForm');
  setBusy(form, true);
  try {
    const role = document.getElementById('roleAdmin').checked ? 'admin' : 'member';
    const username = document.getElementById('regUsername').value.trim().toLowerCase();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const weight = parseFloat(document.getElementById('regWeight').value);
    const height = parseFloat(document.getElementById('regHeight').value);

    const existing = await DB.getUserByUsername(username);
    if (existing){ showAuthError('That username is already taken.'); return false; }

    let gymCode = null;

    if (role === 'admin'){
      const gymName = document.getElementById('regGymName').value.trim();
      if (!gymName){ showAuthError('Please enter a gym name.'); return false; }
      gymCode = await genGymCode();
      await DB.createGym({ code: gymCode, name: gymName, ownerUsername: username, created: Date.now() });
    } else {
      const enteredCode = document.getElementById('regGymCode').value.trim().toUpperCase();
      if (enteredCode){
        const gym = await DB.getGymByCode(enteredCode);
        if (!gym){ showAuthError('That gym code was not found. Leave it blank to join later from your profile.'); return false; }
        gymCode = enteredCode;
      }
    }

    await DB.createUser({
      username, password: simpleHash(password), role, name, email,
      age: 25, gender: 'other', weight, height, goal: 400,
      gymCode, joined: Date.now()
    });
    DB.setSession(username);
    window.location.href = role === 'admin' ? 'admin.html' : 'dashboard.html';
  } catch (err){
    console.error(err);
    showAuthError('Something went wrong reaching the database. Please try again.');
  } finally {
    setBusy(form, false);
  }
  return false;
}

async function handleLogin(e){
  e.preventDefault();
  const form = document.getElementById('loginForm');
  setBusy(form, true);
  try {
    const username = document.getElementById('loginUsername').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const found = await DB.getUserByUsername(username);
    if (!found || found.password !== simpleHash(password)){ showAuthError('Incorrect username or password.'); return false; }
    DB.setSession(username);
    window.location.href = found.role === 'admin' ? 'admin.html' : 'dashboard.html';
  } catch (err){
    console.error(err);
    showAuthError('Something went wrong reaching the database. Please try again.');
  } finally {
    setBusy(form, false);
  }
  return false;
}

window.addEventListener('DOMContentLoaded', async () => {
  if (DB.session()) {
    const u = await getCurrentUser();
    if (u) window.location.href = u.role === 'admin' ? 'admin.html' : 'dashboard.html';
  }
});

/* =========================================================================
   BURN-EX — forgot-password.js  (forgot-password.html)
   ========================================================================= */
let _resetUser = null;

function showResetError(msg){
  const el = document.getElementById('resetError');
  el.textContent = msg;
  el.classList.remove('d-none');
}

async function handleVerify(e){
  e.preventDefault();
  const form = document.getElementById('verifyForm');
  const btn = form.querySelector('button[type=submit]');
  btn.disabled = true;
  try {
    const username = document.getElementById('fpUsername').value.trim().toLowerCase();
    const email = document.getElementById('fpEmail').value.trim().toLowerCase();
    const user = await DB.getUserByUsername(username);
    if (!user || (user.email || '').toLowerCase() !== email){
      showResetError('We couldn\u2019t match that username and email. Double-check both and try again.');
      return false;
    }
    _resetUser = user;
    document.getElementById('resetError').classList.add('d-none');
    form.classList.add('d-none');
    document.getElementById('resetForm').classList.remove('d-none');
  } catch (err){
    console.error(err);
    showResetError('Something went wrong reaching the database. Please try again.');
  } finally {
    btn.disabled = false;
  }
  return false;
}

async function handleReset(e){
  e.preventDefault();
  const form = document.getElementById('resetForm');
  const btn = form.querySelector('button[type=submit]');
  btn.disabled = true;
  try {
    const newPassword = document.getElementById('fpNewPassword').value;
    _resetUser.password = simpleHash(newPassword);
    await DB.updateUser(_resetUser);
    toast('Password updated — you can log in now.');
    setTimeout(() => { window.location.href = 'index.html'; }, 1200);
  } catch (err){
    console.error(err);
    showResetError('Something went wrong saving your new password. Please try again.');
    btn.disabled = false;
  }
  return false;
}

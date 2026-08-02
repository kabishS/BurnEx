/* =========================================================================
   BURN-EX — workout.js  (workout.html)
   ========================================================================= */
let currentUser = null;
let EXERCISES = {};
let pose = null;
let cameraRunning = false;
let selectedExercise = null;
let repState = { stage:'up', reps:0 };
let sessionTimer = null, sessionStart = null, elapsedSec = 0;
let sessionCalories = 0;

async function initWorkoutPage(){
  currentUser = await requireAuth('member');
  if (!currentUser) return;
  injectChrome('workout', currentUser);

  const res = await fetch('data/exercises.json');
  EXERCISES = await res.json();

  const picker = document.getElementById('exercisePicker');
  picker.innerHTML = Object.entries(EXERCISES).map(([key, cfg]) => `
    <button class="exercise-pill" data-ex="${key}" onclick="selectExercise('${key}')">
      ${cfg.icon} ${cfg.name} <span class="text-faint ms-auto" style="font-size:.72rem;">~${cfg.met} MET</span>
    </button>`).join('');
}

function selectExercise(ex){
  if (cameraRunning) return;
  selectedExercise = ex;
  document.querySelectorAll('.exercise-pill').forEach(b => b.classList.toggle('active', b.dataset.ex === ex));
  document.getElementById('startWorkoutBtn').disabled = false;
  document.getElementById('workoutMsg').textContent = `Ready to track ${EXERCISES[ex].name}. Camera will request permission on start.`;
}

/* Only true for the frames where MediaPipe actually finds a person in
   view — used to gate calorie accrual so idle/empty-frame time doesn't
   silently rack up calories (see stopWorkout timer below). */
window._personDetected = false;

function onPoseResults(results){
  const canvas = document.getElementById('outputCanvas');
  const video = document.getElementById('inputVideo');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  window._personDetected = !!results.poseLandmarks;

  if (results.poseLandmarks){
    drawPoseSkeleton(ctx, results.poseLandmarks);

    if (selectedExercise && cameraRunning){
      const cfg = EXERCISES[selectedExercise];
      const lm = results.poseLandmarks;
      const [ia, ib, ic] = cfg.joints;
      if (lm[ia] && lm[ib] && lm[ic]){
        const angle = calcAngle(lm[ia], lm[ib], lm[ic]);
        if (updateRepState(repState, angle, cfg.lowT, cfg.highT)){
          document.getElementById('repCount').textContent = repState.reps;
        }
      }
      const intensity = computeIntensity(lm);
      document.getElementById('intensityLabel').textContent = 'Intensity: ' + intensityLabel(intensity);
      window._currentIntensity = intensity;
    }
  } else if (cameraRunning) {
    document.getElementById('intensityLabel').textContent = 'Intensity: — (step into frame)';
  }
  ctx.restore();
}

async function startWorkout(){
  if (!selectedExercise) return;
  pose = createPose(onPoseResults);
  const video = document.getElementById('inputVideo');
  document.getElementById('cameraPlaceholder').classList.add('d-none');
  document.getElementById('hudOverlay').classList.remove('d-none');
  document.getElementById('workoutMsg').textContent = 'Requesting camera access…';

  try {
    await startCamera(video, pose);
  } catch (err){
    document.getElementById('cameraPlaceholder').classList.remove('d-none');
    document.getElementById('hudOverlay').classList.add('d-none');
    document.getElementById('workoutMsg').textContent = 'Camera access denied or unavailable. Please allow camera permissions.';
    toast('Could not access camera');
    return;
  }

  cameraRunning = true;
  repState = { stage:'up', reps:0 };
  sessionCalories = 0;
  elapsedSec = 0;
  sessionStart = Date.now();
  resetIntensity();
  window._personDetected = false;
  document.getElementById('repCount').textContent = '0';
  document.getElementById('calCount').textContent = '0.0';
  document.getElementById('startWorkoutBtn').classList.add('d-none');
  document.getElementById('stopWorkoutBtn').classList.remove('d-none');
  document.querySelectorAll('.exercise-pill').forEach(b => b.disabled = true);
  document.getElementById('workoutMsg').textContent = 'Step into frame to start tracking.';

  sessionTimer = setInterval(() => {
    elapsedSec++;
    const m = String(Math.floor(elapsedSec/60)).padStart(2,'0');
    const s = String(elapsedSec%60).padStart(2,'0');
    document.getElementById('hudTimer').textContent = `${m}:${s}`;

    // Bug fix: only accrue calories on ticks where a person was actually
    // detected in frame this second. Previously this ran unconditionally,
    // so simply having the session open (camera on, nobody moving or even
    // in frame yet) still silently added calories every second.
    if (window._personDetected){
      const cfg = EXERCISES[selectedExercise];
      const weight = currentUser.weight || 70;
      const intensity = window._currentIntensity || 1.0;
      sessionCalories += calcCaloriesPerSecond(cfg.met, weight, intensity);
      document.getElementById('calCount').textContent = sessionCalories.toFixed(1);
      if (document.getElementById('workoutMsg').textContent !== 'Session saved to your history.'){
        document.getElementById('workoutMsg').textContent = 'Tracking live — move into frame.';
      }
    }
  }, 1000);
}

function stopWorkout(save){
  if (!cameraRunning){ stopCamera(); return; }
  clearInterval(sessionTimer);
  stopCamera();
  cameraRunning = false;

  document.getElementById('cameraPlaceholder').classList.remove('d-none');
  document.getElementById('hudOverlay').classList.add('d-none');
  document.getElementById('startWorkoutBtn').classList.remove('d-none');
  document.getElementById('stopWorkoutBtn').classList.add('d-none');
  document.querySelectorAll('.exercise-pill').forEach(b => b.disabled = false);
  const ctx = document.getElementById('outputCanvas').getContext('2d');
  ctx.clearRect(0, 0, 9999, 9999);

  if (save && selectedExercise && elapsedSec > 0){
    const session = {
      id: uid(), date: sessionStart || Date.now(), exercise: selectedExercise,
      reps: repState.reps, duration: elapsedSec, calories: sessionCalories
    };
    DB.addWorkout(currentUser.username, session)
      .then(() => {
        toast(`Saved: ${session.reps} reps · ${session.calories.toFixed(1)} kcal`);
        document.getElementById('workoutMsg').textContent = 'Session saved to your history.';
      })
      .catch(err => {
        console.error(err);
        toast('Could not save session — check your connection and try again');
      });
  } else {
    document.getElementById('workoutMsg').textContent = 'Select an exercise to begin';
  }
}

window.addEventListener('DOMContentLoaded', initWorkoutPage);
window.addEventListener('beforeunload', () => stopWorkout(false));

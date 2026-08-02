/* =========================================================================
   BURN-EX — reps.js
   Joint-angle rep counter shared by every tracked exercise.
   ========================================================================= */

/** Angle at vertex b, formed by points a-b-c (each {x,y}), in degrees. */
function calcAngle(a, b, c){
  const rad = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let deg = Math.abs(rad * 180 / Math.PI);
  if (deg > 180) deg = 360 - deg;
  return deg;
}

/** Advances a { stage:'up'|'down', reps:number } state machine given the
 *  current joint angle and the exercise's low/high thresholds.
 *  Returns true the instant a rep completes. */
function updateRepState(state, angle, lowT, highT){
  if (angle < lowT && state.stage === 'up'){ state.stage = 'down'; }
  if (angle > highT && state.stage === 'down'){
    state.stage = 'up';
    state.reps++;
    return true;
  }
  return false;
}

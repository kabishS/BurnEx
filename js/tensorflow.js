/* =========================================================================
   BURN-EX — tensorflow.js  (exercise intensity detection)
   Uses TensorFlow.js purely as a tensor-math engine (no downloaded model)
   to turn frame-to-frame landmark velocity into a smoothed 0.8x–1.3x
   "intensity" multiplier, entirely on-device.
   ========================================================================= */

let _prevLandmarks = null;
let _intensityEMA = 1.0;

/** idxs = shoulders, wrists, hips, ankles — the joints most indicative of
 *  whole-body movement speed regardless of which exercise is selected. */
const INTENSITY_JOINTS = [11, 12, 15, 16, 23, 24, 27, 28];

function computeIntensity(landmarks){
  if (!_prevLandmarks){ _prevLandmarks = landmarks; return _intensityEMA; }

  const intensity = tf.tidy(() => {
    const curr = tf.tensor2d(INTENSITY_JOINTS.map(i => [landmarks[i].x, landmarks[i].y]));
    const prev = tf.tensor2d(INTENSITY_JOINTS.map(i => [_prevLandmarks[i].x, _prevLandmarks[i].y]));
    const diff = curr.sub(prev);
    const dist = diff.square().sum(1).sqrt();
    return dist.mean().dataSync()[0];
  });

  _prevLandmarks = landmarks;
  const raw = 0.85 + Math.min(intensity * 22, 0.55);
  _intensityEMA = _intensityEMA * 0.85 + raw * 0.15;
  return _intensityEMA;
}

function resetIntensity(){
  _prevLandmarks = null;
  _intensityEMA = 1.0;
}

function intensityLabel(intensity){
  return intensity > 1.12 ? 'High 🔥' : intensity > 0.98 ? 'Moderate' : 'Light';
}

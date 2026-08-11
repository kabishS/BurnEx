/* =========================================================================
   BURN-EX — mediapipe.js
   Thin wrapper around @mediapipe/pose + @mediapipe/camera_utils so
   workout.js doesn't have to touch the MediaPipe API directly.
   ========================================================================= */

let _poseInstance = null;
let _cameraInstance = null;

/** Create (once) and return the shared Pose model, wiring onResults. */
function createPose(onResults){
  if (_poseInstance) return _poseInstance;
  _poseInstance = new Pose({
    locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${f}`
  });
  _poseInstance.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    minDetectionConfidence: 0.55,
    minTrackingConfidence: 0.5
  });
  _poseInstance.onResults(onResults);
  return _poseInstance;
}

/** Start the webcam feed and begin streaming frames into the pose model. */
async function startCamera(videoEl, pose){
  _cameraInstance = new Camera(videoEl, {
    onFrame: async () => { await pose.send({ image: videoEl }); },
    width: 640, height: 480
  });
  await _cameraInstance.start();
  return _cameraInstance;
}

function stopCamera(){
  if (_cameraInstance){ try { _cameraInstance.stop(); } catch(e){} _cameraInstance = null; }
}

/** Draw the pose skeleton onto a canvas (theme-colored). */
function drawPoseSkeleton(ctx, landmarks){
  drawConnectors(ctx, landmarks, POSE_CONNECTIONS, { color:'#29C6B7', lineWidth:3 });
  drawLandmarks(ctx, landmarks, { color:'#FF6A39', lineWidth:1, radius:3 });
}

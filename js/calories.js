/* =========================================================================
   BURN-EX — calories.js
   Standard MET-based calorie estimation:
     kcal/min = MET * 3.5 * weight(kg) / 200
   ========================================================================= */

/** Per-second calorie burn for a live workout, scaled by the live
 *  movement-intensity multiplier from tensorflow.js. */
function calcCaloriesPerSecond(met, weightKg, intensity = 1){
  return (met * 3.5 * weightKg / 200) / 60 * intensity;
}

/** Total calories for a logged walking session of a given duration. */
function calcWalkingCalories(durationMin, weightKg, met = 3.5){
  return (met * 3.5 * weightKg / 200) * durationMin;
}

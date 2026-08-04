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

/** Body Mass Index — weight(kg) / height(m)^2 */
function calcBMI(weightKg, heightCm){
  const h = heightCm / 100;
  return weightKg / (h * h);
}

/** Standard adult BMI bands, each with a color used by the gauge/badges. */
function bmiCategory(bmi){
  if (bmi < 18.5) return { key:'under', label:'Underweight', color:'#29C6B7' };
  if (bmi < 25)   return { key:'good',  label:'Good weight', color:'#3ddc84' };
  if (bmi < 30)   return { key:'over',  label:'Overweight',  color:'#F2C744' };
  return               { key:'obese', label:'Overfat',      color:'#EF476F' };
}

/** Basal Metabolic Rate via the Mifflin-St Jeor equation — the calories
 *  the body burns per day at complete rest. 'other' gender uses the
 *  midpoint of the male/female offset. */
function calcBMR(weightKg, heightCm, age, gender){
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'male') return base + 5;
  if (gender === 'female') return base - 161;
  return base - 78;
}

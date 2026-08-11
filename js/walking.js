/* =========================================================================
   BURN-EX — walking.js  (walking.html)
   Manual walk logging + a start→end route map (Leaflet + OpenStreetMap,
   no API key required). Geocoding via Nominatim, routing via the public
   OSRM foot-routing demo server, falling back to a straight line between
   the two points if either service is unreachable.
   ========================================================================= */
let _walkUser = null;
let _metValues = {};
let _walkMap = null;
let _walkMapLayer = null;

async function initWalkingPage(){
  _walkUser = await requireAuth('member');
  if (!_walkUser) return;
  injectChrome('walking', _walkUser);

  const res = await fetch('data/met-values.json');
  _metValues = await res.json();

  const select = document.getElementById('walkPace');
  select.innerHTML = Object.entries(_metValues).map(([key, m]) => `<option value="${key}">${m.label}</option>`).join('');

  initWalkMap();
  await renderWalkSummary();
  await renderWalkList();
}

function initWalkMap(){
  _walkMap = L.map('walkMap', { zoomControl:true, attributionControl:true }).setView([20, 0], 2);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap, © CARTO',
    maxZoom: 19
  }).addTo(_walkMap);
}

async function geocode(place){
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(place)}`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  const data = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

async function fetchRoute(start, end){
  try {
    const url = `https://router.project-osrm.org/route/v1/foot/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes && data.routes[0]) {
      return data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]); // [lat,lng]
    }
  } catch (e){ console.warn('OSRM route lookup failed, falling back to straight line', e); }
  return [[start.lat, start.lng], [end.lat, end.lng]];
}

function drawRoute(start, end, path, startLabel, endLabel){
  if (_walkMapLayer) { _walkMap.removeLayer(_walkMapLayer); }
  _walkMapLayer = L.layerGroup().addTo(_walkMap);

  L.polyline(path, { color:'#FF6A39', weight:4, opacity:.9 }).addTo(_walkMapLayer);
  L.circleMarker([start.lat, start.lng], { radius:8, color:'#29C6B7', fillColor:'#29C6B7', fillOpacity:1 })
    .bindTooltip(startLabel || 'Start', { permanent:false }).addTo(_walkMapLayer);
  L.circleMarker([end.lat, end.lng], { radius:8, color:'#FF6A39', fillColor:'#FF6A39', fillOpacity:1 })
    .bindTooltip(endLabel || 'End', { permanent:false }).addTo(_walkMapLayer);

  _walkMap.fitBounds(L.latLngBounds(path), { padding:[30,30] });
}

async function renderWalkSummary(){
  const walks = await DB.getWalks(_walkUser.username);
  const today = new Date(); today.setHours(0,0,0,0);
  const todayCal = walks.filter(w => w.date >= today.getTime()).reduce((a,w)=>a+w.calories,0);
  const todayDist = walks.filter(w => w.date >= today.getTime()).reduce((a,w)=>a+(w.distance||0),0);
  document.getElementById('walkTodayCal').textContent = Math.round(todayCal);
  document.getElementById('walkTodayDist').textContent = todayDist.toFixed(1);
  document.getElementById('walkTotalCount').textContent = walks.length;
}

async function logWalk(e){
  e.preventDefault();
  const form = document.getElementById('walkForm');
  const submitBtn = form.querySelector('button[type=submit]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Logging…';

  try {
    const duration = parseFloat(document.getElementById('walkDuration').value);
    let distance = parseFloat(document.getElementById('walkDistance').value) || 0;
    const paceKey = document.getElementById('walkPace').value;
    const startPlace = document.getElementById('walkStartPlace').value.trim();
    const endPlace = document.getElementById('walkEndPlace').value.trim();
    const met = _metValues[paceKey].met;
    const weight = _walkUser.weight || 70;
    const calories = calcWalkingCalories(duration, weight, met);

    const walk = { id: uid(), date: Date.now(), duration: duration*60, distance, pace: paceKey, calories };

    if (startPlace && endPlace){
      document.getElementById('walkMapStatus').textContent = 'Locating start and end points…';
      const [start, end] = await Promise.all([geocode(startPlace), geocode(endPlace)]);
      if (start && end){
        walk.startPlace = startPlace; walk.endPlace = endPlace;
        walk.startLat = start.lat; walk.startLng = start.lng;
        walk.endLat = end.lat; walk.endLng = end.lng;
        if (!distance){
          // rough straight-line distance in km if the user didn't enter one
          const R = 6371;
          const dLat = (end.lat-start.lat) * Math.PI/180, dLng = (end.lng-start.lng) * Math.PI/180;
          const a = Math.sin(dLat/2)**2 + Math.cos(start.lat*Math.PI/180)*Math.cos(end.lat*Math.PI/180)*Math.sin(dLng/2)**2;
          distance = R * 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          walk.distance = distance;
        }
        document.getElementById('walkMapStatus').textContent = 'Fetching route…';
        const path = await fetchRoute(start, end);
        drawRoute(start, end, path, startPlace, endPlace);
        document.getElementById('walkMapStatus').textContent = `${startPlace} → ${endPlace}`;
      } else {
        document.getElementById('walkMapStatus').textContent = 'Could not locate one of those places — walk saved without a route.';
      }
    }

    await DB.addWalk(_walkUser.username, walk);
    form.reset();
    await renderWalkSummary();
    await renderWalkList();
    toast(`Logged: ${calories.toFixed(1)} kcal`);
  } catch (err){
    console.error(err);
    toast('Could not log walk — try again');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Log walk';
  }
  return false;
}

async function viewWalkRoute(id){
  const walks = await DB.getWalks(_walkUser.username);
  const w = walks.find(x => x.id === id);
  if (!w || !w.startLat){ toast('No route saved for this walk'); return; }
  const start = { lat:w.startLat, lng:w.startLng }, end = { lat:w.endLat, lng:w.endLng };
  document.getElementById('walkMapStatus').textContent = 'Fetching route…';
  const path = await fetchRoute(start, end);
  drawRoute(start, end, path, w.startPlace, w.endPlace);
  document.getElementById('walkMapStatus').textContent = `${w.startPlace} → ${w.endPlace}`;
  document.getElementById('walkMap').scrollIntoView({ behavior:'smooth', block:'center' });
}

async function renderWalkList(){
  const walks = (await DB.getWalks(_walkUser.username)).sort((a,b) => b.date-a.date).slice(0,10);
  const body = document.getElementById('walkListBody');
  document.getElementById('walkListEmpty').classList.toggle('d-none', walks.length > 0);
  body.innerHTML = walks.map(w => `
    <tr>
      <td class="text-dim">${new Date(w.date).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</td>
      <td class="mono">${fmtDuration(w.duration)}</td>
      <td class="mono">${(w.distance||0).toFixed(1)} km</td>
      <td>${w.startPlace && w.endPlace ? `<span class="text-dim" style="font-size:.82rem;">${w.startPlace} → ${w.endPlace}</span>` : '<span class="text-faint">—</span>'}</td>
      <td class="mono text-ember">${w.calories.toFixed(1)}</td>
      <td class="d-flex gap-1">
        ${w.startLat ? `<button class="icon-btn" onclick="viewWalkRoute('${w.id}')" title="View route">🗺️</button>` : ''}
        <button class="icon-btn" onclick="deleteWalk('${w.id}')" title="Delete">✕</button>
      </td>
    </tr>`).join('');
}

async function deleteWalk(id){
  try {
    await DB.deleteWalk(id);
    await renderWalkSummary();
    await renderWalkList();
    toast('Walk deleted');
  } catch (e){ console.error(e); toast('Could not delete — try again'); }
}

window.addEventListener('DOMContentLoaded', initWalkingPage);

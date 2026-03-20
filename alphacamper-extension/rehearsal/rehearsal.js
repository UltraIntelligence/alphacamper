const SITES = [
  { id: 1, name: 'Riverside Retreat #12', type: 'Tent', amenities: 'Waterfront, Shade', icon: '\u{1F3D5}\uFE0F' },
  { id: 2, name: "Eagle's Nest #7", type: 'Tent/RV', amenities: 'Electric hookup', icon: '\u{1F985}' },
  { id: 3, name: 'Sunset View #3', type: 'Tent', amenities: 'Lake view, Fire pit', icon: '\u{1F305}' },
  { id: 4, name: 'Bear Creek #21', type: 'RV only', amenities: 'Full hookup, Pull-through', icon: '\u{1F43B}' },
  { id: 5, name: 'Meadow Loop #15', type: 'Tent', amenities: 'Group area nearby, Shade', icon: '\u{1F33F}' },
  { id: 6, name: 'Pine Ridge #9', type: 'Tent/RV', amenities: 'Partial hookup, Pets OK', icon: '\u{1F332}' },
];

let selectedSite = null;
let timerStart = null;
let timerInterval = null;
let screenTimes = [];
let screenStart = null;
let currentScreen = 1;

const params = new URLSearchParams(window.location.search);
const missionId = params.get('missionId');

function startTimer() {
  timerStart = performance.now();
  screenStart = timerStart;
  const timerEl = document.getElementById('timer');
  timerInterval = setInterval(() => {
    timerEl.textContent = ((performance.now() - timerStart) / 1000).toFixed(1) + 's';
  }, 100);
}

function recordScreenTime() {
  screenTimes.push((performance.now() - screenStart) / 1000);
  screenStart = performance.now();
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
  recordScreenTime();
  return (performance.now() - timerStart) / 1000;
}

function goToScreen(num) {
  if (currentScreen !== num) recordScreenTime();
  currentScreen = num;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + num).classList.add('active');
  window.scrollTo(0, 0);
}

function renderSiteGrid() {
  const grid = document.getElementById('site-grid');
  SITES.forEach(site => {
    const card = document.createElement('div');
    card.className = 'site-card';

    const img = document.createElement('div');
    img.className = 'site-image';
    img.textContent = site.icon;

    const body = document.createElement('div');
    body.className = 'site-body';
    const h3 = document.createElement('h3');
    h3.textContent = site.name;
    const p = document.createElement('p');
    p.textContent = site.type + ' \u00b7 ' + site.amenities;
    const badges = document.createElement('div');
    badges.className = 'site-badges';
    const b1 = document.createElement('span');
    b1.className = 'badge';
    b1.textContent = site.type;
    const b2 = document.createElement('span');
    b2.className = 'badge badge-available';
    b2.textContent = 'Available';
    badges.append(b1, b2);
    body.append(h3, p, badges);

    card.append(img, body);
    card.addEventListener('click', () => {
      selectedSite = site;
      showSiteDetail();
    });
    grid.appendChild(card);
  });
}

function showSiteDetail() {
  document.getElementById('detail-name').textContent = selectedSite.name;
  document.getElementById('detail-image').textContent = selectedSite.icon;
  document.getElementById('detail-type').textContent = 'Type: ' + selectedSite.type;
  document.getElementById('detail-amenities').textContent = 'Amenities: ' + selectedSite.amenities;
  const today = new Date();
  const next = new Date(today);
  next.setMonth(next.getMonth() + 1);
  document.getElementById('r-checkin').value = fmtDate(next);
  const co = new Date(next);
  co.setDate(co.getDate() + 3);
  document.getElementById('r-checkout').value = fmtDate(co);
  goToScreen(2);
}

document.getElementById('check-avail-btn').addEventListener('click', () => goToScreen(3));

document.getElementById('add-cart-btn').addEventListener('click', () => {
  const checkin = document.getElementById('r-checkin').value;
  const checkout = document.getElementById('r-checkout').value;
  const equipment = document.getElementById('r-equipment').value;
  const party = document.getElementById('r-party').value || '2';
  const nights = checkin && checkout
    ? Math.max(1, Math.round((new Date(checkout) - new Date(checkin)) / 86400000))
    : 3;

  document.getElementById('cart-site').textContent = selectedSite.name;
  const details = document.getElementById('cart-details');
  details.textContent = '';
  ['Check-in: ' + (checkin || 'Not set'),
   'Check-out: ' + (checkout || 'Not set'),
   'Equipment: ' + equipment,
   'Party size: ' + party
  ].forEach(text => {
    const div = document.createElement('div');
    div.textContent = text;
    details.appendChild(div);
  });
  document.getElementById('cart-total').textContent =
    'Total: $25.00/night \u00d7 ' + nights + ' nights = $' + (25 * nights).toFixed(2);
  goToScreen(4);
});

document.getElementById('complete-btn').addEventListener('click', async () => {
  const totalTime = stopTimer();
  await saveResults(totalTime);
  showConfirmation(totalTime);
});

async function showConfirmation(totalTime) {
  const labels = ['Search', 'Detail', 'Form', 'Cart', 'Confirm'];
  const card = document.getElementById('results-card');
  card.textContent = '';

  const h4 = document.createElement('h4');
  h4.textContent = 'Your Results';
  card.appendChild(h4);

  const total = document.createElement('div');
  total.className = 'result-total';
  total.textContent = totalTime.toFixed(1) + 's';
  card.appendChild(total);

  screenTimes.forEach((t, i) => {
    const row = document.createElement('div');
    row.className = 'result-row';
    const lbl = document.createElement('span');
    lbl.textContent = labels[i] || 'Screen ' + (i + 1);
    const val = document.createElement('span');
    val.textContent = t.toFixed(1) + 's';
    row.append(lbl, val);
    card.appendChild(row);
  });

  if (missionId) {
    const mission = await Storage.getMission(missionId);
    if (mission && mission.rehearsalResults.bestTime !== null && mission.rehearsalResults.bestTime !== totalTime) {
      const prev = mission.rehearsalResults.bestTime;
      const row = document.createElement('div');
      row.className = 'result-row';
      const lbl = document.createElement('span');
      lbl.textContent = 'Previous best';
      const val = document.createElement('span');
      val.textContent = prev.toFixed(1) + 's';
      row.append(lbl, val);
      card.appendChild(row);
      const diff = prev - totalTime;
      if (diff > 0) {
        const imp = document.createElement('div');
        imp.className = 'result-row';
        imp.style.color = 'var(--green)';
        imp.style.fontWeight = '600';
        const il = document.createElement('span');
        il.textContent = 'Improvement';
        const iv = document.createElement('span');
        iv.textContent = ((diff / prev) * 100).toFixed(0) + '% faster!';
        imp.append(il, iv);
        card.appendChild(imp);
      }
    }
  }

  document.getElementById('profile-saved').style.display = 'block';
  goToScreen(5);
}

async function saveResults(totalTime) {
  const fields = {
    firstName: document.getElementById('r-first').value,
    lastName: document.getElementById('r-last').value,
    email: document.getElementById('r-email').value,
    phone: document.getElementById('r-phone').value,
    vehiclePlate: document.getElementById('r-plate').value,
    equipmentType: document.getElementById('r-equipment').value,
    partySize: parseInt(document.getElementById('r-party').value) || 2,
    vehicleLength: '',
  };
  const existing = await Storage.getProfile();
  Object.keys(fields).forEach(k => { if (fields[k]) existing[k] = fields[k]; });
  await Storage.setProfile(existing);
  if (missionId) {
    await Missions.updateRehearsalResults(missionId, { totalTime, screenTimes });
  }
}

document.getElementById('practice-again-btn').addEventListener('click', () => {
  selectedSite = null;
  screenTimes = [];
  currentScreen = 1;
  ['r-first','r-last','r-email','r-phone','r-plate','r-party'].forEach(id => {
    document.getElementById(id).value = '';
  });
  goToScreen(1);
  startTimer();
});

document.getElementById('back-btn').addEventListener('click', () => window.close());

function fmtDate(d) { return d.toISOString().split('T')[0]; }

renderSiteGrid();
startTimer();

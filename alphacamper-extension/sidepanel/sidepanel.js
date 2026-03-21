let currentView = 'dashboard';
let currentMissionId = null;
let countdownIntervals = [];

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const view = tab.dataset.view;
    if (view === 'mission' && !currentMissionId) { switchView('dashboard'); return; }
    switchView(view);
  });
});

function switchView(viewName) {
  clearCountdowns();
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const viewEl = document.getElementById('view-' + viewName);
  if (viewEl) viewEl.classList.add('active');
  const tabEl = document.querySelector('.tab[data-view="' + viewName + '"]');
  if (tabEl) tabEl.classList.add('active');
  currentView = viewName;
  if (viewName === 'dashboard') loadDashboard();
  if (viewName === 'mission') loadMissionDetail();
  if (viewName === 'profile') loadProfile();
  if (viewName === 'settings') loadSettings();
  if (viewName === 'watching') loadWatching();
  if (viewName === 'planner') loadPlanner();
}

function clearCountdowns() {
  countdownIntervals.forEach(id => clearInterval(id));
  countdownIntervals = [];
}

async function loadDashboard() {
  const timeEl = document.getElementById('current-time');
  const updateTime = () => {
    const now = new Date();
    timeEl.textContent = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map(v => String(v).padStart(2, '0')).join(':');
  };
  updateTime();
  countdownIntervals.push(setInterval(updateTime, 1000));

  const profile = await Storage.getProfile();
  const profileDone = profile.firstName && profile.email;
  const profilePill = document.getElementById('profile-status');
  profilePill.textContent = profileDone ? 'Profile: \u2713 Complete' : 'Profile: Set up \u2192';
  profilePill.onclick = () => { if (!profileDone) switchView('profile'); };

  const missions = await Storage.getMissions();
  document.getElementById('missions-count').textContent = 'Missions: ' + missions.length;

  const nextCard = document.getElementById('next-mission-card');
  const noMsg = document.getElementById('no-missions-msg');
  const listEl = document.getElementById('mission-list');
  listEl.textContent = '';

  if (missions.length === 0) {
    nextCard.style.display = 'none';
    noMsg.style.display = 'block';
  } else {
    noMsg.style.display = 'none';
    const upcoming = missions
      .filter(m => m.bookingWindow.date && m.status !== 'completed' && m.status !== 'failed')
      .sort((a, b) => (a.bookingWindow.date > b.bookingWindow.date ? 1 : -1));

    if (upcoming.length > 0) {
      nextCard.style.display = 'block';
      document.getElementById('next-mission-name').textContent = upcoming[0].name;
      const cdEl = document.getElementById('next-mission-countdown');
      if (upcoming[0].bookingWindow.date && upcoming[0].bookingWindow.time) {
        countdownIntervals.push(Countdown.start(cdEl, upcoming[0].bookingWindow.date, upcoming[0].bookingWindow.time, upcoming[0].bookingWindow.timezone, function(){}));
      } else {
        cdEl.textContent = 'Set booking window \u2192';
      }
      nextCard.onclick = () => openMission(upcoming[0].id);
    } else {
      nextCard.style.display = 'none';
    }

    missions.forEach(m => {
      const el = document.createElement('div');
      el.className = 'mission-list-item';
      const info = document.createElement('div');
      info.className = 'mission-info';
      const h4 = document.createElement('h4');
      h4.textContent = m.name;
      const p = document.createElement('p');
      p.textContent = m.targets.length + ' target' + (m.targets.length !== 1 ? 's' : '') + ' \u00b7 ' + (m.bookingWindow.date || 'No date set');
      info.appendChild(h4);
      info.appendChild(p);
      const badge = document.createElement('span');
      badge.className = 'status-badge status-badge-' + m.status;
      badge.textContent = m.status;
      el.appendChild(info);
      el.appendChild(badge);
      el.addEventListener('click', () => openMission(m.id));
      listEl.appendChild(el);
    });
  }
}

function openMission(id) {
  currentMissionId = id;
  switchView('mission');
}

document.getElementById('create-mission-btn').addEventListener('click', async () => {
  const mission = await Missions.create('New Mission');
  openMission(mission.id);
});

async function loadMissionDetail() {
  if (!currentMissionId) { switchView('dashboard'); return; }
  const mission = await Storage.getMission(currentMissionId);
  if (!mission) { switchView('dashboard'); return; }

  document.getElementById('mission-name-input').value = mission.name;
  const sb = document.getElementById('mission-status-badge');
  sb.textContent = mission.status;
  sb.className = 'status-badge status-badge-' + mission.status;

  document.getElementById('bw-date').value = mission.bookingWindow.date;
  document.getElementById('bw-time').value = mission.bookingWindow.time;
  document.getElementById('bw-timezone').value = mission.bookingWindow.timezone;

  const cdEl = document.getElementById('mission-countdown');
  if (mission.bookingWindow.date && mission.bookingWindow.time) {
    countdownIntervals.push(Countdown.start(cdEl, mission.bookingWindow.date, mission.bookingWindow.time, mission.bookingWindow.timezone, () => {
      document.getElementById('launch-btn').disabled = false;
    }));
    const ms = Countdown.getMs(mission.bookingWindow.date, mission.bookingWindow.time, mission.bookingWindow.timezone);
    if (ms !== null && ms < 30 * 60 * 1000) {
      document.getElementById('launch-btn').disabled = false;
      document.getElementById('launch-hint').textContent = 'Ready to launch!';
    } else {
      document.getElementById('launch-btn').disabled = true;
      document.getElementById('launch-hint').textContent = 'Available 30 min before your booking window';
    }
  } else {
    cdEl.textContent = 'Set a date and time above';
    document.getElementById('launch-btn').disabled = true;
  }

  renderTargets(mission);

  const statsEl = document.getElementById('rehearsal-stats');
  statsEl.textContent = '';
  const rp = document.createElement('p');
  const r = mission.rehearsalResults;
  rp.textContent = r.bestTime !== null
    ? 'Best time: ' + r.bestTime.toFixed(1) + 's \u00b7 ' + r.attempts + ' attempt' + (r.attempts !== 1 ? 's' : '')
    : 'Not yet practiced';
  statsEl.appendChild(rp);

  document.getElementById('target-form').style.display = 'none';
}

function renderTargets(mission) {
  const listEl = document.getElementById('target-list');
  listEl.textContent = '';
  [...mission.targets].sort((a, b) => a.rank - b.rank).forEach(t => {
    const el = document.createElement('div');
    el.className = 'target-card';

    const rank = document.createElement('span');
    rank.className = 'target-rank';
    rank.textContent = '#' + t.rank;

    const info = document.createElement('div');
    info.className = 'target-info';
    const h4 = document.createElement('h4');
    h4.textContent = t.campgroundName || t.parkName || 'Untitled';
    const p1 = document.createElement('p');
    p1.textContent = (t.parkName || '') + (t.siteNumber ? ' \u00b7 Site ' + t.siteNumber : '');
    const p2 = document.createElement('p');
    p2.textContent = (t.arrivalDate || '?') + ' \u2192 ' + (t.departureDate || '?');
    info.append(h4, p1, p2);

    const actions = document.createElement('div');
    actions.className = 'target-actions';
    [
      ['\u2191', -1],
      ['\u2193', 1],
    ].forEach(([label, dir]) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.addEventListener('click', e => { e.stopPropagation(); moveTarget(t.id, dir); });
      actions.appendChild(btn);
    });
    const delBtn = document.createElement('button');
    delBtn.textContent = '\u2715';
    delBtn.addEventListener('click', e => { e.stopPropagation(); deleteTarget(t.id); });
    actions.appendChild(delBtn);

    el.append(rank, info, actions);
    listEl.appendChild(el);
  });
}

document.getElementById('add-target-btn').addEventListener('click', () => {
  document.getElementById('target-form').style.display = 'block';
  populateCampgroundDropdown();
});
document.getElementById('tf-cancel').addEventListener('click', () => {
  document.getElementById('target-form').style.display = 'none';
});
document.getElementById('tf-platform').addEventListener('change', populateCampgroundDropdown);

function populateCampgroundDropdown() {
  const platform = document.getElementById('tf-platform').value;
  const sel = document.getElementById('tf-campground');
  sel.textContent = '';
  const def = document.createElement('option');
  def.value = '';
  def.textContent = '\u2014 Select popular campground \u2014';
  sel.appendChild(def);
  const p = PLATFORMS[platform];
  if (p) {
    p.popularCampgrounds.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name + (c.park ? ' (' + c.park + ')' : '');
      sel.appendChild(opt);
    });
  }
}

document.getElementById('tf-campground').addEventListener('change', function() {
  const platform = document.getElementById('tf-platform').value;
  const p = PLATFORMS[platform];
  if (!p) return;
  const cg = p.popularCampgrounds.find(c => c.id === this.value);
  if (cg) {
    document.getElementById('tf-park').value = cg.park || '';
    document.getElementById('tf-campground-name').value = cg.name;
    document.getElementById('tf-link').value = Missions.generateDeepLink(platform, cg.id);
  }
});

document.getElementById('tf-save').addEventListener('click', async () => {
  if (!currentMissionId) return;
  await Missions.addTarget(currentMissionId, {
    platform: document.getElementById('tf-platform').value,
    parkName: document.getElementById('tf-park').value,
    campgroundName: document.getElementById('tf-campground-name').value,
    siteNumber: document.getElementById('tf-site').value || null,
    arrivalDate: document.getElementById('tf-arrival').value,
    departureDate: document.getElementById('tf-departure').value,
    deepLink: document.getElementById('tf-link').value,
  });
  document.getElementById('target-form').style.display = 'none';
  ['tf-park','tf-campground-name','tf-site','tf-arrival','tf-departure','tf-link'].forEach(id => {
    document.getElementById(id).value = '';
  });
  loadMissionDetail();
});

async function moveTarget(targetId, direction) {
  const mission = await Storage.getMission(currentMissionId);
  if (!mission) return;
  const sorted = [...mission.targets].sort((a, b) => a.rank - b.rank);
  const idx = sorted.findIndex(t => t.id === targetId);
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= sorted.length) return;
  [sorted[idx], sorted[newIdx]] = [sorted[newIdx], sorted[idx]];
  await Missions.reorderTargets(currentMissionId, sorted.map(t => t.id));
  loadMissionDetail();
}

async function deleteTarget(targetId) {
  await Missions.removeTarget(currentMissionId, targetId);
  loadMissionDetail();
}

document.getElementById('mission-name-input').addEventListener('blur', async function() {
  if (!currentMissionId) return;
  await Missions.update(currentMissionId, { name: this.value });
});

['bw-date','bw-time','bw-timezone'].forEach(id => {
  document.getElementById(id).addEventListener('change', async () => {
    if (!currentMissionId) return;
    await Missions.update(currentMissionId, {
      bookingWindow: {
        date: document.getElementById('bw-date').value,
        time: document.getElementById('bw-time').value,
        timezone: document.getElementById('bw-timezone').value,
      }
    });
    loadMissionDetail();
  });
});

document.getElementById('launch-btn').addEventListener('click', async () => {
  if (!currentMissionId) return;
  const mission = await Storage.getMission(currentMissionId);
  if (!mission) return;
  await Missions.update(currentMissionId, { status: 'launched' });
  const sorted = [...mission.targets].sort((a, b) => a.rank - b.rank);
  const tabsList = document.getElementById('launch-tabs-list');
  tabsList.textContent = '';
  const launchTabs = [];

  for (const target of sorted) {
    if (target.deepLink) {
      const tab = await chrome.tabs.create({ url: target.deepLink, active: false });
      launchTabs.push({ tabId: tab.id, targetId: target.id, rank: target.rank, name: target.campgroundName || target.parkName || 'Target' });
    }
    const el = document.createElement('div');
    el.className = 'launch-tab-item';
    el.dataset.targetId = target.id;
    el.textContent = '#' + target.rank + ' ' + (target.campgroundName || target.parkName || 'Target');
    tabsList.appendChild(el);
  }

  // Register tabs with background for fallback cascade
  chrome.runtime.sendMessage({ action: 'register_launch_tabs', tabs: launchTabs });

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-launch').classList.add('active');
  const cdEl = document.getElementById('launch-countdown');
  const statusEl = document.getElementById('launch-status-text');
  if (mission.bookingWindow.date && mission.bookingWindow.time) {
    countdownIntervals.push(Countdown.start(cdEl, mission.bookingWindow.date, mission.bookingWindow.time, mission.bookingWindow.timezone, () => {
      statusEl.textContent = 'GO \u2014 Pick your site and add to cart!';
      statusEl.style.fontWeight = '700';
      statusEl.style.color = 'var(--green)';
    }));
  }
});

// Fill Forms button
document.getElementById('fill-forms-btn').addEventListener('click', async () => {
  const profile = await Storage.getProfile();
  if (!profile || !profile.firstName) {
    const result = document.getElementById('fill-result');
    result.style.display = 'block';
    result.textContent = 'Set up your profile first';
    result.style.color = '#dc2626';
    return;
  }
  chrome.runtime.sendMessage({ action: 'fill_forms_active', profile }, (response) => {
    const result = document.getElementById('fill-result');
    result.style.display = 'block';
    if (response && response.success) {
      result.textContent = 'Filled ' + response.filled + '/' + response.total + ' fields';
      result.style.color = 'var(--green)';
    } else {
      result.textContent = response?.error || 'Could not reach the page. Is it a booking site?';
      result.style.color = '#dc2626';
    }
    setTimeout(() => { result.style.display = 'none'; }, 4000);
  });
});

// Next Fallback button
document.getElementById('next-fallback-btn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'next_fallback' }, (response) => {
    if (response && response.switched) {
      updateLaunchTabIndicators();
    }
  });
});

document.getElementById('end-launch-btn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'clear_launch' });
  switchView('dashboard');
});

function updateLaunchTabIndicators() {
  chrome.runtime.sendMessage({ action: 'get_launch_status' }, (response) => {
    if (!response || !response.tabs) return;
    const items = document.querySelectorAll('#launch-tabs-list .launch-tab-item');
    response.tabs.forEach((t, i) => {
      if (items[i]) {
        items[i].style.borderLeft = t.isActive ? '3px solid var(--green)' : '3px solid transparent';
        items[i].style.fontWeight = t.isActive ? '600' : '400';
      }
    });
  });
}

document.getElementById('start-rehearsal-btn').addEventListener('click', () => {
  const url = chrome.runtime.getURL('rehearsal/rehearsal.html');
  chrome.tabs.create({ url: url + (currentMissionId ? '?missionId=' + currentMissionId : '') });
});

document.getElementById('back-to-dashboard').addEventListener('click', () => {
  currentMissionId = null;
  switchView('dashboard');
});

async function loadProfile() {
  const profile = await Storage.getProfile();
  document.getElementById('p-first').value = profile.firstName;
  document.getElementById('p-last').value = profile.lastName;
  document.getElementById('p-email').value = profile.email;
  document.getElementById('p-phone').value = profile.phone;
  document.getElementById('p-plate').value = profile.vehiclePlate;
  document.getElementById('p-length').value = profile.vehicleLength;
  document.getElementById('p-equipment').value = profile.equipmentType;
  document.getElementById('p-party').value = profile.partySize;
  document.getElementById('profile-toast').style.display = 'none';
}

document.getElementById('save-profile-btn').addEventListener('click', async () => {
  await Storage.setProfile({
    firstName: document.getElementById('p-first').value,
    lastName: document.getElementById('p-last').value,
    email: document.getElementById('p-email').value,
    phone: document.getElementById('p-phone').value,
    vehiclePlate: document.getElementById('p-plate').value,
    vehicleLength: document.getElementById('p-length').value,
    equipmentType: document.getElementById('p-equipment').value,
    partySize: parseInt(document.getElementById('p-party').value) || 2,
  });
  const toast = document.getElementById('profile-toast');
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 2000);
});

async function loadSettings() {
  const s = await Storage.getSettings();
  document.getElementById('s-audio').checked = s.countdownAudio;
  document.getElementById('s-notify').value = s.notifyBefore;
  document.getElementById('confirm-clear').style.display = 'none';
}

document.getElementById('s-audio').addEventListener('change', async function() {
  const s = await Storage.getSettings();
  s.countdownAudio = this.checked;
  await Storage.setSettings(s);
});
document.getElementById('s-notify').addEventListener('change', async function() {
  const s = await Storage.getSettings();
  s.notifyBefore = parseInt(this.value) || 5;
  await Storage.setSettings(s);
});
document.getElementById('clear-data-btn').addEventListener('click', () => {
  document.getElementById('confirm-clear').style.display = 'block';
});
document.getElementById('confirm-clear-no').addEventListener('click', () => {
  document.getElementById('confirm-clear').style.display = 'none';
});
document.getElementById('confirm-clear-yes').addEventListener('click', async () => {
  await Storage.clearAll();
  document.getElementById('confirm-clear').style.display = 'none';
  switchView('dashboard');
});

// ── AI Trip Planner ──
const API_BASE = 'https://alphacamper.com'; // Production API

function loadPlanner() {}

document.getElementById('planner-send-btn').addEventListener('click', async () => {
  const input = document.getElementById('planner-input');
  const query = input.value.trim();
  if (!query) return;

  const platform = document.getElementById('planner-platform').value;
  const loading = document.getElementById('planner-loading');
  const results = document.getElementById('planner-results');
  const errorEl = document.getElementById('planner-error');

  loading.style.display = 'block';
  results.style.display = 'none';
  errorEl.style.display = 'none';

  try {
    const base = API_BASE || 'http://localhost:3000';
    const res = await fetch(base + '/api/plan-trip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, constraints: { platform: platform || undefined, maxResults: 5 } })
    });
    const data = await res.json();
    loading.style.display = 'none';
    if (!res.ok || data.error) {
      errorEl.textContent = data.error || 'Something went wrong';
      errorEl.style.display = 'block';
      return;
    }
    results.style.display = 'block';
    renderPlannerResults(data);
  } catch {
    loading.style.display = 'none';
    errorEl.textContent = 'Could not reach the server.';
    errorEl.style.display = 'block';
  }
});

function renderPlannerResults(data) {
  const targetsEl = document.getElementById('planner-targets');
  const adviceEl = document.getElementById('planner-advice');
  targetsEl.textContent = '';

  if (data.advice) {
    adviceEl.style.display = 'block';
    adviceEl.textContent = '';
    const p = document.createElement('p');
    p.style.cssText = 'font-size:13px;color:var(--text-mid);font-style:italic';
    p.textContent = '\uD83D\uDCA1 ' + data.advice;
    adviceEl.appendChild(p);
  } else {
    adviceEl.style.display = 'none';
  }

  (data.targets || []).forEach(function(target) {
    const card = document.createElement('div');
    card.className = 'planner-card';

    const header = document.createElement('div');
    header.className = 'planner-card-header';
    const h4 = document.createElement('h4');
    h4.textContent = '#' + target.rank + ' ' + (target.campgroundName || target.parkName);
    const comp = document.createElement('span');
    comp.className = 'competition competition-' + (target.competitionLevel || 'medium');
    comp.textContent = target.competitionLevel || 'medium';
    header.append(h4, comp);
    card.appendChild(header);

    if (target.parkName) {
      const park = document.createElement('p');
      park.textContent = target.parkName + ' \u00b7 ' + (target.platform === 'bc_parks' ? 'BC Parks' : 'Recreation.gov');
      card.appendChild(park);
    }
    const dates = document.createElement('p');
    dates.textContent = (target.arrivalDate || '') + ' \u2192 ' + (target.departureDate || '');
    card.appendChild(dates);
    if (target.reason) {
      const reason = document.createElement('p');
      reason.style.fontStyle = 'italic';
      reason.textContent = target.reason;
      card.appendChild(reason);
    }
    const addBtn = document.createElement('button');
    addBtn.className = 'btn btn-primary';
    addBtn.style.cssText = 'margin-top:8px;padding:6px 16px;font-size:12px';
    addBtn.textContent = 'Add to Mission';
    addBtn.addEventListener('click', async function() {
      let mId = currentMissionId;
      if (!mId) {
        const m = await Missions.create(data.targets[0]?.parkName || 'AI Planned Trip');
        mId = m.id;
        if (data.bookingWindow) await Missions.update(mId, { bookingWindow: data.bookingWindow });
      }
      await Missions.addTarget(mId, {
        platform: target.platform || 'recreation_gov',
        parkName: target.parkName || '',
        campgroundName: target.campgroundName || '',
        siteNumber: null,
        arrivalDate: target.arrivalDate || '',
        departureDate: target.departureDate || '',
        deepLink: target.deepLink || '',
      });
      addBtn.textContent = 'Added \u2713';
      addBtn.disabled = true;
      currentMissionId = mId;
    });
    card.appendChild(addBtn);
    targetsEl.appendChild(card);
  });
}

// ── Watching (Cancellation Monitor) ──
let extensionAuthToken = null;

async function loadWatching() {
  const result = await chrome.storage.local.get('extensionAuthToken');
  extensionAuthToken = result.extensionAuthToken || null;
  if (!extensionAuthToken) {
    document.getElementById('watch-register').style.display = 'block';
    document.getElementById('watch-list').textContent = '';
    document.getElementById('watch-alerts').textContent = '';
    document.getElementById('no-watches').style.display = 'block';
    return;
  }
  document.getElementById('watch-register').style.display = 'none';
  await refreshWatches();
  await refreshAlerts();
}

document.getElementById('watch-register-btn').addEventListener('click', async () => {
  const email = document.getElementById('watch-email').value.trim();
  if (!email || !email.includes('@')) return;
  try {
    const base = API_BASE || 'http://localhost:3000';
    const btn = document.getElementById('watch-register-btn');
    btn.textContent = 'Sending...';
    btn.disabled = true;

    const res = await fetch(base + '/api/extension-auth/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, extensionId: chrome.runtime.id })
    });

    if (res.ok) {
      document.querySelector('#watch-register p').textContent = 'Check your email and click the link to connect this extension.';
      btn.textContent = 'Check email';
      return;
    }

    btn.textContent = 'Connect';
    btn.disabled = false;
  } catch { /* silent */ }
});

async function refreshWatches() {
  if (!extensionAuthToken) return;
  const listEl = document.getElementById('watch-list');
  const noEl = document.getElementById('no-watches');
  try {
    const base = API_BASE || 'http://localhost:3000';
    const res = await fetch(base + '/api/watch', {
      headers: { Authorization: 'Bearer ' + extensionAuthToken }
    });
    const data = await res.json();
    const watches = data.watches || [];
    listEl.textContent = '';
    if (watches.length === 0) { noEl.style.display = 'block'; return; }
    noEl.style.display = 'none';
    watches.forEach(function(w) {
      const card = document.createElement('div');
      card.className = 'watch-card';
      const info = document.createElement('div');
      info.className = 'watch-info';
      const h4 = document.createElement('h4');
      h4.textContent = w.campground_name;
      const p = document.createElement('p');
      p.textContent = w.arrival_date + ' \u2192 ' + w.departure_date + (w.site_number ? ' \u00b7 Site ' + w.site_number : ' \u00b7 Any site');
      info.append(h4, p);
      const removeBtn = document.createElement('button');
      removeBtn.className = 'watch-remove';
      removeBtn.textContent = '\u2715';
      removeBtn.addEventListener('click', async function() {
        const base2 = API_BASE || 'http://localhost:3000';
        await fetch(base2 + '/api/watch?id=' + w.id, {
          method: 'DELETE',
          headers: { Authorization: 'Bearer ' + extensionAuthToken }
        });
        await refreshWatches();
      });
      card.append(info, removeBtn);
      listEl.appendChild(card);
    });
  } catch { listEl.textContent = ''; noEl.style.display = 'block'; }
}

async function refreshAlerts() {
  if (!extensionAuthToken) return;
  const alertsEl = document.getElementById('watch-alerts');
  alertsEl.textContent = '';
  try {
    const base = API_BASE || 'http://localhost:3000';
    const res = await fetch(base + '/api/alerts', {
      headers: { Authorization: 'Bearer ' + extensionAuthToken }
    });
    const data = await res.json();
    (data.alerts || []).forEach(function(alert) {
      const card = document.createElement('div');
      card.className = 'alert-card';
      const h4 = document.createElement('h4');
      const target = alert.watched_targets;
      const sites = alert.site_details?.sites || [];
      h4.textContent = '\uD83D\uDFE2 ' + (target?.campground_name || 'Campground') + ' has openings!';
      const p = document.createElement('p');
      p.textContent = sites.length + ' site' + (sites.length !== 1 ? 's' : '') + ' available for ' + (target?.arrival_date || '') + ' \u2192 ' + (target?.departure_date || '');
      const btn = document.createElement('button');
      btn.className = 'btn btn-primary';
      btn.textContent = 'Book Now';
      btn.addEventListener('click', async function() {
        const platform = target?.platform || 'recreation_gov';
        const cgId = target?.campground_id || '';
        const link = Missions.generateDeepLink(platform, cgId);
        if (link) {
          chrome.tabs.create({ url: link, active: true }).then((tab) => {
            chrome.runtime.sendMessage({ action: 'schedule_tab_fill', tabId: tab.id });
          });
        }
        const base2 = API_BASE || 'http://localhost:3000';
        await fetch(base2 + '/api/alerts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + extensionAuthToken },
          body: JSON.stringify({ id: alert.id })
        });
        await refreshAlerts();
      });
      card.append(h4, p, btn);
      alertsEl.appendChild(card);
    });
  } catch { /* silent */ }
}

document.getElementById('add-watch-btn').addEventListener('click', () => {
  if (!extensionAuthToken) { document.getElementById('watch-register').style.display = 'block'; return; }
  document.getElementById('watch-form').style.display = 'block';
  populateWatchCampgrounds();
});
document.getElementById('wf-cancel').addEventListener('click', () => {
  document.getElementById('watch-form').style.display = 'none';
});
document.getElementById('wf-platform').addEventListener('change', populateWatchCampgrounds);

function populateWatchCampgrounds() {
  const platform = document.getElementById('wf-platform').value;
  const sel = document.getElementById('wf-campground');
  sel.textContent = '';
  const def = document.createElement('option');
  def.value = '';
  def.textContent = '\u2014 Select campground \u2014';
  sel.appendChild(def);
  const p = PLATFORMS[platform];
  if (p) {
    p.popularCampgrounds.forEach(function(c) {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name + (c.park ? ' (' + c.park + ')' : '');
      sel.appendChild(opt);
    });
  }
}

document.getElementById('wf-campground').addEventListener('change', function() {
  const platform = document.getElementById('wf-platform').value;
  const p = PLATFORMS[platform];
  if (!p) return;
  const cg = p.popularCampgrounds.find(function(c) { return c.id === this.value; }.bind(this));
  if (cg) document.getElementById('wf-campground-name').value = cg.name + (cg.park ? ' (' + cg.park + ')' : '');
});

document.getElementById('wf-save').addEventListener('click', async () => {
  if (!extensionAuthToken) return;
  const campgroundId = document.getElementById('wf-campground').value;
  const campgroundName = document.getElementById('wf-campground-name').value;
  if (!campgroundId || !campgroundName) return;
  try {
    const base = API_BASE || 'http://localhost:3000';
    await fetch(base + '/api/watch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + extensionAuthToken },
      body: JSON.stringify({
        platform: document.getElementById('wf-platform').value,
        campgroundId: campgroundId,
        campgroundName: campgroundName,
        siteNumber: document.getElementById('wf-site').value || null,
        arrivalDate: document.getElementById('wf-arrival').value,
        departureDate: document.getElementById('wf-departure').value,
      })
    });
    document.getElementById('watch-form').style.display = 'none';
    await refreshWatches();
  } catch { /* silent */ }
});

// Poll alerts every 30s when watching view is active
setInterval(function() {
  if (currentView === 'watching' && extensionAuthToken) refreshAlerts();
}, 30000);

chrome.storage.onChanged.addListener(function(changes) {
  if (changes.extensionAuthToken) {
    extensionAuthToken = changes.extensionAuthToken.newValue || null;
    loadWatching();
  }
});

loadDashboard();

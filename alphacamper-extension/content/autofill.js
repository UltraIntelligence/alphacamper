// Alphacamper Content Script — Autofill on Recreation.gov and BC Parks
// IMPORTANT: User-initiated only. Never fills on page load.

// Common selectors shared across many platforms
const COMMON_SELECTORS = {
  firstName:    ['input[name="firstName"]', 'input[name="first_name"]', 'input[autocomplete="given-name"]', 'input[aria-label*="irst"]', 'input[id*="irst"]', 'input[placeholder*="irst"]'],
  lastName:     ['input[name="lastName"]', 'input[name="last_name"]', 'input[autocomplete="family-name"]', 'input[aria-label*="ast"]', 'input[id*="ast"][id*="ame"]', 'input[placeholder*="ast"]'],
  email:        ['input[name="email"]', 'input[type="email"]', 'input[autocomplete="email"]', 'input[aria-label*="mail"]', 'input[id*="mail"]'],
  phone:        ['input[name="phone"]', 'input[type="tel"]', 'input[autocomplete="tel"]', 'input[aria-label*="hone"]', 'input[id*="hone"]'],
  vehiclePlate: ['input[name="licensePlate"]', 'input[name="vehicle"]', 'input[aria-label*="license"]', 'input[aria-label*="plate"]', 'input[id*="icense"]', 'input[id*="ehicle"]'],
  partySize:    ['select[name="numberOfPeople"]', 'select[name="partySize"]', 'select[aria-label*="party"]', 'select[aria-label*="people"]', 'input[name="partySize"]', 'select[id*="arty"]'],
  equipmentType:['select[name="equipmentType"]', 'select[name="equipment"]', 'select[aria-label*="equipment"]', 'select[id*="quipment"]'],
};

const FIELD_MAPS = {
  recreation_gov: {
    firstName:    ['input[name="firstName"]', '#firstName', ...COMMON_SELECTORS.firstName],
    lastName:     ['input[name="lastName"]', '#lastName', ...COMMON_SELECTORS.lastName],
    email:        [...COMMON_SELECTORS.email],
    phone:        [...COMMON_SELECTORS.phone],
    vehiclePlate: [...COMMON_SELECTORS.vehiclePlate],
    partySize:    [...COMMON_SELECTORS.partySize],
    equipmentType:[...COMMON_SELECTORS.equipmentType],
  },
  bc_parks: {
    firstName:    ['input[name="firstName"]', '#txtFirstName', ...COMMON_SELECTORS.firstName],
    lastName:     ['input[name="lastName"]', '#txtLastName', ...COMMON_SELECTORS.lastName],
    email:        ['#txtEmail', ...COMMON_SELECTORS.email],
    phone:        ['#txtPhone', ...COMMON_SELECTORS.phone],
    vehiclePlate: ['#txtLicensePlate', ...COMMON_SELECTORS.vehiclePlate],
    partySize:    ['#ddlPartySize', ...COMMON_SELECTORS.partySize],
    equipmentType:['#ddlEquipmentType', ...COMMON_SELECTORS.equipmentType],
  },
  parks_canada: {
    firstName:    ['#txtFirstName', 'input[name="FirstName"]', ...COMMON_SELECTORS.firstName],
    lastName:     ['#txtLastName', 'input[name="LastName"]', ...COMMON_SELECTORS.lastName],
    email:        ['#txtEmail', 'input[name="Email"]', ...COMMON_SELECTORS.email],
    phone:        ['#txtPhone', 'input[name="Phone"]', ...COMMON_SELECTORS.phone],
    vehiclePlate: ['#txtLicensePlate', ...COMMON_SELECTORS.vehiclePlate],
    partySize:    ['#ddlPartySize', 'select[name="PartySize"]', ...COMMON_SELECTORS.partySize],
    equipmentType:['#ddlEquipmentType', 'select[name="EquipmentType"]', ...COMMON_SELECTORS.equipmentType],
  },
  ontario_parks: {
    firstName:    ['input[name="firstName"]', '#txtFirstName', ...COMMON_SELECTORS.firstName],
    lastName:     ['input[name="lastName"]', '#txtLastName', ...COMMON_SELECTORS.lastName],
    email:        ['#txtEmail', ...COMMON_SELECTORS.email],
    phone:        ['#txtPhone', ...COMMON_SELECTORS.phone],
    vehiclePlate: ['#txtLicensePlate', ...COMMON_SELECTORS.vehiclePlate],
    partySize:    ['#ddlPartySize', ...COMMON_SELECTORS.partySize],
    equipmentType:['#ddlEquipmentType', ...COMMON_SELECTORS.equipmentType],
  },
  alberta_parks: {
    firstName:    [...COMMON_SELECTORS.firstName],
    lastName:     [...COMMON_SELECTORS.lastName],
    email:        [...COMMON_SELECTORS.email],
    phone:        [...COMMON_SELECTORS.phone],
    vehiclePlate: [...COMMON_SELECTORS.vehiclePlate],
    partySize:    [...COMMON_SELECTORS.partySize],
    equipmentType:[...COMMON_SELECTORS.equipmentType],
  },
  reserve_california: {
    firstName:    ['#txtFirstName', 'input[name="FirstName"]', ...COMMON_SELECTORS.firstName],
    lastName:     ['#txtLastName', 'input[name="LastName"]', ...COMMON_SELECTORS.lastName],
    email:        ['#txtEmail', ...COMMON_SELECTORS.email],
    phone:        ['#txtPhone', ...COMMON_SELECTORS.phone],
    vehiclePlate: [...COMMON_SELECTORS.vehiclePlate],
    partySize:    [...COMMON_SELECTORS.partySize],
    equipmentType:[...COMMON_SELECTORS.equipmentType],
  },
  reserve_america: {
    firstName:    [...COMMON_SELECTORS.firstName],
    lastName:     [...COMMON_SELECTORS.lastName],
    email:        [...COMMON_SELECTORS.email],
    phone:        [...COMMON_SELECTORS.phone],
    vehiclePlate: [...COMMON_SELECTORS.vehiclePlate],
    partySize:    [...COMMON_SELECTORS.partySize],
    equipmentType:[...COMMON_SELECTORS.equipmentType],
  },
  sepaq: {
    firstName:    [...COMMON_SELECTORS.firstName],
    lastName:     [...COMMON_SELECTORS.lastName],
    email:        [...COMMON_SELECTORS.email],
    phone:        [...COMMON_SELECTORS.phone],
    vehiclePlate: [...COMMON_SELECTORS.vehiclePlate],
    partySize:    [...COMMON_SELECTORS.partySize],
    equipmentType:[...COMMON_SELECTORS.equipmentType],
  },
};

function detectPlatform() {
  const h = window.location.hostname;
  if (h.includes('recreation.gov')) return 'recreation_gov';
  if (h.includes('camping.bcparks.ca') || h.includes('bcparks.ca')) return 'bc_parks';
  if (h.includes('reservation.pc.gc.ca')) return 'parks_canada';
  if (h.includes('reservations.ontarioparks.ca') || h.includes('ontarioparks.ca')) return 'ontario_parks';
  if (h.includes('reserve.albertaparks.ca')) return 'alberta_parks';
  if (h.includes('reservecalifornia.com')) return 'reserve_california';
  if (h.includes('reserveamerica.com')) return 'reserve_america';
  if (h.includes('sepaq.com')) return 'sepaq';
  return null;
}

function findField(selectors) {
  for (const sel of selectors) {
    try {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) return el; // visible element
    } catch { /* invalid selector, skip */ }
  }
  return null;
}

function fillInputField(element, value) {
  element.focus();
  // Use native setter to work with React's synthetic events
  const setter = Object.getOwnPropertyDescriptor(
    element.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype,
    'value'
  );
  if (setter && setter.set) {
    setter.set.call(element, value);
  } else {
    element.value = value;
  }
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new Event('blur', { bubbles: true }));
}

function fillFieldsWithDelay(fields, index, callback) {
  if (index >= fields.length) {
    if (callback) callback();
    return;
  }
  const { element, value, name } = fields[index];
  fillInputField(element, value);
  console.log('[Alphacamper] Filled:', name, '=', value);
  const delay = 50 + Math.random() * 100;
  setTimeout(() => fillFieldsWithDelay(fields, index + 1, callback), delay);
}

function fillBookingForms(profile) {
  const platform = detectPlatform();
  if (!platform) return { filled: 0, total: 0, fields: [] };

  const fieldMap = FIELD_MAPS[platform];
  const profileMap = {
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone,
    vehiclePlate: profile.vehiclePlate,
    partySize: String(profile.partySize || 2),
    equipmentType: profile.equipmentType || 'tent',
  };

  const toFill = [];
  const results = [];

  for (const [fieldName, selectors] of Object.entries(fieldMap)) {
    const value = profileMap[fieldName];
    if (!value) {
      results.push({ name: fieldName, status: 'skipped', reason: 'no profile data' });
      continue;
    }
    const element = findField(selectors);
    if (element) {
      toFill.push({ element, value, name: fieldName });
      results.push({ name: fieldName, status: 'found' });
    } else {
      results.push({ name: fieldName, status: 'not_found' });
    }
  }

  return new Promise(resolve => {
    fillFieldsWithDelay(toFill, 0, () => {
      const filled = toFill.length;
      const total = Object.keys(fieldMap).length;
      console.log(`[Alphacamper] Filled ${filled}/${total} fields on ${platform}`);
      resolve({ filled, total, fields: results, platform });
    });
  });
}

// Listen for fill command from sidePanel or background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fill_forms') {
    const profile = message.profile;
    if (!profile) {
      sendResponse({ success: false, error: 'No profile data' });
      return;
    }
    fillBookingForms(profile).then(result => {
      sendResponse({ success: true, ...result });
    });
    return true; // Keep channel open for async
  }

  if (message.action === 'detect_platform') {
    sendResponse({ platform: detectPlatform() });
  }
});

console.log('[Alphacamper] Autofill content script loaded on', window.location.hostname);

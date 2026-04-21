// Alphacamper Content Script — Autofill on Recreation.gov and BC Parks
// IMPORTANT: User-initiated only. Never fills on page load.

// Common selectors shared across many platforms
const COMMON_SELECTORS = {
  firstName:    ['input[name="firstName"]', 'input[name="first_name"]', 'input[autocomplete="given-name"]', 'input[aria-label*="irst"]', 'input[id*="irst"]', 'input[placeholder*="irst"]'],
  lastName:     ['input[name="lastName"]', 'input[name="last_name"]', 'input[autocomplete="family-name"]', 'input[aria-label*="ast"]', 'input[id*="ast"][id*="ame"]', 'input[placeholder*="ast"]'],
  email:        ['input[name="email"]', 'input[type="email"]', 'input[autocomplete="email"]', 'input[aria-label*="mail"]', 'input[id*="mail"]'],
  phone:        ['input[name="phone"]', 'input[type="tel"]', 'input[autocomplete="tel"]', 'input[aria-label*="hone"]', 'input[id*="hone"]'],
  addressLine1: ['input[name="address1"]', 'input[name="address"]', 'input[autocomplete="street-address"]', 'input[aria-label*="address"]', 'input[id*="address"]'],
  city:         ['input[name="city"]', 'input[autocomplete="address-level2"]', 'input[aria-label*="city"]', 'input[id*="city"]'],
  stateProvince:['input[name="state"]', 'input[name="province"]', 'select[name="state"]', 'select[name="province"]', 'input[autocomplete="address-level1"]', 'input[aria-label*="province"]', 'input[aria-label*="state"]', 'select[id*="province"]', 'select[id*="state"]'],
  postalCode:   ['input[name="postalCode"]', 'input[name="zip"]', 'input[name="postcode"]', 'input[autocomplete="postal-code"]', 'input[aria-label*="postal"]', 'input[aria-label*="zip"]', 'input[id*="postal"]', 'input[id*="zip"]'],
  country:      ['select[name="country"]', 'select[autocomplete="country"]', 'select[aria-label*="country"]', 'select[id*="country"]'],
  residency:    ['select[name="residency"]', 'select[name="resident"]', 'select[aria-label*="resident"]', 'input[name="residency"]'],
  vehiclePlate: ['input[name="licensePlate"]', 'input[name="vehicle"]', 'input[aria-label*="license"]', 'input[aria-label*="plate"]', 'input[id*="icense"]', 'input[id*="ehicle"]'],
  vehicleLength:['input[name="vehicleLength"]', 'input[name="rvLength"]', 'input[name="length"]', 'select[name="vehicleLength"]', 'select[name="rvLength"]', 'input[aria-label*="length"]', 'input[id*="length"]', 'select[id*="length"]'],
  partySize:    ['select[name="numberOfPeople"]', 'select[name="partySize"]', 'select[aria-label*="party"]', 'select[aria-label*="people"]', 'input[name="partySize"]', 'select[id*="arty"]'],
  equipmentType:['select[name="equipmentType"]', 'select[name="equipment"]', 'select[aria-label*="equipment"]', 'select[id*="quipment"]'],
};

const FIELD_MAPS = {
  recreation_gov: {
    firstName:    ['input[name="firstName"]', '#firstName', ...COMMON_SELECTORS.firstName],
    lastName:     ['input[name="lastName"]', '#lastName', ...COMMON_SELECTORS.lastName],
    email:        [...COMMON_SELECTORS.email],
    phone:        [...COMMON_SELECTORS.phone],
    addressLine1: [...COMMON_SELECTORS.addressLine1],
    city:         [...COMMON_SELECTORS.city],
    stateProvince:[...COMMON_SELECTORS.stateProvince],
    postalCode:   [...COMMON_SELECTORS.postalCode],
    country:      [...COMMON_SELECTORS.country],
    vehiclePlate: [...COMMON_SELECTORS.vehiclePlate],
    vehicleLength:[...COMMON_SELECTORS.vehicleLength],
    partySize:    [...COMMON_SELECTORS.partySize],
    equipmentType:[...COMMON_SELECTORS.equipmentType],
  },
  bc_parks: {
    firstName:    ['input[name="firstName"]', '#txtFirstName', ...COMMON_SELECTORS.firstName],
    lastName:     ['input[name="lastName"]', '#txtLastName', ...COMMON_SELECTORS.lastName],
    email:        ['#txtEmail', ...COMMON_SELECTORS.email],
    phone:        ['#txtPhone', ...COMMON_SELECTORS.phone],
    addressLine1: [...COMMON_SELECTORS.addressLine1],
    city:         [...COMMON_SELECTORS.city],
    stateProvince:[...COMMON_SELECTORS.stateProvince],
    postalCode:   [...COMMON_SELECTORS.postalCode],
    residency:    [...COMMON_SELECTORS.residency],
    vehiclePlate: ['#txtLicensePlate', ...COMMON_SELECTORS.vehiclePlate],
    vehicleLength:[...COMMON_SELECTORS.vehicleLength],
    partySize:    ['#ddlPartySize', ...COMMON_SELECTORS.partySize],
    equipmentType:['#ddlEquipmentType', ...COMMON_SELECTORS.equipmentType],
  },
  parks_canada: {
    firstName:    ['#txtFirstName', 'input[name="FirstName"]', ...COMMON_SELECTORS.firstName],
    lastName:     ['#txtLastName', 'input[name="LastName"]', ...COMMON_SELECTORS.lastName],
    email:        ['#txtEmail', 'input[name="Email"]', ...COMMON_SELECTORS.email],
    phone:        ['#txtPhone', 'input[name="Phone"]', ...COMMON_SELECTORS.phone],
    addressLine1: [...COMMON_SELECTORS.addressLine1],
    city:         [...COMMON_SELECTORS.city],
    stateProvince:[...COMMON_SELECTORS.stateProvince],
    postalCode:   [...COMMON_SELECTORS.postalCode],
    residency:    [...COMMON_SELECTORS.residency],
    vehiclePlate: ['#txtLicensePlate', ...COMMON_SELECTORS.vehiclePlate],
    vehicleLength:[...COMMON_SELECTORS.vehicleLength],
    partySize:    ['#ddlPartySize', 'select[name="PartySize"]', ...COMMON_SELECTORS.partySize],
    equipmentType:['#ddlEquipmentType', 'select[name="EquipmentType"]', ...COMMON_SELECTORS.equipmentType],
  },
  ontario_parks: {
    firstName:    ['input[name="firstName"]', '#txtFirstName', ...COMMON_SELECTORS.firstName],
    lastName:     ['input[name="lastName"]', '#txtLastName', ...COMMON_SELECTORS.lastName],
    email:        ['#txtEmail', ...COMMON_SELECTORS.email],
    phone:        ['#txtPhone', ...COMMON_SELECTORS.phone],
    addressLine1: [...COMMON_SELECTORS.addressLine1],
    city:         [...COMMON_SELECTORS.city],
    stateProvince:[...COMMON_SELECTORS.stateProvince],
    postalCode:   [...COMMON_SELECTORS.postalCode],
    residency:    [...COMMON_SELECTORS.residency],
    vehiclePlate: ['#txtLicensePlate', ...COMMON_SELECTORS.vehiclePlate],
    vehicleLength:[...COMMON_SELECTORS.vehicleLength],
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

const PLATFORM_ASSIST_CONFIGS = {
  recreation_gov: {
    confirmationTerms: ['reservation complete', 'reservation confirmed'],
    cartTerms: ['checkout', 'payment', 'billing', 'review reservation'],
    search: null,
    gridSelectors: ['[data-component="SiteMarker"]', '.campsite-button', '[class*="site-card"]', 'button[class*="site"]'],
    allowButtonTerms: ['continue', 'next', 'select', 'reserve', 'add to cart', 'review', 'continue to review'],
    blockButtonTerms: ['checkout', 'pay', 'purchase', 'place order', 'submit payment', 'confirm payment', 'complete reservation', 'book now'],
  },
  bc_parks: {
    confirmationTerms: ['reservation complete', 'reservation confirmed'],
    cartTerms: ['checkout', 'payment', 'billing', 'review reservation', 'cardholder'],
    search: {
      arrivalSelectors: ['#arrival-date-field', 'input[placeholder*="Arrival"]', 'input[aria-label*="Arrival"]'],
      departureSelectors: ['#departure-date-field', 'input[placeholder*="Departure"]', 'input[aria-label*="Departure"]'],
      equipmentTriggerSelectors: ['#equipment-field', 'mat-select', '[formcontrolname="equipment"]', '.mat-mdc-select', '[role="combobox"]'],
      searchButtonSelectors: ['#actionSearch'],
      equipmentOptions: {
        tent: ['1 Tent', 'Tent'],
        trailer: ['Trailer', 'RV', '18ft'],
        rv: ['RV', 'Trailer/RV', '32ft'],
        van: ['Van', 'Camper'],
      },
      searchButtonTerms: ['search', 'check availability', 'find'],
    },
    gridSelectors: ['[data-component="SiteMarker"]', '.campsite-button', '[class*="site-card"]', 'button[class*="site"]', '[class*="availability"] button'],
    allowButtonTerms: ['continue', 'next', 'select', 'reserve', 'add to cart', 'book these dates', 'review', 'continue to details', 'continue to review'],
    blockButtonTerms: ['checkout', 'pay', 'purchase', 'place order', 'submit payment', 'confirm payment', 'complete reservation', 'book now'],
    consentTerms: ['i consent', 'accept', 'agree'],
  },
  parks_canada: {
    confirmationTerms: ['reservation complete', 'reservation confirmed'],
    cartTerms: ['checkout', 'payment', 'billing', 'review reservation', 'cardholder'],
    search: {
      arrivalSelectors: ['#arrival-date-field', 'input[placeholder*="Arrival"]', 'input[aria-label*="Arrival"]'],
      departureSelectors: ['#departure-date-field', 'input[placeholder*="Departure"]', 'input[aria-label*="Departure"]'],
      equipmentTriggerSelectors: ['#equipment-field', 'mat-select', '[formcontrolname="equipment"]', '.mat-mdc-select', '[role="combobox"]'],
      searchButtonSelectors: ['#actionSearch'],
      equipmentOptions: {
        tent: ['1 Tent', 'Tent'],
        trailer: ['Trailer', 'RV', '18ft'],
        rv: ['RV', 'Trailer/RV', '32ft'],
        van: ['Van', 'Camper'],
      },
      searchButtonTerms: ['search', 'check availability', 'find'],
    },
    gridSelectors: ['[data-component="SiteMarker"]', '.campsite-button', '[class*="site-card"]', 'button[class*="site"]', '[class*="availability"] button'],
    allowButtonTerms: ['continue', 'next', 'select', 'reserve', 'add to cart', 'book these dates', 'review', 'continue to details', 'continue to review'],
    blockButtonTerms: ['checkout', 'pay', 'purchase', 'place order', 'submit payment', 'confirm payment', 'complete reservation', 'book now'],
    consentTerms: ['i consent', 'accept', 'agree'],
  },
  ontario_parks: {
    confirmationTerms: ['reservation complete', 'reservation confirmed'],
    cartTerms: ['checkout', 'payment', 'billing', 'review reservation', 'cardholder'],
    search: {
      arrivalSelectors: ['#arrival-date-field', 'input[placeholder*="Arrival"]', 'input[aria-label*="Arrival"]'],
      departureSelectors: ['#departure-date-field', 'input[placeholder*="Departure"]', 'input[aria-label*="Departure"]'],
      equipmentTriggerSelectors: ['#equipment-field', 'mat-select', '[formcontrolname="equipment"]', '.mat-mdc-select', '[role="combobox"]'],
      searchButtonSelectors: ['#actionSearch'],
      equipmentOptions: {
        tent: ['1 Tent', 'Tent'],
        trailer: ['Trailer', 'RV', '18ft'],
        rv: ['RV', 'Trailer/RV', '32ft'],
        van: ['Van', 'Camper'],
      },
      searchButtonTerms: ['search', 'check availability', 'find'],
    },
    gridSelectors: ['[data-component="SiteMarker"]', '.campsite-button', '[class*="site-card"]', 'button[class*="site"]', '[class*="availability"] button'],
    allowButtonTerms: ['continue', 'next', 'select', 'reserve', 'add to cart', 'book these dates', 'review', 'continue to details', 'continue to review'],
    blockButtonTerms: ['checkout', 'pay', 'purchase', 'place order', 'submit payment', 'confirm payment', 'complete reservation', 'book now'],
    consentTerms: ['i consent', 'accept', 'agree'],
  },
};

let autofillStartedEmitted = false;
let bookingSubmittedEmitted = false;
let bookingConfirmedEmitted = false;
const bookingFailureReasons = new Set();
let lastMissingFieldSignature = '';

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

function getAssistConfig(platform) {
  return PLATFORM_ASSIST_CONFIGS[platform] || PLATFORM_ASSIST_CONFIGS.recreation_gov;
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

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function emitAssistEvent(name, plan, metadata) {
  if (typeof emitEvent !== 'function') return;

  void emitEvent(name, {
    watchId: plan?.watchId || null,
    source: plan?.source || 'content_script',
    platform: metadata?.platform || plan?.platform || null,
    campgroundId: plan?.campgroundId || null,
    campgroundName: plan?.campgroundName || '',
    ...metadata,
  });
}

function emitAutofillStarted(plan, platform, pageType) {
  if (autofillStartedEmitted) return;
  autofillStartedEmitted = true;
  emitAssistEvent('autofill_started', plan, {
    platform,
    pageType,
    url: window.location.href,
  });
}

function emitBookingSubmitted(plan, platform, buttonLabel) {
  if (bookingSubmittedEmitted) return;
  bookingSubmittedEmitted = true;
  emitAssistEvent('booking_submitted', plan, {
    platform,
    buttonLabel,
    url: window.location.href,
  });
}

function emitBookingConfirmed(plan, platform) {
  if (bookingConfirmedEmitted) return;
  bookingConfirmedEmitted = true;
  emitAssistEvent('booking_confirmed', plan, {
    platform,
    url: window.location.href,
  });
}

function emitBookingFailed(plan, platform, reason) {
  const key = `${platform || 'unknown'}:${reason}`;
  if (bookingFailureReasons.has(key)) return;
  bookingFailureReasons.add(key);
  emitAssistEvent('booking_failed', plan, {
    platform,
    reason,
    url: window.location.href,
  });
}

function emitFieldNotFound(plan, platform, results, filled, total) {
  const missingFields = results
    .filter((field) => field.status === 'not_found')
    .map((field) => field.name);
  if (!missingFields.length) return;

  const signature = `${platform}:${missingFields.join(',')}`;
  if (lastMissingFieldSignature === signature) return;
  lastMissingFieldSignature = signature;

  emitAssistEvent('autofill_field_not_found', plan, {
    platform,
    missingFields,
    filled,
    total,
    url: window.location.href,
  });
}

function getPageType() {
  const platform = detectPlatform();
  const config = getAssistConfig(platform);
  const url = window.location.href.toLowerCase();
  const body = (document.body?.innerText || '').toLowerCase();
  const title = (document.title || '').toLowerCase();
  if (
    title.includes('azure waf') ||
    title.includes('service unavailable') ||
    title.includes('temporarily unavailable') ||
    body.includes('azure waf') ||
    body.includes('service unavailable') ||
    body.includes('temporarily unavailable') ||
    body.includes('request blocked') ||
    body.includes('access denied') ||
    body.includes('support id') ||
    body.includes('reference #')
  ) {
    return 'waf';
  }
  if (url.includes('confirmation') || config.confirmationTerms.some((term) => body.includes(term))) return 'confirmation';
  if (url.includes('cart') || url.includes('checkout') || config.cartTerms.some((term) => body.includes(term))) return 'cart';
  if (config.search) {
    const hasArrivalField = findField(config.search.arrivalSelectors);
    const hasDepartureField = findField(config.search.departureSelectors);
    if (hasArrivalField || hasDepartureField) return 'search';
  }
  if (document.querySelectorAll('input[name="firstName"], input[name="email"], input[type="email"], #txtFirstName, #txtEmail').length > 0) return 'form';
  if (document.querySelectorAll(config.gridSelectors.join(', ')).length > 0) return 'grid';
  return 'unknown';
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSiteTokens(values) {
  const tokens = new Set();
  (values || []).forEach((value) => {
    const normalized = normalizeText(value);
    if (!normalized) return;
    tokens.add(normalized);
    tokens.add(normalized.replace(/^site\s*#?\s*/i, '').trim());
    normalized.split(/[^a-z0-9]+/i).filter(Boolean).forEach((part) => {
      if (part.length >= 2) tokens.add(part);
    });
    const compact = normalized.replace(/[^a-z0-9]/gi, '');
    if (compact.length >= 2) tokens.add(compact);
  });
  return [...tokens].filter(Boolean);
}

function scoreLabelAgainstTokens(label, tokens) {
  let score = 0;
  for (const token of tokens) {
    if (!token) continue;
    if (label === token) score += 250;
    const boundary = new RegExp(`(^|[^a-z0-9])${escapeRegExp(token)}([^a-z0-9]|$)`, 'i');
    if (boundary.test(label)) score += 120;
    else if (label.includes(token)) score += 50;
  }
  return score;
}

function getVisibleCandidates(selectors) {
  const seen = new Set();
  const items = [];
  selectors.forEach((selector) => {
    try {
      document.querySelectorAll(selector).forEach((el) => {
        if (!el || seen.has(el)) return;
        seen.add(el);
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return;
        items.push(el);
      });
    } catch {}
  });
  return items;
}

function getButtonLabel(el) {
  return normalizeText(
    el?.innerText ||
    el?.textContent ||
    el?.value ||
    el?.getAttribute?.('aria-label') ||
    el?.getAttribute?.('title') ||
    ''
  );
}

function clickElement(el) {
  if (!el) return false;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
  el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  el.click();
  el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  return true;
}

function findButtonByTerms(terms, selectors) {
  const candidates = getVisibleCandidates(selectors || [
    'button',
    'a[role="button"]',
    'input[type="button"]',
    'input[type="submit"]',
    '[role="button"]',
  ]);
  for (const el of candidates) {
    const label = getButtonLabel(el);
    if (!label) continue;
    if (terms.some((term) => label.includes(normalizeText(term)))) {
      return { el, label };
    }
  }
  return null;
}

async function dismissConsentIfPresent(platform) {
  const config = getAssistConfig(platform);
  if (!config.consentTerms?.length) return false;
  const consentBtn = findButtonByTerms(config.consentTerms);
  if (!consentBtn) return false;
  clickElement(consentBtn.el);
  await wait(600);
  return true;
}

function findMatchingSiteCard(plan) {
  const platform = detectPlatform();
  const config = getAssistConfig(platform);
  const siteNumberTokens = buildSiteTokens([plan?.exactSiteNumber, ...(plan?.preferredSiteNumbers || [])]);
  const siteIdTokens = buildSiteTokens(plan?.preferredSiteIds || []);
  const candidates = getVisibleCandidates(config.gridSelectors);

  const scored = candidates
    .map((el) => {
      const label = normalizeText(el.innerText || el.textContent || el.getAttribute('aria-label') || '');
      const unavailable = label.match(/reserved|unavailable|closed|sold out|not available/) || el.disabled || el.getAttribute('aria-disabled') === 'true';
      if (unavailable) return null;

      let score = 1;
      score += scoreLabelAgainstTokens(label, siteNumberTokens);
      score += scoreLabelAgainstTokens(label, siteIdTokens);
      if (label.includes('available')) score += 10;
      return { el, label, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  return scored[0] || null;
}

function findSafeContinueButton() {
  const platform = detectPlatform();
  const config = getAssistConfig(platform);
  const candidates = getVisibleCandidates([
    'button',
    'a[role="button"]',
    'input[type="button"]',
    'input[type="submit"]',
  ]);
  const allow = config.allowButtonTerms;
  const block = config.blockButtonTerms;

  for (const el of candidates) {
    const label = getButtonLabel(el);
    if (!label) continue;
    if (block.some((token) => label.includes(token))) continue;
    if (allow.some((token) => label.includes(token))) return { el, label };
  }
  return null;
}

function formatDateForField(value) {
  if (!value) return '';
  const parts = String(value).split('-');
  if (parts.length !== 3) return String(value);
  return `${parts[1]}/${parts[2]}/${parts[0]}`;
}

function parseIsoDate(value) {
  const parts = String(value || '').split('-').map(Number);
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null;
  return { year: parts[0], month: parts[1], day: parts[2] };
}

function formatCalendarAriaLabel(value) {
  const parsed = parseIsoDate(value);
  if (!parsed) return null;
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${monthNames[parsed.month - 1]} ${parsed.day}, ${parsed.year}`;
}

function monthDiffFromNow(value) {
  const parsed = parseIsoDate(value);
  if (!parsed) return 0;
  const now = new Date();
  return ((parsed.year - now.getFullYear()) * 12) + (parsed.month - (now.getMonth() + 1));
}

function isCamisCalendarPlatform(platform) {
  return ['bc_parks', 'parks_canada', 'ontario_parks'].includes(platform);
}

async function pickCamisCalendarDate(input, isoDate) {
  const targetLabel = formatCalendarAriaLabel(isoDate);
  if (!input || !targetLabel) return false;

  clickElement(input);
  await wait(500);

  const monthSteps = Math.max(0, Math.min(18, monthDiffFromNow(isoDate)));
  for (let i = 0; i < monthSteps; i += 1) {
    const nextButton = findField([
      '.cdk-overlay-pane .next-button',
      '.mat-datepicker-content .next-button',
      'button[aria-label*="View next month"]',
    ]);
    if (!nextButton) break;
    clickElement(nextButton);
    await wait(250);
  }

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const target = findField([
      `.cdk-overlay-pane button[aria-label="${targetLabel}"]`,
      `.mat-datepicker-content button[aria-label="${targetLabel}"]`,
      `button[aria-label="${targetLabel}"]`,
    ]);
    if (target) {
      clickElement(target);
      await wait(400);
      return true;
    }

    const nextButton = findField([
      '.cdk-overlay-pane .next-button',
      '.mat-datepicker-content .next-button',
      'button[aria-label*="View next month"]',
    ]);
    if (!nextButton) break;
    clickElement(nextButton);
    await wait(250);
  }

  return false;
}

async function setSearchDates(config, plan) {
  const platform = detectPlatform();
  const arrivalField = findField(config.search.arrivalSelectors);
  const departureField = findField(config.search.departureSelectors);
  let changed = false;

  if (isCamisCalendarPlatform(platform) && arrivalField && departureField && plan?.arrivalDate && plan?.departureDate) {
    const arrivalPicked = await pickCamisCalendarDate(arrivalField, plan.arrivalDate);
    const departurePicked = await pickCamisCalendarDate(departureField, plan.departureDate);
    if (arrivalPicked || departurePicked) {
      changed = arrivalPicked || departurePicked;
      await wait(400);
      document.body.click();
      await wait(400);
      return changed;
    }
  }

  if (arrivalField && plan?.arrivalDate) {
    fillInputField(arrivalField, formatDateForField(plan.arrivalDate));
    changed = true;
  }
  if (departureField && plan?.departureDate) {
    fillInputField(departureField, formatDateForField(plan.departureDate));
    changed = true;
  }

  if (changed) {
    await wait(500);
    document.body.click();
    await wait(500);
  }
  return changed;
}

async function chooseEquipmentIfPossible(config, profile) {
  if (!config.search?.equipmentTriggerSelectors?.length) return false;
  const targetLabels = config.search.equipmentOptions?.[profile?.equipmentType || 'tent'] || [];
  if (!targetLabels.length) return false;

  const trigger = findField(config.search.equipmentTriggerSelectors);
  if (!trigger) return false;

  clickElement(trigger);
  await wait(700);

  const option = findButtonByTerms(targetLabels, [
    'mat-option',
    '[role="option"]',
    'option',
    '.mat-mdc-option',
    '.ng-option',
  ]);
  if (!option) {
    document.body.click();
    return false;
  }

  clickElement(option.el);
  await wait(500);
  return true;
}

async function runSearchStep(platform, plan, profile) {
  const config = getAssistConfig(platform);
  if (!config.search) {
    return { success: false, stage: 'search_not_configured', keepArmed: true, platform };
  }

  await dismissConsentIfPresent(platform);
  await setSearchDates(config, plan);
  await chooseEquipmentIfPossible(config, profile);

  const searchBtn = config.search.searchButtonSelectors?.length
    ? (() => {
        const el = findField(config.search.searchButtonSelectors);
        return el ? { el, label: getButtonLabel(el) } : null;
      })()
    : findButtonByTerms(config.search.searchButtonTerms);
  if (!searchBtn) {
    return { success: false, stage: 'search_button_missing', keepArmed: true, platform };
  }

  clickElement(searchBtn.el);
  await wait(1600);

  const nextPageType = getPageType();
  return {
    success: true,
    stage: nextPageType === 'grid' ? 'search_complete' : 'search_submitted',
    keepArmed: nextPageType !== 'cart' && nextPageType !== 'form',
    platform,
  };
}

async function runBookingAssist(plan, profile) {
  const platform = detectPlatform();
  if (!platform) {
    emitBookingFailed(plan, null, 'unsupported_page');
    return { success: false, stage: 'unsupported_page', keepArmed: true };
  }

  const pageType = getPageType();
  emitAutofillStarted(plan, platform, pageType);

  if (pageType === 'confirmation') {
    emitBookingConfirmed(plan, platform);
    return { success: true, stage: 'completed', keepArmed: false, platform };
  }

  if (pageType === 'waf') {
    emitBookingFailed(plan, platform, 'waf_detected');
    return {
      success: false,
      stage: 'waf_detected',
      keepArmed: true,
      platform,
      message: 'Protected gateway page detected. Waiting for a warmer session.',
    };
  }

  if (pageType === 'cart') {
    return {
      success: true,
      stage: 'handoff_ready',
      keepArmed: false,
      platform,
      message: 'Review page is ready. Final confirm stays with you.',
    };
  }

  if (pageType === 'search') {
    return runSearchStep(platform, plan, profile);
  }

  if (pageType === 'grid') {
    const site = findMatchingSiteCard(plan);
    if (!site) {
      return { success: false, stage: 'grid_waiting', keepArmed: true, platform };
    }
    clickElement(site.el);
    await wait(900);

    const continueBtn = plan?.aggressiveAssist ? findSafeContinueButton() : null;
    if (continueBtn) {
      clickElement(continueBtn.el);
      await wait(1200);
    }

    const nextPageType = getPageType();
    if (nextPageType === 'form') {
      const fillResult = await fillBookingForms(profile, plan);
      const nextBtn = findSafeContinueButton();
      if (nextBtn) {
        emitBookingSubmitted(plan, platform, getButtonLabel(nextBtn.el));
        clickElement(nextBtn.el);
        await wait(1200);
      }
      const afterFillPage = getPageType();
      if (afterFillPage === 'cart') {
        return {
          success: true,
          stage: 'handoff_ready',
          keepArmed: false,
          platform,
          selectedSite: site.label,
          filled: fillResult.filled,
        };
      }
      return {
        success: true,
        stage: 'forms_filled',
        keepArmed: afterFillPage !== 'cart',
        platform,
        selectedSite: site.label,
        filled: fillResult.filled,
      };
    }

    return {
      success: true,
      stage: 'site_selected',
      keepArmed: true,
      platform,
      selectedSite: site.label,
    };
  }

  if (pageType === 'form') {
    const fillResult = await fillBookingForms(profile, plan);
    const nextBtn = plan?.aggressiveAssist ? findSafeContinueButton() : null;
    if (nextBtn) {
      emitBookingSubmitted(plan, platform, getButtonLabel(nextBtn.el));
      clickElement(nextBtn.el);
      await wait(1200);
    }
    const afterPageType = getPageType();
    return {
      success: true,
      stage: afterPageType === 'cart' ? 'handoff_ready' : 'forms_filled',
      keepArmed: afterPageType !== 'cart',
      platform,
      filled: fillResult.filled,
      total: fillResult.total,
    };
  }

  return { success: false, stage: 'waiting_for_supported_step', keepArmed: true, platform };
}

function fillBookingForms(profile, plan = {}) {
  const platform = detectPlatform();
  if (!platform) return { filled: 0, total: 0, fields: [] };
  emitAutofillStarted(plan, platform, 'form');

  const fieldMap = FIELD_MAPS[platform];
  const profileMap = {
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone,
    addressLine1: profile.addressLine1,
    city: profile.city,
    stateProvince: profile.stateProvince,
    postalCode: profile.postalCode,
    country: profile.country,
    residency: profile.residency,
    vehiclePlate: profile.vehiclePlate,
    vehicleLength: profile.vehicleLength,
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
      emitFieldNotFound(plan, platform, results, filled, total);
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

  if (message.action === 'run_booking_assist') {
    const profile = message.profile;
    if (!profile) {
      sendResponse({ success: false, error: 'No profile data', keepArmed: false });
      return;
    }
    runBookingAssist(message.plan || {}, profile).then((result) => {
      sendResponse(result);
    });
    return true;
  }
});

console.log('[Alphacamper] Autofill content script loaded on', window.location.hostname);

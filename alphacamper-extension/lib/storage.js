const Storage = {
  _defaults: {
    profile: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      addressLine1: '',
      city: '',
      stateProvince: '',
      postalCode: '',
      country: 'CA',
      residency: '',
      vehiclePlate: '',
      vehicleLength: '',
      equipmentType: 'tent',
      partySize: 2,
      createdAt: null,
      updatedAt: null
    },
    missions: [],
    settings: {
      countdownAudio: false,
      notifyBefore: 5,
      aggressiveAssist: true
    }
  },

  async getProfile() {
    const result = await chrome.storage.local.get('profile');
    return { ...this._defaults.profile, ...(result.profile || {}) };
  },

  async setProfile(profile) {
    profile.updatedAt = new Date().toISOString();
    if (!profile.createdAt) profile.createdAt = profile.updatedAt;
    await chrome.storage.local.set({ profile });
    return profile;
  },

  async getMissions() {
    const result = await chrome.storage.local.get('missions');
    return result.missions || [];
  },

  async setMissions(missions) {
    await chrome.storage.local.set({ missions });
    return missions;
  },

  async getMission(id) {
    const missions = await this.getMissions();
    return missions.find(m => m.id === id) || null;
  },

  async saveMission(mission) {
    const missions = await this.getMissions();
    const idx = missions.findIndex(m => m.id === mission.id);
    mission.updatedAt = new Date().toISOString();
    if (idx >= 0) {
      missions[idx] = mission;
    } else {
      missions.push(mission);
    }
    await this.setMissions(missions);
    return mission;
  },

  async deleteMission(id) {
    const missions = await this.getMissions();
    const filtered = missions.filter(m => m.id !== id);
    await this.setMissions(filtered);
  },

  async getSettings() {
    const result = await chrome.storage.local.get('settings');
    return { ...this._defaults.settings, ...(result.settings || {}) };
  },

  async setSettings(settings) {
    await chrome.storage.local.set({ settings });
    return settings;
  },

  async clearAll() {
    await chrome.storage.local.clear();
  }
};

globalThis.Storage = Storage;

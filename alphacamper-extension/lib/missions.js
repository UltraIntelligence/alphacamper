const Missions = {
  async create(name) {
    const mission = {
      id: crypto.randomUUID(),
      name: name || 'New Mission',
      status: 'planning',
      targets: [],
      bookingWindow: {
        date: '',
        time: '',
        timezone: 'America/Los_Angeles'
      },
      rehearsalResults: {
        bestTime: null,
        attempts: 0,
        lastAttempt: null
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await Storage.saveMission(mission);
    return mission;
  },

  async update(id, updates) {
    const mission = await Storage.getMission(id);
    if (!mission) return null;
    Object.assign(mission, updates);
    mission.updatedAt = new Date().toISOString();
    await Storage.saveMission(mission);
    return mission;
  },

  async delete(id) {
    await Storage.deleteMission(id);
  },

  async addTarget(missionId, targetData) {
    const mission = await Storage.getMission(missionId);
    if (!mission) return null;
    const maxRank = mission.targets.reduce((max, t) => Math.max(max, t.rank), 0);
    const target = {
      id: crypto.randomUUID(),
      rank: maxRank + 1,
      platform: targetData.platform || 'recreation_gov',
      parkName: targetData.parkName || '',
      campgroundName: targetData.campgroundName || '',
      siteNumber: targetData.siteNumber || null,
      arrivalDate: targetData.arrivalDate || '',
      departureDate: targetData.departureDate || '',
      deepLink: targetData.deepLink || '',
      notes: targetData.notes || ''
    };
    mission.targets.push(target);
    mission.updatedAt = new Date().toISOString();
    await Storage.saveMission(mission);
    return target;
  },

  async removeTarget(missionId, targetId) {
    const mission = await Storage.getMission(missionId);
    if (!mission) return;
    mission.targets = mission.targets.filter(t => t.id !== targetId);
    mission.targets.forEach((t, i) => { t.rank = i + 1; });
    mission.updatedAt = new Date().toISOString();
    await Storage.saveMission(mission);
  },

  async reorderTargets(missionId, orderedIds) {
    const mission = await Storage.getMission(missionId);
    if (!mission) return;
    const reordered = [];
    orderedIds.forEach((id, i) => {
      const target = mission.targets.find(t => t.id === id);
      if (target) {
        target.rank = i + 1;
        reordered.push(target);
      }
    });
    mission.targets = reordered;
    mission.updatedAt = new Date().toISOString();
    await Storage.saveMission(mission);
  },

  async updateRehearsalResults(missionId, results) {
    const mission = await Storage.getMission(missionId);
    if (!mission) return;
    const current = mission.rehearsalResults;
    current.attempts += 1;
    current.lastAttempt = new Date().toISOString();
    if (current.bestTime === null || results.totalTime < current.bestTime) {
      current.bestTime = results.totalTime;
    }
    mission.updatedAt = new Date().toISOString();
    await Storage.saveMission(mission);
    return current;
  },

  generateDeepLink(platform, campgroundId) {
    const p = PLATFORMS[platform];
    if (!p) return '';
    if (platform === 'recreation_gov') {
      return p.deepLinkTemplate.replace('{campgroundId}', campgroundId);
    }
    if (platform === 'bc_parks') {
      return p.deepLinkTemplate.replace('{locationId}', campgroundId);
    }
    return '';
  }
};

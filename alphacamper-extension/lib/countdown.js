const Countdown = {
  getMs(targetDate, targetTime, timezone) {
    if (!targetDate || !targetTime) return null;
    const dtStr = `${targetDate}T${targetTime}:00`;
    const target = new Date(dtStr);
    // Approximate timezone offset — for MVP we use local time
    const now = new Date();
    return target.getTime() - now.getTime();
  },

  format(ms) {
    if (ms === null || ms <= 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds]
      .map(v => String(v).padStart(2, '0'))
      .join(':');
  },

  start(element, targetDate, targetTime, timezone, onZero) {
    const update = () => {
      const ms = this.getMs(targetDate, targetTime, timezone);
      if (ms !== null && ms <= 0) {
        element.textContent = '00:00:00';
        if (onZero) onZero();
        clearInterval(intervalId);
        return;
      }
      element.textContent = this.format(ms);
    };
    update();
    const intervalId = setInterval(update, 1000);
    return intervalId;
  }
};

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_KEYS_BY_INDEX = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export const getDefaultBusinessHours = () => ({
  days: {
    monday: { open: '10:30', close: '20:00', closed: false },
    tuesday: { open: '10:30', close: '20:00', closed: true },
    wednesday: { open: '10:30', close: '20:00', closed: false },
    thursday: { open: '10:30', close: '20:00', closed: false },
    friday: { open: '10:30', close: '20:00', closed: false },
    saturday: { open: '10:30', close: '20:00', closed: false },
    sunday: { open: '10:30', close: '20:00', closed: false }
  }
});

export const normalizeBusinessHours = (value = {}) => {
  const fallback = getDefaultBusinessHours();
  const incomingDays = value.days || {};
  const normalizedDays = DAY_ORDER.reduce((acc, dayKey) => {
    const fallbackDay = fallback.days[dayKey];
    const dayValue = incomingDays[dayKey] || {};
    acc[dayKey] = {
      open: dayValue.open || fallbackDay.open,
      close: dayValue.close || fallbackDay.close,
      closed: typeof dayValue.closed === 'boolean' ? dayValue.closed : fallbackDay.closed
    };
    return acc;
  }, {});

  return {
    ...fallback,
    ...value,
    days: normalizedDays
  };
};

export const parseTimeToMinutes = (timeValue) => {
  if (!timeValue || typeof timeValue !== 'string') return null;
  const [hours, minutes] = timeValue.split(':').map((part) => parseInt(part, 10));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

export const getDayKeyFromDate = (date) => DAY_KEYS_BY_INDEX[date.getDay()];

export const getZonedNow = (timeZone) => {
  if (!timeZone) {
    return new Date();
  }

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const parts = formatter.formatToParts(new Date());
  const map = parts.reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});
  const isoLike = `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}`;
  return new Date(isoLike);
};

export const isWithinBusinessHours = (businessHours, date = new Date()) => {
  const normalized = normalizeBusinessHours(businessHours);
  const dayKey = getDayKeyFromDate(date);
  const day = normalized.days[dayKey];
  if (!day || day.closed) return false;

  const openMinutes = parseTimeToMinutes(day.open);
  const closeMinutes = parseTimeToMinutes(day.close);
  if (openMinutes === null || closeMinutes === null) return false;

  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  if (openMinutes === closeMinutes) return false;

  if (openMinutes < closeMinutes) {
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  }

  return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
};

export const getNextOpeningDate = (businessHours, date = new Date()) => {
  const normalized = normalizeBusinessHours(businessHours);
  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  for (let offset = 0; offset <= 7; offset += 1) {
    const candidateDate = new Date(date);
    candidateDate.setDate(date.getDate() + offset);
    const dayKey = getDayKeyFromDate(candidateDate);
    const day = normalized.days[dayKey];

    if (!day || day.closed) {
      continue;
    }

    const openMinutes = parseTimeToMinutes(day.open);
    const closeMinutes = parseTimeToMinutes(day.close);
    if (openMinutes === null || closeMinutes === null) {
      continue;
    }

    if (offset === 0) {
      if (openMinutes < closeMinutes) {
        if (currentMinutes < openMinutes) {
          candidateDate.setHours(Math.floor(openMinutes / 60), openMinutes % 60, 0, 0);
          return candidateDate;
        }
        if (currentMinutes >= closeMinutes) {
          continue;
        }
      } else if (openMinutes > closeMinutes) {
        if (currentMinutes < closeMinutes || currentMinutes >= openMinutes) {
          continue;
        }
        candidateDate.setHours(Math.floor(openMinutes / 60), openMinutes % 60, 0, 0);
        return candidateDate;
      }
      continue;
    }

    candidateDate.setHours(Math.floor(openMinutes / 60), openMinutes % 60, 0, 0);
    return candidateDate;
  }

  return null;
};

export const formatNextOpening = (nextOpeningDate, now = new Date()) => {
  if (!nextOpeningDate) return '';

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfNext = new Date(nextOpeningDate);
  startOfNext.setHours(0, 0, 0, 0);
  const diffDays = Math.round((startOfNext - startOfToday) / (24 * 60 * 60 * 1000));

  let dayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(nextOpeningDate);
  if (diffDays === 0) {
    dayLabel = 'Today';
  } else if (diffDays === 1) {
    dayLabel = 'Tomorrow';
  }

  const timeLabel = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(nextOpeningDate);

  return `${dayLabel} at ${timeLabel}`;
};

export const getBusinessHoursDayOrder = () => DAY_ORDER;

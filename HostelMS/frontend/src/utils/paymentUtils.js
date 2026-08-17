// Payment period utilities
export const getPeriodLabel = (period) => {
  if (period === 'H1') return 'Half 1 (Jan - Jun)';
  if (period === 'H2') return 'Half 2 (Jul - Dec)';
  return period;
};

export const getPeriodShortLabel = (period) => {
  if (period === 'H1') return 'Jan-Jun';
  if (period === 'H2') return 'Jul-Dec';
  return period;
};

export const getPeriodDateRange = (period, year) => {
  if (period === 'H1') {
    return {
      start: new Date(year, 0, 1),
      end: new Date(year, 5, 30),
    };
  }
  if (period === 'H2') {
    return {
      start: new Date(year, 6, 1),
      end: new Date(year, 11, 31),
    };
  }
  return null;
};

export const getDueDateForPeriod = (period, year) => {
  if (period === 'H1') return new Date(year, 5, 30); // June 30
  if (period === 'H2') return new Date(year, 11, 31); // December 31
  return null;
};

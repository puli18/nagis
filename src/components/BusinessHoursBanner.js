import React from 'react';
import { useBusinessHours } from '../context/BusinessHoursContext';
import { formatNextOpening } from '../utils/businessHours';

const BusinessHoursBanner = () => {
  const { isLoading, isOpenNow, nextOpeningDate } = useBusinessHours();

  if (isLoading || isOpenNow) {
    return null;
  }

  const nextOpeningLabel = formatNextOpening(nextOpeningDate);

  return (
    <div className="business-hours-banner">
      <span>We are closed now.</span>
      {nextOpeningLabel && (
        <span>Next opening: {nextOpeningLabel}</span>
      )}
    </div>
  );
};

export default BusinessHoursBanner;

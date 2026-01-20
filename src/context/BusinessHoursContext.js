import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { realtimeDb } from '../firebase/config';
import {
  getDefaultBusinessHours,
  getNextOpeningDate,
  getZonedNow,
  isWithinBusinessHours,
  normalizeBusinessHours
} from '../utils/businessHours';

const BusinessHoursContext = createContext(null);
const BUSINESS_TIMEZONE = 'Australia/Perth';

export const BusinessHoursProvider = ({ children }) => {
  const [businessHours, setBusinessHours] = useState(getDefaultBusinessHours());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(getZonedNow(BUSINESS_TIMEZONE));

  useEffect(() => {
    const hoursRef = ref(realtimeDb, 'businessHours');
    const unsubscribe = onValue(
      hoursRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setBusinessHours(normalizeBusinessHours(snapshot.val()));
        } else {
          setBusinessHours(getDefaultBusinessHours());
        }
        setIsLoading(false);
      },
      (err) => {
        console.error('Failed to load business hours:', err);
        setError('Unable to load business hours.');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(getZonedNow(BUSINESS_TIMEZONE)), 60000);
    return () => clearInterval(interval);
  }, []);

  const normalizedHours = useMemo(
    () => normalizeBusinessHours(businessHours),
    [businessHours]
  );

  const isOpenNow = useMemo(
    () => isWithinBusinessHours(normalizedHours, now),
    [normalizedHours, now]
  );

  const nextOpeningDate = useMemo(
    () => getNextOpeningDate(normalizedHours, now),
    [normalizedHours, now]
  );

  const value = useMemo(
    () => ({
      businessHours: normalizedHours,
      isLoading,
      error,
      now,
      isOpenNow,
      nextOpeningDate
    }),
    [normalizedHours, isLoading, error, now, isOpenNow, nextOpeningDate]
  );

  return (
    <BusinessHoursContext.Provider value={value}>
      {children}
    </BusinessHoursContext.Provider>
  );
};

export const useBusinessHours = () => {
  const context = useContext(BusinessHoursContext);
  if (!context) {
    throw new Error('useBusinessHours must be used within a BusinessHoursProvider');
  }
  return context;
};

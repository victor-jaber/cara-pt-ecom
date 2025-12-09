import { useState, useEffect, useCallback } from "react";

export type UserLocation = "portugal" | "international" | null;

interface LocationState {
  location: UserLocation;
  isMedicalProfessionalConfirmed: boolean;
  isLoading: boolean;
}

const LOCATION_KEY = "cara_user_location";
const MEDICAL_CONFIRMED_KEY = "cara_medical_professional_confirmed";

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    location: null,
    isMedicalProfessionalConfirmed: false,
    isLoading: true,
  });

  useEffect(() => {
    const savedLocation = localStorage.getItem(LOCATION_KEY) as UserLocation;
    const savedMedicalConfirmed = localStorage.getItem(MEDICAL_CONFIRMED_KEY) === "true";
    
    setState({
      location: savedLocation,
      isMedicalProfessionalConfirmed: savedMedicalConfirmed,
      isLoading: false,
    });
  }, []);

  const setLocation = useCallback((location: UserLocation) => {
    if (location) {
      localStorage.setItem(LOCATION_KEY, location);
    } else {
      localStorage.removeItem(LOCATION_KEY);
    }
    setState(prev => ({ ...prev, location }));
  }, []);

  const confirmMedicalProfessional = useCallback(() => {
    localStorage.setItem(MEDICAL_CONFIRMED_KEY, "true");
    setState(prev => ({ ...prev, isMedicalProfessionalConfirmed: true }));
  }, []);

  const resetLocation = useCallback(() => {
    localStorage.removeItem(LOCATION_KEY);
    localStorage.removeItem(MEDICAL_CONFIRMED_KEY);
    setState({
      location: null,
      isMedicalProfessionalConfirmed: false,
      isLoading: false,
    });
  }, []);

  const isPortugal = state.location === "portugal";
  const isInternational = state.location === "international";
  const canAccessPrices = isInternational && state.isMedicalProfessionalConfirmed;
  const needsLocationSelection = !state.isLoading && state.location === null;
  const needsMedicalConfirmation = isInternational && !state.isMedicalProfessionalConfirmed;

  return {
    ...state,
    isPortugal,
    isInternational,
    canAccessPrices,
    needsLocationSelection,
    needsMedicalConfirmation,
    setLocation,
    confirmMedicalProfessional,
    resetLocation,
  };
}

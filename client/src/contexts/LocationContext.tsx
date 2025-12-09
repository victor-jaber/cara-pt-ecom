import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { MedicalConfirmationModal } from "@/components/location-modal";

export type UserLocation = "portugal" | "international" | null;

interface LocationContextType {
  location: UserLocation;
  isMedicalProfessionalConfirmed: boolean;
  isLoading: boolean;
  isPortugal: boolean;
  isInternational: boolean;
  canAccessPricesAsInternational: boolean;
  needsLocationSelection: boolean;
  needsMedicalConfirmation: boolean;
  setLocation: (location: UserLocation) => void;
  confirmMedicalProfessional: () => void;
  resetLocation: () => void;
  showMedicalConfirmation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const LOCATION_KEY = "cara_user_location";
const MEDICAL_CONFIRMED_KEY = "cara_medical_professional_confirmed";

interface LocationProviderProps {
  children: ReactNode;
}

async function detectCountryByIP(): Promise<"portugal" | "international"> {
  try {
    const response = await fetch("https://ip-api.com/json/?fields=countryCode");
    const data = await response.json();
    return data.countryCode === "PT" ? "portugal" : "international";
  } catch (error) {
    console.warn("Could not detect location by IP, defaulting to international:", error);
    return "international";
  }
}

export function LocationProvider({ children }: LocationProviderProps) {
  const [location, setLocationState] = useState<UserLocation>(null);
  const [isMedicalProfessionalConfirmed, setMedicalConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showMedicalModal, setShowMedicalModal] = useState(false);

  useEffect(() => {
    const initLocation = async () => {
      const savedLocation = localStorage.getItem(LOCATION_KEY) as UserLocation;
      const savedMedicalConfirmed = localStorage.getItem(MEDICAL_CONFIRMED_KEY) === "true";
      
      setMedicalConfirmed(savedMedicalConfirmed);

      if (savedLocation) {
        setLocationState(savedLocation);
        setIsLoading(false);
      } else {
        const detectedLocation = await detectCountryByIP();
        localStorage.setItem(LOCATION_KEY, detectedLocation);
        setLocationState(detectedLocation);
        setIsLoading(false);
        
        if (detectedLocation === "international") {
          setShowMedicalModal(true);
        }
      }
    };

    initLocation();
  }, []);

  const setLocation = useCallback((newLocation: UserLocation) => {
    if (newLocation) {
      localStorage.setItem(LOCATION_KEY, newLocation);
      setLocationState(newLocation);

      if (newLocation === "international") {
        setShowMedicalModal(true);
      }
    } else {
      localStorage.removeItem(LOCATION_KEY);
      setLocationState(null);
    }
  }, []);

  const confirmMedicalProfessional = useCallback(() => {
    localStorage.setItem(MEDICAL_CONFIRMED_KEY, "true");
    setMedicalConfirmed(true);
    setShowMedicalModal(false);
  }, []);

  const resetLocation = useCallback(async () => {
    localStorage.removeItem(LOCATION_KEY);
    localStorage.removeItem(MEDICAL_CONFIRMED_KEY);
    setLocationState(null);
    setMedicalConfirmed(false);
    
    const detectedLocation = await detectCountryByIP();
    localStorage.setItem(LOCATION_KEY, detectedLocation);
    setLocationState(detectedLocation);
    
    if (detectedLocation === "international") {
      setShowMedicalModal(true);
    }
  }, []);

  const showMedicalConfirmation = useCallback(() => {
    setShowMedicalModal(true);
  }, []);

  const handleMedicalCancel = useCallback(() => {
    setShowMedicalModal(false);
  }, []);

  const isPortugal = location === "portugal";
  const isInternational = location === "international";
  const canAccessPricesAsInternational = isInternational && isMedicalProfessionalConfirmed;
  const needsLocationSelection = !isLoading && location === null;
  const needsMedicalConfirmation = isInternational && !isMedicalProfessionalConfirmed;

  return (
    <LocationContext.Provider
      value={{
        location,
        isMedicalProfessionalConfirmed,
        isLoading,
        isPortugal,
        isInternational,
        canAccessPricesAsInternational,
        needsLocationSelection,
        needsMedicalConfirmation,
        setLocation,
        confirmMedicalProfessional,
        resetLocation,
        showMedicalConfirmation,
      }}
    >
      {children}
      <MedicalConfirmationModal
        open={showMedicalModal}
        onConfirm={confirmMedicalProfessional}
        onCancel={handleMedicalCancel}
      />
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocationContext must be used within a LocationProvider");
  }
  return context;
}

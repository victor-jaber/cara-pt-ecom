import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export type UserLocation = "portugal" | "international" | null;

interface LocationContextType {
  location: UserLocation;
  isLoading: boolean;
  isPortugal: boolean;
  isInternational: boolean;
  needsLocationSelection: boolean;
  setLocation: (location: UserLocation) => void;
  resetLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const LOCATION_KEY = "cara_user_location";

interface LocationProviderProps {
  children: ReactNode;
}

async function detectCountryByIP(): Promise<"portugal" | "international"> {
  try {
    // Using ipapi.co which supports HTTPS for free
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();
    return data.country_code === "PT" ? "portugal" : "international";
  } catch (error) {
    console.warn("Could not detect location by IP, defaulting to international:", error);
    return "international";
  }
}

export function LocationProvider({ children }: LocationProviderProps) {
  const [location, setLocationState] = useState<UserLocation>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initLocation = async () => {
      const savedLocation = localStorage.getItem(LOCATION_KEY) as UserLocation;

      if (savedLocation) {
        setLocationState(savedLocation);
        setIsLoading(false);
      } else {
        const detectedLocation = await detectCountryByIP();
        localStorage.setItem(LOCATION_KEY, detectedLocation);
        setLocationState(detectedLocation);
        setIsLoading(false);
      }
    };

    initLocation();
  }, []);

  const setLocation = useCallback((newLocation: UserLocation) => {
    if (newLocation) {
      localStorage.setItem(LOCATION_KEY, newLocation);
      setLocationState(newLocation);
    } else {
      localStorage.removeItem(LOCATION_KEY);
      setLocationState(null);
    }
  }, []);

  const resetLocation = useCallback(async () => {
    localStorage.removeItem(LOCATION_KEY);
    setLocationState(null);
    
    const detectedLocation = await detectCountryByIP();
    localStorage.setItem(LOCATION_KEY, detectedLocation);
    setLocationState(detectedLocation);
  }, []);

  const isPortugal = location === "portugal";
  const isInternational = location === "international";
  const needsLocationSelection = !isLoading && location === null;

  return (
    <LocationContext.Provider
      value={{
        location,
        isLoading,
        isPortugal,
        isInternational,
        needsLocationSelection,
        setLocation,
        resetLocation,
      }}
    >
      {children}
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

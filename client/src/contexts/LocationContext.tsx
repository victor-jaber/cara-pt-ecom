import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export type UserLocation = "portugal" | "international" | null;

interface LocationContextType {
  location: UserLocation;
  countryCode: string | null;
  region: string | null;
  isLoading: boolean;
  isPortugal: boolean;
  isInternational: boolean;
  needsLocationSelection: boolean;
  setLocation: (location: UserLocation) => void;
  resetLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const LOCATION_KEY = "cara_user_location";
const COUNTRY_CODE_KEY = "cara_user_country_code";
const REGION_KEY = "cara_user_region";

interface LocationProviderProps {
  children: ReactNode;
}

async function detectLocation(): Promise<{ location: "portugal" | "international"; countryCode: string; region: string | null }> {
  try {
    // Using ipapi.co which supports HTTPS for free
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();
    const countryCode = data.country_code || "US";
    const region = typeof data.region === "string" ? data.region : null;
    return {
      location: countryCode === "PT" ? "portugal" : "international",
      countryCode,
      region,
    };
  } catch (error) {
    console.warn("Could not detect location by IP, defaulting to international:", error);
    return { location: "international", countryCode: "US", region: null };
  }
}

export function LocationProvider({ children }: LocationProviderProps) {
  const [location, setLocationState] = useState<UserLocation>(null);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initLocation = async () => {
      const savedLocation = localStorage.getItem(LOCATION_KEY) as UserLocation;
      const savedCountryCode = localStorage.getItem(COUNTRY_CODE_KEY);
      const savedRegion = localStorage.getItem(REGION_KEY);

      if (savedLocation) {
        setLocationState(savedLocation);
        setCountryCode(savedCountryCode);
        setRegion(savedRegion);
        setIsLoading(false);
      } else {
        const detection = await detectLocation();
        localStorage.setItem(LOCATION_KEY, detection.location);
        localStorage.setItem(COUNTRY_CODE_KEY, detection.countryCode);
        if (detection.region) {
          localStorage.setItem(REGION_KEY, detection.region);
        }
        setLocationState(detection.location);
        setCountryCode(detection.countryCode);
        setRegion(detection.region);
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
      localStorage.removeItem(COUNTRY_CODE_KEY);
      localStorage.removeItem(REGION_KEY);
      setLocationState(null);
      setCountryCode(null);
      setRegion(null);
    }
  }, []);

  const resetLocation = useCallback(async () => {
    localStorage.removeItem(LOCATION_KEY);
    setLocationState(null);

    const detection = await detectLocation();
    localStorage.setItem(LOCATION_KEY, detection.location);
    localStorage.setItem(COUNTRY_CODE_KEY, detection.countryCode);
    if (detection.region) {
      localStorage.setItem(REGION_KEY, detection.region);
    } else {
      localStorage.removeItem(REGION_KEY);
    }
    setLocationState(detection.location);
    setCountryCode(detection.countryCode);
    setRegion(detection.region);
  }, []);

  const isPortugal = location === "portugal";
  const isInternational = location === "international";
  const needsLocationSelection = !isLoading && location === null;

  return (
    <LocationContext.Provider
      value={{
        location,
        countryCode,
        region,
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

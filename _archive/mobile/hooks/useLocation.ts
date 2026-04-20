import { useEffect, useState } from "react";
import * as Location from "expo-location";

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLocation(): LocationState {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function requestLocation(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setError("Location permission denied");
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);
    } catch (err) {
      setError("Could not get location");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    requestLocation();
  }, []);

  return {
    latitude,
    longitude,
    loading,
    error,
    refresh: requestLocation,
  };
}

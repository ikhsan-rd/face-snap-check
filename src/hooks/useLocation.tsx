import { useState, useCallback } from "react";

export interface LocationData {
  Flatitude: string;
  Flongitude: string;
  Flokasi: string;
  FmapUrl: string;
}

export const useLocation = () => {
  const [locationData, setLocationData] = useState<LocationData>({
    Flatitude: "0",
    Flongitude: "0",
    Flokasi: "",
    FmapUrl: "",
  });

  // Get address from coordinates using Nominatim
  const getAddressFromCoordinates = async (
    latitude: number,
    longitude: number
  ): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return data.display_name || "Unknown location";
    } catch (error) {
      console.error("Failed to get address:", error);
      return "Error getting location";
    }
  };

  // Get location and decode address
  const getLocationAndDecode = useCallback(async (): Promise<LocationData> => {
    if (!navigator.geolocation) {
      throw new Error("Geolocation is not supported by this browser");
    }

    return new Promise<LocationData>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            const accuracy = position.coords.accuracy;

            let Flokasi = await getAddressFromCoordinates(latitude, longitude);

            if (accuracy > 300) {
              Flokasi = `⚠ (Lokasi mungkin tidak akurat) ⚠ --- ${Flokasi}`;
            }

            const FmapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

            const locationResult = {
              Flatitude: latitude.toString(),
              Flongitude: longitude.toString(),
              Flokasi,
              FmapUrl,
            };

            setLocationData(locationResult);
            resolve(locationResult);
          } catch (error) {
            reject(error);
          }
        },
        (error) => {
          let message = "";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = "Location access denied by user";
              break;
            case error.POSITION_UNAVAILABLE:
              message = "Location information unavailable";
              break;
            case error.TIMEOUT:
              message = "Location request timeout";
              break;
            default:
              message = "Unknown location error";
          }
          reject(new Error(message));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, []);

  return {
    locationData,
    setLocationData,
    getLocationAndDecode,
  };
};
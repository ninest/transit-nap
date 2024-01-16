import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import MapView, { Marker, Region } from "react-native-maps";

function useCheckLocationPermission(permissionsPage: string) {
  const router = useRouter();
  useEffect(() => {
    async function check() {
      const response = await Location.getBackgroundPermissionsAsync();
      if (!response.granted) router.push(permissionsPage);
    }
    check();
  }, []);
}

function useLiveLocation() {
  const [location, setLocation] = useState<null | Location.LocationObject>(null);

  useEffect(() => {
    let locationSubscription: any;

    const start = async () => {
      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 500, distanceInterval: 0 },
        (newLocation) => {
          setLocation(newLocation);
        }
      );
    };
    start();

    return () => {
      if (locationSubscription) locationSubscription.remove();
    };
  }, []);

  return { location };
}

export default function PermissionsPage() {
  useCheckLocationPermission("/permissions");

  const { location } = useLiveLocation();
  const [followingUserLocation, setFollowingUserLocation] = useState(true);
  const [region, setRegion] = useState<null | Region>(null);

  useEffect(() => {
    if (location && followingUserLocation) {
      const delta = region
        ? { latitudeDelta: region.latitudeDelta, longitudeDelta: region.longitudeDelta }
        : { latitudeDelta: 0.1, longitudeDelta: 0.1 };
      console.log("setting location to follow user");
      setRegion({ ...delta, latitude: location.coords.latitude, longitude: location.coords.longitude });
    }
  }, [location]);

  return (
    <View className="relative">
      <View>
        {region && (
          <MapView
            className="w-full h-full"
            region={region}
            onRegionChange={(newRegion) => {
              setRegion(newRegion);
            }}
          >
            {/* User location marker */}
            {location && (
              <Marker coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}>
                <View className="w-5 h-5 rounded-full bg-blue-700/50 border-4 border-blue-700 "></View>
              </Marker>
            )}
          </MapView>
        )}
      </View>
    </View>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import MapView, { LatLng, MapPressEvent, Marker, Polyline, Region } from "react-native-maps";
import BottomSheet from "@gorhom/bottom-sheet";
import { getDistance } from "geolib";
import * as Notifications from "expo-notifications";
import { endBackgroundLocationTask, startBackgroundLocationTask } from "../tasks/background-location";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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
      setRegion({ ...delta, latitude: location.coords.latitude, longitude: location.coords.longitude });
    }
  }, [location]);

  // Map
  const handleMapRegionChange = (newRegion: Region) => {
    setRegion(newRegion);
  };

  const handleMapPress = (e: MapPressEvent) => {
    setDestination(e.nativeEvent.coordinate);
    startBackgroundLocationTask();
  };

  // Bottom sheet
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["15%", "35%"], []);

  const [destination, setDestination] = useState<null | LatLng>(null);
  const removeDestination = () => {
    setDestination(null);
    endBackgroundLocationTask();
  };

  const distanceAway = location && destination ? getDistance(location.coords, destination) : null;

  return (
    <View className="relative">
      <View>
        {region && (
          <MapView
            className="w-full h-full"
            region={region}
            onRegionChange={handleMapRegionChange}
            onPress={handleMapPress}
          >
            {/* User location marker */}
            {location && (
              <Marker coordinate={location.coords}>
                <View className="w-5 h-5 rounded-full bg-blue-700/50 border-4 border-blue-700 "></View>
              </Marker>
            )}

            {/* User's destination */}
            {destination && (
              <Marker coordinate={destination}>
                <View className="w-5 h-5 rounded-full bg-green-700/50 border-4 border-green-700 "></View>
              </Marker>
            )}

            {/* Line between current and destination */}
            {location && destination && (
              <Polyline
                coordinates={[location.coords, destination]}
                strokeColor="rgba(0, 0, 0, 0.5)"
                strokeWidth={2}
                lineDashPattern={[10, 10]}
              />
            )}
          </MapView>
        )}
      </View>
      <BottomSheet
        handleComponent={() => {
          return <></>;
        }}
        backgroundStyle={{ backgroundColor: "transparent" }}
        ref={bottomSheetRef}
        snapPoints={snapPoints}
      >
        <View className="bg-white rounded-t-xl shadow h-full w-full p-5 pt-7">
          <View className="border border-gray-300 px-5 py-3 rounded-md h-16 flex flex-row items-center justify-between">
            {destination ? (
              <>
                <Text>Going to address</Text>
                <Pressable className="bg-gray-100 p-2" onPress={removeDestination}>
                  <Text>Remove</Text>
                </Pressable>
              </>
            ) : (
              <Text className="text-gray-500">Where are you going?</Text>
            )}
          </View>

          {distanceAway && (
            <View className="mt-5">
              <Text>{distanceAway} meters away. You'll be reminded when you're under 200 meters away</Text>
            </View>
          )}
        </View>
      </BottomSheet>
    </View>
  );
}

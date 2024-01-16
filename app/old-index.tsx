import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import * as TaskManager from "expo-task-manager";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, Button } from "react-native";
import MapView, { LatLng, Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { getDistance } from "geolib";
import * as Notifications from "expo-notifications";
import BottomSheet from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const useLocation = () => {
  const [location, setLocation] = useState<null | Location.LocationObject>(null);
  const [errorMsg, setErrorMsg] = useState<null | string>(null);

  useEffect(() => {
    let locationSubscription: any;

    const requestLocationPermission = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 500,
          distanceInterval: 0,
        },
        (newLocation) => {
          setLocation(newLocation);
        }
      );
    };

    requestLocationPermission();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  return { location, errorMsg };
};

const LOCATION_TASK_NAME = "background-location-task-0.0.1";
const requestPermissions = async () => {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus === "granted") {
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus === "granted") {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
      });
    }
  }
};

export default function Page() {
  // console.log(Location.permission)
  // Location.requestBackgroundPermissionsAsync().then((r) => console.log(r));

  const insets = useSafeAreaInsets();
  const [region, setRegion] = useState<Region>({
    latitude: 42.3569124,
    longitude: -71.0601635,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  const { location, errorMsg } = useLocation();

  useEffect(() => {
    // if (location) setRegion({ ...region, latitude: location.coords.latitude, longitude: location.coords.longitude });
    if (endPoint && location) {
      console.log(location);
      const distance = getDistance(location?.coords, endPoint);
      if (distance < 1000) {
        Notifications.scheduleNotificationAsync({
          content: {
            title: "You've reached!",
            body: "Time to wake up.",
          },
          trigger: null,
        });
        setEndPoint(null);
      }
    }
  }, [location]);

  const [endPoint, setEndPoint] = useState<null | LatLng>(null);

  const goToCurrentLocation = () => {
    if (location) setRegion({ ...region, latitude: location.coords.latitude, longitude: location.coords.longitude });
  };

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["15%", "35%"], []);
  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
  }, []);

  return (
    <View className="relative">
      <View>
        <MapView
          className="w-full h-full"
          region={region}
          onRegionChange={(r) => {
            console.log(r);
            setRegion({ ...r, latitudeDelta: region.latitudeDelta, longitudeDelta: region.longitudeDelta });
          }}
          onPress={(e) => {
            setEndPoint(e.nativeEvent.coordinate);
          }}
        >
          {location && (
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="My Location"
            >
              <View className="w-5 h-5 rounded-full bg-blue-700/50 border-4 border-blue-700 "></View>
            </Marker>
          )}
          {endPoint && (
            <Marker coordinate={endPoint} title="Point" description="A point">
              <View className="w-5 h-5 rounded-full bg-black/50 border-4 border-black "></View>
            </Marker>
          )}
        </MapView>
      </View>
      {/* <View className="mx-10"> */}
      <BottomSheet
        style={{ marginLeft: 10, marginRight: 10 }}
        handleComponent={() => {
          return <></>;
        }}
        backgroundStyle={{ backgroundColor: "transparent" }}
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
      >
        <View className="bg-white h-full w-full">
          <Button onPress={requestPermissions} title="Enable background location" />

          <Text onPress={goToCurrentLocation}>current location</Text>
        </View>
      </BottomSheet>
      {/* </View> */}
      {/* <View className="absolute z-10 bottom-0 right-0">
        <View style={{ marginBottom: insets.bottom }}>
          <Pressable
            onPress={() => {
              if (location)
                setRegion({ ...region, latitude: location.coords.latitude, longitude: location.coords.longitude });
            }}
            className="mb-5 mr-5 w-20 h-20 rounded-full bg-gray-200 border-2 border-gray-400"
          ></Pressable>
        </View>
      </View> */}
    </View>
  );
}

// TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
//   if (error) {
//     // Error occurred - check `error.message` for more details.
//     console.log("Background Error");
//     console.log({ error });
//     return;
//   }
//   if (data) {
//     const { locations } = data as any;
//     console.log("Background data");
//     const location = locations[0];
//     console.log(location);
//     console.log(location.coords.speed);
//     if (location.coords.speed > 30) {
//       Notifications.scheduleNotificationAsync({
//         content: {
//           title: "Slow down.",
//           body: "You are too fast.",
//         },
//         trigger: null,
//       });
//     }
//   }
// });

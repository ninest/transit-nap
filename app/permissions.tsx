import { useEffect, useState } from "react";
import { View, Text, Button } from "react-native";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { Linking } from "react-native";

export default function PermissionsPage() {
  const [locationPermissionResponse, setLocationPermissionResponse] = useState<null | Location.PermissionResponse>(
    null
  );

  useEffect(() => {
    async function check() {
      const response = await Location.getBackgroundPermissionsAsync();
      console.log(response);
      setLocationPermissionResponse(response);
    }
    check();
  }, []);

  const enableBackgroundLocationPermission = async () => {
    const response = await Location.requestBackgroundPermissionsAsync();

    setLocationPermissionResponse(response);
    if (!response.canAskAgain) Linking.openSettings();
  };

  return (
    <View>
      <SafeAreaView>
        <Text>Permissions</Text>
        {locationPermissionResponse && (
          <View>
            <Text>Background location permission</Text>
            <Text>
              {locationPermissionResponse.granted ? (
                "Yes"
              ) : (
                <>
                  <Button title="Enable" onPress={enableBackgroundLocationPermission} />
                </>
              )}
            </Text>

            {locationPermissionResponse.granted ? (
              <Link href={"/"}>Home</Link>
            ) : (
              <Text>Location permission is required to use the app</Text>
            )}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

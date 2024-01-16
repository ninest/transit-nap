import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

const BG_LOCATION_TASK_NAME = "background-location-task-0.0.1";

export async function startBackgroundLocationTask() {
  await Location.startLocationUpdatesAsync(BG_LOCATION_TASK_NAME, { accuracy: Location.Accuracy.Highest });
}
export async function endBackgroundLocationTask() {
  await Location.stopLocationUpdatesAsync(BG_LOCATION_TASK_NAME);
}

TaskManager.defineTask(BG_LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) {
    console.error(error);
    return;
  }
  if (data) {
    const { locations } = data as any;
    const currentLocation = locations[0];

    console.log(currentLocation);
  }
});

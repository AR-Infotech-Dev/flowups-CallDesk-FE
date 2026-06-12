export function getCurrentVisitLocation() {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.reject(new Error("Location access is not supported on this device."));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          visited_latitude: position.coords.latitude,
          visited_longitude: position.coords.longitude,
          visited_location_accuracy: position.coords.accuracy,
        });
      },
      () => {
        reject(new Error("Location permission is required to confirm this visit."));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      }
    );
  });
}

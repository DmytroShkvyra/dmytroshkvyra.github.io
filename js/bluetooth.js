function connectDevice(device) {
  return device.connectGATT()
  .then(function(device){alert(device);})
}
   
// Simple
        
navigator.permissions.query({ name: 'bluetooth' })
.then(function(permission) {
  if (permission.state != 'granted') {
    console.log('User has forbidden websites to use bluetooth...');
    return;
  }
  if (permission.referringDevice) {
    // Let's try to connect to the Physical Web object first. 
    return connectDevice(permission.referringDevice);
  }
  if (permission.devices.length != 0) {
    // Some Bluetooth devices are already allowed to interact with this website.
    // Let's try to connect to all of them.
    return Promise.all(permission.devices.map(device => connectDevice));
  }
  // Prompt user to pick a nearby hearth rate sensor. 
  return permissions.request({ name: 'bluetooth', filters: [{ services: ['heart_rate'] }] })
  .then(function(result){
    if (result.state != 'granted') {
      return;
    }
    // Let's try to connect to the heart rate sensor.
    return connectDevice(result.devices[0]);
  });
});

// Restore

navigator.permissions.query({ name: 'bluetooth', deviceId: '123' })
.then(function(permission){
  if (permission.state != 'granted') {
    console.log('User has forbidden websites to use bluetooth...');
    return;
  }
  if (permission.devices.length != 0) {
    // My previously connected Bluetooth device is still there.
    // Let's try to connect to it.
    return connectDevice(permission.devices[0]);
  }
  console.log('Previous Bluetooth device access has been revoked.');
  // Proceed to regular workflow as above...
});
  
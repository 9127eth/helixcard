export interface DeviceInfo {
  sourceDevice: string;
  sourceBrowser: string;
  sourcePlatform: string;
}

export function getDeviceInfo(): DeviceInfo {
  const userAgent = window.navigator.userAgent;
  const platform = 'web'; // Since this is the web app

  // Detect device
  let sourceDevice = 'desktop';
  if (/iPhone|iPad|iPod/.test(userAgent)) {
    sourceDevice = 'ios';
  } else if (/Android/.test(userAgent)) {
    sourceDevice = 'android';
  }

  // Detect browser
  let sourceBrowser = 'other';
  if (/Firefox/.test(userAgent)) {
    sourceBrowser = 'firefox';
  } else if (/Chrome/.test(userAgent)) {
    sourceBrowser = 'chrome';
  } else if (/Safari/.test(userAgent)) {
    sourceBrowser = 'safari';
  } else if (/Edge/.test(userAgent)) {
    sourceBrowser = 'edge';
  }

  return {
    sourceDevice,
    sourceBrowser,
    sourcePlatform: platform
  };
}

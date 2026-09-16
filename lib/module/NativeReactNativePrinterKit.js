"use strict";

import { TurboModuleRegistry, Platform } from 'react-native';
function getModule() {
  return Platform.OS === 'android' ? TurboModuleRegistry.getEnforcing('ReactNativePrinterKit') : {};
}
export default getModule();
//# sourceMappingURL=NativeReactNativePrinterKit.js.map
import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

// Disable Reanimated strict mode to silence render property warnings if supported
if (typeof configureReanimatedLogger === 'function') {
  configureReanimatedLogger({
    level: ReanimatedLogLevel ? ReanimatedLogLevel.warn : 'warn' as any,
    strict: false,
  });
}

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

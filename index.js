/**
 * ═══════════════════════════════════════════════════════════════
 * Index Entry Point — LiveStream Premium
 * Registers the root component with AppRegistry.
 * ═══════════════════════════════════════════════════════════════
 */

import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);

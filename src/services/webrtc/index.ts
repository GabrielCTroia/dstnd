import { Platform } from 'react-native';
import { WebRTCInit as WebRTCInitIOS } from './ios';
import { WebRTCInit as WebRTCInitWeb } from './web';

console.log('os', Platform.OS);

export const WebRTCInit = (Platform.OS === 'web') 
  ? WebRTCInitWeb
  : WebRTCInitIOS;

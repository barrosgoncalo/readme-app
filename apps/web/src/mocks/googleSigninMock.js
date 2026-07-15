export const GoogleSignin = {
  configure: () => {},
  hasPlayServices: async () => true,
  signIn: async () => ({ user: { email: '', name: '', id: '' } }),
  signOut: async () => {},
  isSignedIn: async () => false,
};

export const GoogleSigninButton = {
  Size: { Standard: 'standard', Wide: 'wide', Icon: 'icon' },
  Color: { Dark: 'dark', Light: 'light' }
};

export const statusCodes = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  SIGN_IN_REQUIRED: 'SIGN_IN_REQUIRED'
};

export default {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes
};

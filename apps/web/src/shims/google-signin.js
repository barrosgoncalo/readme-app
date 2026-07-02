// Web stub for @react-native-google-signin/google-signin. Mobile uses the
// native module for Google sign-in; web uses Firebase's signInWithPopup
// instead, so this stub is never actually called — it just exists to keep
// the static import in shared/services/auth.js from breaking on web.
const noop = () => Promise.reject(new Error('@react-native-google-signin is not available on web'));
export const GoogleSignin = {
    configure: () => {},
    hasPlayServices: noop,
    signIn: noop,
};
export default { GoogleSignin };

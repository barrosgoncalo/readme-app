import { Colors } from '@readme/shared/src/constants/theme'

export const getPasswordDetails = (password) => {

    // If empty, return none
    if ( isEmpty(password) ) {
        return { level: 'none', color: Colors.password.gray, label: '' };
    }
    // STRONG: Meets 100% of your exact security conditions
    if ( hasValidLength(password) && hasNumbers(password) && hasMixedCase(password) ) {
        return { level: 'strong', color: Colors.password.green, label: 'Strong' };
    }
    // MEDIUM: Has the 6+ characters, but is still missing a number or mixed case
    if ( hasValidLength(password) ) {
        return { level: 'medium', color: Colors.password.orange, label: 'Medium' };
    }
    // WEAK: Fails the absolute baseline length requirement
    return { level: 'weak', color: Colors.password.red, label: 'Weak' };
};

export function isEmpty(password) {
    return password.length === 0;
}

export function hasNumbers(password) {
    return /\d/.test(password);
}

export function hasLowerCase(password) {
    return /[a-z]/.test(password);
}

export function hasUpperCase(password) {
    return /[A-Z]/.test(password);
}

export function hasMixedCase(password) {
    return hasLowerCase(password) && hasUpperCase(password);
}

export function hasValidLength(password) {
    return password.length >= 6;
}

// Password strength colors — fixed values, not theme-dependent.
const PASSWORD_COLORS = {
    gray:   '#ccc',
    red:    '#D32F2F',
    orange: '#F57C00',
    green:  '#388E3C',
};

export const getPasswordDetails = (password) => {

    // If empty, return none
    if ( isEmpty(password) ) {
        return { level: 'none', color: PASSWORD_COLORS.gray, label: '' };
    }
    // STRONG: Meets 100% of your exact security conditions
    if ( hasValidLength(password) && hasNumbers(password) && hasMixedCase(password) ) {
        return { level: 'strong', color: PASSWORD_COLORS.green, label: 'Strong' };
    }
    // MEDIUM: Has the 6+ characters, but is still missing a number or mixed case
    if ( hasValidLength(password) ) {
        return { level: 'medium', color: PASSWORD_COLORS.orange, label: 'Medium' };
    }
    // WEAK: Fails the absolute baseline length requirement
    return { level: 'weak', color: PASSWORD_COLORS.red, label: 'Weak' };
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

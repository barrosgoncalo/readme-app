import { Colors } from '@readme/shared/src/constants/theme'

export const getPasswordDetails = (password) => {
    if (password.length === 0) return { level: 'none', color: Colors.password.gray, label: '' };
    if (password.length < 6) return { level: 'weak', color: Colors.password.red, label: 'Weak' };

    const hasNumbers = /\d/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasMixedCase = hasLowerCase && hasUpperCase;

    // 1. WEAK: Less than 6 characters OR No mixed case when short
    if (password.length < 6 || (!hasMixedCase && password.length < 8)) {
        return { level: 'weak', color: Colors.password.red, label: 'Weak' };
    }

    // 2. STRONG: 10+ characters, has numbers, and has mixed case
    if (password.length >= 10 && hasNumbers && hasMixedCase) {
        return { level: 'strong', color: Colors.password.green, label: 'Strong' };
    }

    // 3. MEDIUM
    return { level: 'medium', color: Colors.password.orange, label: 'Medium' };
}

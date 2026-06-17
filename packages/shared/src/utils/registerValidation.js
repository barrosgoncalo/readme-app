// Shared password strength helper. Mirrors the rules in
// apps/mobile/src/screens/Auth/Register/registerUtils.js — kept in sync
// deliberately so both apps surface the same labels.

export function getPasswordDetails(password) {
    if (!password || password.length === 0) {
        return { level: 'none', color: '#ccc', label: '' };
    }
    if (password.length < 6) {
        return { level: 'weak', color: '#D32F2F', label: 'Weak' };
    }

    const hasNumbers = /\d/.test(password);
    const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);

    if (password.length >= 10 && hasNumbers && hasMixedCase) {
        return { level: 'strong', color: '#388E3C', label: 'Strong' };
    }
    return { level: 'medium', color: '#F57C00', label: 'Medium' };
}

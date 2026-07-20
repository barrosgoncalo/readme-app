import Field from '../../components/Field.jsx';
import Button from '../../components/Button.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';
import { getPasswordDetails, isValidEmail } from '@readme/shared/src/utils/registerUtils';

export default function Step1Credentials({ data, set, onNext, error }) {
    const strength = getPasswordDetails(data.password);
    const passwordsMatch = data.password && data.password === data.confirmPassword;
    
    // Check email validity
    const isEmailValid = isValidEmail(data.email);
    
    // Include isEmailValid in the continuation check
    const canContinue = isEmailValid && data.username && passwordsMatch && strength.level !== 'weak' && strength.level !== 'none';

    function onSubmit(e) {
        e.preventDefault();
        if (canContinue) onNext();
    }

    return (
        <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Field
                label="Email"
                type="email"
                value={data.email}
                onChange={(v) => set('email', v)}
                autoComplete="email" 
                required 
            />
            
            {/* Show an error if they've typed something but it's not a valid format yet */}
            {data.email && !isEmailValid && (
                <div style={{ color: '#D32F2F', fontSize: '0.85rem' }}>Please enter a valid email address.</div>
            )}

            <Field
                label="Username"
                value={data.username}
                onChange={(v) => set('username', v)}
                autoComplete="username"
                required
            />
            <Field
                label="Password"
                type="password"
                value={data.password}
                onChange={(v) => set('password', v)}
                autoComplete="new-password"
                required
            />
            {strength.label && (
                <div style={{ fontSize: '0.85rem', color: strength.color }}>
                    Strength: {strength.label}
                </div>
            )}
            <Field
                label="Confirm password"
                type="password"
                value={data.confirmPassword}
                onChange={(v) => set('confirmPassword', v)}
                autoComplete="new-password"
                required
            />
            {data.confirmPassword && !passwordsMatch && (
                <div style={{ color: '#D32F2F', fontSize: '0.85rem' }}>Passwords don't match.</div>
            )}
            <ErrorAlert>{error}</ErrorAlert>
            <Button type="submit" disabled={!canContinue}>Continue</Button>
        </form>
    );
}

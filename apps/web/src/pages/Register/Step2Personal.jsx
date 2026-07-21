import { useState } from 'react';
import Field from '../../components/Field.jsx';
import Button from '../../components/Button.jsx';
import Toggle from '../../components/Toggle.jsx';
import { calculateAge } from '@readme/shared/src/utils/registerUtils';

export default function Step2Personal({ data, set, onNext, onBack }) {
    const [ageError, setAgeError] = useState('');

    const canContinue = data.fullName && data.dob;

    const today = new Date().toISOString().split('T')[0];

    function handleDobChange(v) {
        set('dob', v);
        if (v && calculateAge(new Date(v)) < 16) {
            setAgeError('You must be at least 16 years old to create an account.');
        } else {
            setAgeError('');
        }
    }

    function onSubmit(e) {
        e.preventDefault();
        if (!canContinue) return;

        if (calculateAge(new Date(data.dob)) < 16) {
            setAgeError('You must be at least 16 years old to create an account.');
            return;
        }

        onNext();
    }

    return (
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Field
                label="Full name"
                value={data.fullName}
                onChange={(v) => set('fullName', v)}
                autoComplete="name"
                required
            />
            <Field
                label="Phone number"
                type="tel"
                value={data.phoneNumber}
                onChange={(v) => set('phoneNumber', v)}
                autoComplete="tel"
            />
            <Field
                label="Date of birth"
                type="date"
                value={data.dob}
                onChange={handleDobChange}
                required
                max={today}
            />
            {ageError && (
                <div style={{ color: '#D32F2F', fontSize: '0.85rem' }}>{ageError}</div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '8px 0' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--subtext)' }}>Make my profile public</span>
                <Toggle checked={data.isPublic} onChange={(v) => set('isPublic', v)} />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button variant="ghost" onClick={onBack}>Back</Button>
                <Button type="submit" disabled={!canContinue || !!ageError}>Continue</Button>
            </div>
        </form>
    );
}

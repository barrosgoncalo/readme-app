import Field from '../../components/Field.jsx';
import Button from '../../components/Button.jsx';

export default function Step2Personal({ data, set, onNext, onBack }) {
    const canContinue = data.fullName && data.dob;

    // Calculamos a data de hoje no formato que o HTML espera (AAAA-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    function onSubmit(e) {
        e.preventDefault();
        if (canContinue) onNext();
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
                onChange={(v) => set('dob', v)}
                required
                max={today}
            />
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.9rem', color: 'var(--subtext)' }}>
                <input
                    type="checkbox"
                    checked={data.isPublic}
                    onChange={(e) => set('isPublic', e.target.checked)}
                />
                Make my profile public
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button variant="ghost" onClick={onBack}>Back</Button>
                <Button type="submit" disabled={!canContinue}>Continue</Button>
            </div>
        </form>
    );
}

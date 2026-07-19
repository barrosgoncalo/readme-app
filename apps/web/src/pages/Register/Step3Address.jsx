import Field from '../../components/Field.jsx';
import CountryField from '../../components/CountryField.jsx';
import Button from '../../components/Button.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';

export default function Step3Address({ data, set, onSubmit, onBack, submitting, error }) {
    const canSubmit = data.addressLine1 && data.city && data.country;

    function handleSubmit(e) {
        e.preventDefault();
        if (canSubmit) onSubmit();
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Field label="Address line 1" value={data.addressLine1} onChange={(v) => set('addressLine1', v)} required />
            <Field label="Address line 2" value={data.addressLine2} onChange={(v) => set('addressLine2', v)} />
            <Field label="City" value={data.city} onChange={(v) => set('city', v)} required />
            <Field label="District" value={data.district} onChange={(v) => set('district', v)} />
            <Field label="ZIP / postal code" value={data.zipCode} onChange={(v) => set('zipCode', v)} />
            <CountryField value={data.country} onChange={(v) => set('country', v)} />
            <ErrorAlert>{error}</ErrorAlert>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button variant="ghost" onClick={onBack} disabled={submitting}>Back</Button>
                <Button type="submit" disabled={!canSubmit || submitting}>
                    {submitting ? 'Creating account…' : 'Create account'}
                </Button>
            </div>
        </form>
    );
}
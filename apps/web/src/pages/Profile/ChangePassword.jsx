import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { doUpdateUserPassword } from '@readme/shared/src/services/auth';
import { WEB_ROUTES } from '../../constants/webRoutes';
import Button from '../../components/Button.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';
import styles from './ChangePassword.module.css';

export default function ChangePassword() {
    const navigate = useNavigate();
    const back = () => navigate(WEB_ROUTES.PROFILE_PRIVACY_SECURITY);

    const [form, setForm] = useState({ current: '', next: '', confirm: '' });
    const [show, setShow] = useState({ current: false, next: false, confirm: false });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    function set(field, value) {
        setForm(f => ({ ...f, [field]: value }));
        setError('');
        setSuccess(false);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        if (form.next !== form.confirm) { setError('New passwords do not match.'); return; }
        if (form.next.length < 6) { setError('New password must be at least 6 characters.'); return; }
        setSaving(true);
        try {
            await doUpdateUserPassword(form.current, form.next);
            setSuccess(true);
            setTimeout(back, 1200);
        } catch (err) {
            setError(err.message || 'Could not change password.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Change Password</h1>
            <p className={styles.subtitle}>Choose New Password</p>

            <img src="/ShieldWorm.png" alt="" className={styles.illustration} />

            <form className={styles.form} onSubmit={handleSubmit}>
                <PasswordField
                    label="Old Password"
                    value={form.current}
                    onChange={v => set('current', v)}
                    show={show.current}
                    onToggle={() => setShow(s => ({ ...s, current: !s.current }))}
                    autoComplete="current-password"
                />
                <PasswordField
                    label="New Password"
                    value={form.next}
                    onChange={v => set('next', v)}
                    show={show.next}
                    onToggle={() => setShow(s => ({ ...s, next: !s.next }))}
                    autoComplete="new-password"
                />
                <PasswordField
                    label="Confirm Password"
                    value={form.confirm}
                    onChange={v => set('confirm', v)}
                    show={show.confirm}
                    onToggle={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                    autoComplete="new-password"
                />

                <ErrorAlert>{error}</ErrorAlert>
                {success && <p className={styles.successMsg}>Password changed successfully!</p>}

                <div className={styles.actions}>
                    <Button variant="ghost" type="button" onClick={back} disabled={saving}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={!form.current || !form.next || !form.confirm || saving}>
                        {saving ? 'Saving…' : 'Change Password'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

function PasswordField({ label, value, onChange, show, onToggle, autoComplete }) {
    return (
        <div className={styles.fieldWrap}>
            <label className={styles.fieldLabel}>{label}</label>
            <div className={styles.inputRow}>
                <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    autoComplete={autoComplete}
                    className={styles.input}
                />
                <button type="button" className={styles.eyeBtn} onClick={onToggle} tabIndex={-1}>
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
        </div>
    );
}

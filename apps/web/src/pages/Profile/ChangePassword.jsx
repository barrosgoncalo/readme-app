import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { doUpdateUserPassword } from '@readme/shared/src/services/auth.web';
import { WEB_ROUTES } from '../../constants/webRoutes';
import Button from '../../components/Button.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';
import styles from './ChangePassword.module.css';

export default function ChangePassword() {
    const navigate = useNavigate();

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
        if (form.next !== form.confirm) {
            setError('New passwords do not match.');
            return;
        }
        if (form.next.length < 6) {
            setError('New password must be at least 6 characters.');
            return;
        }
        setSaving(true);
        try {
            await doUpdateUserPassword(form.current, form.next);
            setSuccess(true);
            setTimeout(() => navigate(WEB_ROUTES.PROFILE_EDIT), 1200);
        } catch (err) {
            setError(err.message || 'Could not change password.');
        } finally {
            setSaving(false);
        }
    }

    const canSubmit = form.current && form.next && form.confirm && !saving;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate(WEB_ROUTES.PROFILE_EDIT)}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className={styles.title}>Change Password</h1>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.card}>
                    <PasswordField
                        label="Current password"
                        value={form.current}
                        onChange={v => set('current', v)}
                        show={show.current}
                        onToggle={() => setShow(s => ({ ...s, current: !s.current }))}
                    />
                    <PasswordField
                        label="New password"
                        value={form.next}
                        onChange={v => set('next', v)}
                        show={show.next}
                        onToggle={() => setShow(s => ({ ...s, next: !s.next }))}
                    />
                    <PasswordField
                        label="Confirm new password"
                        value={form.confirm}
                        onChange={v => set('confirm', v)}
                        show={show.confirm}
                        onToggle={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                    />
                </div>

                <ErrorAlert>{error}</ErrorAlert>
                {success && <p className={styles.successMsg}>Password changed successfully!</p>}

                <div className={styles.actions}>
                    <Button variant="ghost" type="button" onClick={() => navigate(WEB_ROUTES.PROFILE_EDIT)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={!canSubmit}>
                        {saving ? 'Saving…' : 'Update password'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

function PasswordField({ label, value, onChange, show, onToggle }) {
    return (
        <div className={styles.fieldWrap}>
            <label className={styles.fieldLabel}>{label}</label>
            <div className={styles.inputRow}>
                <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    autoComplete="off"
                    className={styles.input}
                />
                <button type="button" className={styles.eyeBtn} onClick={onToggle} tabIndex={-1}>
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
        </div>
    );
}

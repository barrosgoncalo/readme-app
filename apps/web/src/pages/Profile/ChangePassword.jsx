import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { doUpdateUserPassword } from '@readme/shared/src/services/auth';
import {
    getPasswordDetails,
    hasMixedCase,
    hasNumbers,
    hasValidLength,
} from '@readme/shared/src/utils/registerUtils';
import { WEB_ROUTES } from '../../constants/webRoutes';
import Button from '../../components/Button.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';
import styles from './ChangePassword.module.css';
import ShieldWorm from '../../assets/ShieldWorm.png';

export default function ChangePassword() {
    const navigate = useNavigate();
    const location = useLocation();

    const backPath = location.state?.from || WEB_ROUTES.PROFILE_PRIVACY_SECURITY;

    const back = () => navigate(backPath, {
        state: {
            draftForm: location.state?.draftForm,
            draftPhoneCountry: location.state?.draftPhoneCountry
        }
    });

    const [form, setForm] = useState({ current: '', next: '', confirm: '' });
    const [show, setShow] = useState({ current: false, next: false, confirm: false });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const passwordInfo = getPasswordDetails(form.next);

    function set(field, value) {
        setForm(f => ({ ...f, [field]: value }));
        setError('');
        setSuccess(false);
    }

    const isValidPassword = (password) => {
        if (passwordInfo.level !== 'strong') {
            const missing = [];
            if (!hasValidLength(password)) {
                missing.push('At least 6 characters');
            }
            if (!hasNumbers(password)) {
                missing.push('At least one number');
            }
            if (!hasMixedCase(password)) {
                missing.push('uppercase and lowercase letters');
            }

            setError(`Your password needs: ${missing.join(', ')}`);
            return false;
        }
        return true;
    };

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        // Prevent using the same password
        if (form.current === form.next) {
            setError('New password cannot be the same as your old password.');
            return;
        }

        if (form.next !== form.confirm) {
            setError('New passwords do not match.');
            return;
        }

        if (!isValidPassword(form.next)) {
            return;
        }

        setSaving(true);
        try {
            await doUpdateUserPassword(form.current, form.next);
            setSuccess(true);
            setTimeout(back, 1200);
        } catch (err) {
            if (err.code === 'auth/invalid-credential') {
                setError('The old password you entered is incorrect.');
            } else if (err.code === 'auth/requires-recent-login') {
                setError('For security reasons, please log out and log back in before changing your password.');
            } else {
                setError(err.message || 'Could not change password.');
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Change Password</h1>
            <p className={styles.subtitle}>Choose New Password</p>

            <img src={ShieldWorm} alt="" className={styles.illustration} />

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
                    passwordInfo={passwordInfo}
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

function PasswordField({ label, value, onChange, show, onToggle, autoComplete, passwordInfo }) {
    // Dynamically apply border styles based on password strength if passwordInfo is provided
    const dynamicInputStyle = passwordInfo ? {
        borderBottomColor: passwordInfo.color,
        borderBottomWidth: passwordInfo.level === 'none' ? '1px' : '2.5px',
        borderBottomStyle: 'solid',
        transition: 'border-color 0.2s ease-in-out'
    } : {};

    return (
        <div className={styles.fieldWrap}>
            <label className={styles.fieldLabel}>{label}</label>
            <div className={styles.inputRow} style={dynamicInputStyle}>
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

            {/* Display strength label for the New Password field */}
            {passwordInfo?.label ? (
                <span className={styles.strengthText} style={{ color: passwordInfo.color }}>
                    {passwordInfo.label}
                </span>
            ) : null}
        </div>
    );
}
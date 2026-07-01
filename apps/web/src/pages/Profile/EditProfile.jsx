import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, ChevronRight, KeyRound } from 'lucide-react';
import { db } from '@readme/shared/src/services/firebase.web';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import { WEB_ROUTES } from '../../constants/webRoutes';
import { DEFAULT_COUNTRY, parseStoredPhone } from '../../components/PhoneField/countryCodes.js';
import PhoneField from '../../components/PhoneField/index.jsx';
import Field from '../../components/Field.jsx';
import Button from '../../components/Button.jsx';
import Spinner from '../../components/Spinner.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';
import styles from './EditProfile.module.css';

export default function EditProfile() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [phoneCountry, setPhoneCountry] = useState(DEFAULT_COUNTRY);
    const [form, setForm] = useState({
        fullName: '',
        dob: '',
        username: '',
        phoneNumber: '',
        country: '',
        city: '',
        district: '',
        addressLine1: '',
        addressLine2: '',
        postalCode: '',
    });

    useEffect(() => {
        if (!currentUser) return;
        getDoc(doc(db, 'users', currentUser.uid)).then(snap => {
            if (!snap.exists()) return;
            const d = snap.data();
            const addr = d.institutionalAddress || {};
            const { country, number } = parseStoredPhone(d.phoneNumber);
            setPhoneCountry(country);
            setForm({
                fullName: d.fullName || '',
                dob: d.dob || '',
                username: d.username || '',
                phoneNumber: number,
                country: addr.country || '',
                city: addr.city || '',
                district: addr.district || '',
                addressLine1: addr.addressLine1 || '',
                addressLine2: addr.addressLine2 || '',
                postalCode: addr.postalCode || '',
            });
        }).finally(() => setLoading(false));
    }, [currentUser]);

    function set(field, value) {
        setForm(f => ({ ...f, [field]: value }));
        setSuccess(false);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setSaving(true);
        try {
            const fullPhone = form.phoneNumber.trim()
                ? `${phoneCountry.dial} ${form.phoneNumber.trim()}`
                : '';
            await updateDoc(doc(db, 'users', currentUser.uid), {
                fullName: form.fullName.trim(),
                dob: form.dob,
                username: form.username.trim(),
                phoneNumber: fullPhone,
                institutionalAddress: {
                    country: form.country.trim(),
                    city: form.city.trim(),
                    district: form.district.trim(),
                    addressLine1: form.addressLine1.trim(),
                    addressLine2: form.addressLine2.trim() || null,
                    postalCode: form.postalCode.trim(),
                },
                updatedAt: new Date().toISOString(),
            });
            setSuccess(true);
            setTimeout(() => navigate(WEB_ROUTES.PROFILE), 800);
        } catch {
            setError('Could not save changes. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <Spinner center label="Loading profile" />;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate(WEB_ROUTES.PROFILE)}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className={styles.title}>Edit Profile</h1>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>

                <section className={styles.section}>
                    <p className={styles.sectionLabel}>Personal</p>
                    <div className={styles.card}>
                        <Field label="Full name" value={form.fullName} onChange={v => set('fullName', v)} required />
                        <Field label="Date of birth" type="date" value={form.dob} onChange={v => set('dob', v)} max={new Date().toISOString().split('T')[0]} />
                        <Field label="Username" value={form.username} onChange={v => set('username', v)} required />
                        <PhoneField
                            country={phoneCountry}
                            onCountryChange={c => { setPhoneCountry(c); setSuccess(false); }}
                            value={form.phoneNumber}
                            onChange={v => set('phoneNumber', v)}
                        />
                    </div>
                </section>

                <section className={styles.section}>
                    <p className={styles.sectionLabel}>Address</p>
                    <div className={styles.card}>
                        <Field label="Address line 1" value={form.addressLine1} onChange={v => set('addressLine1', v)} />
                        <Field label="Address line 2" value={form.addressLine2} onChange={v => set('addressLine2', v)} />
                        <div className={styles.row}>
                            <Field label="City" value={form.city} onChange={v => set('city', v)} />
                            <Field label="District" value={form.district} onChange={v => set('district', v)} />
                        </div>
                        <div className={styles.row}>
                            <Field label="Postal code" value={form.postalCode} onChange={v => set('postalCode', v)} />
                            <Field label="Country" value={form.country} onChange={v => set('country', v)} />
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <p className={styles.sectionLabel}>Security</p>
                    <div className={styles.navCard} onClick={() => navigate(WEB_ROUTES.PROFILE_CHANGE_PASSWORD, { state: { from: WEB_ROUTES.PROFILE_EDIT } })}>
                        <span className={styles.navLeft}>
                            <span className={styles.navIcon}><KeyRound size={18} /></span>
                            <span className={styles.navLabel}>Change password</span>
                        </span>
                        <ChevronRight size={18} className={styles.navChevron} />
                    </div>
                </section>

                <ErrorAlert>{error}</ErrorAlert>
                {success && <p className={styles.successMsg}>Saved!</p>}

                <div className={styles.actions}>
                    <Button variant="ghost" type="button" onClick={() => navigate(WEB_ROUTES.PROFILE)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Saving…' : 'Save changes'}
                    </Button>
                </div>

            </form>
        </div>
    );
}

import { useState } from 'react';
import { getAuth, updateProfile, signOut } from 'firebase/auth';
import { getApp } from 'firebase/app';
import styles from './SettingsPage.module.css';

function Section({ title, description, children }) {
    return (
        <div className={styles.section}>
            <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>{title}</h2>
                {description && <p className={styles.sectionDesc}>{description}</p>}
            </div>
            <div className={styles.card}>{children}</div>
        </div>
    );
}

function InfoRow({ label, value, mono }) {
    return (
        <div className={styles.infoRow}>
            <span className={styles.infoLabel}>{label}</span>
            <span className={`${styles.infoValue} ${mono ? styles.mono : ''}`}>{value || '—'}</span>
        </div>
    );
}

export default function AdminSettingsPage() {
    const auth = getAuth();
    const user = auth.currentUser;
    const app = getApp();

    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [signingOut, setSigningOut] = useState(false);

    const lastSignIn = user?.metadata?.lastSignInTime
        ? new Date(user.metadata.lastSignInTime).toLocaleString()
        : '—';

    const provider = user?.providerData?.[0]?.providerId === 'password'
        ? 'Email / Password'
        : user?.providerData?.[0]?.providerId || '—';

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSaved(false);
        setSaveError('');
        try {
            await updateProfile(user, { displayName: displayName.trim() });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setSaveError(err.message || 'Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    const handleSignOut = async () => {
        setSigningOut(true);
        try {
            await signOut(auth);
        } catch {
            setSigningOut(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.pageHead}>
                <h1 className={styles.pageTitle}>Settings</h1>
                <p className={styles.pageSubtitle}>Manage your admin account and platform configuration.</p>
            </div>

            <Section title="Admin Profile" description="Your Firebase Auth identity used to access this panel.">
                <form onSubmit={handleSaveProfile}>
                    <div className={styles.formField}>
                        <label className={styles.fieldLabel} htmlFor="displayName">Display Name</label>
                        <input
                            id="displayName"
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className={styles.input}
                            placeholder="Your name"
                        />
                    </div>

                    <InfoRow label="Email" value={user?.email} />
                    <InfoRow label="UID" value={user?.uid} mono />
                    <InfoRow label="Last sign-in" value={lastSignIn} />
                    <InfoRow label="Auth provider" value={provider} />

                    {saveError && <p className={styles.errorMsg}>{saveError}</p>}

                    <div className={styles.formFooter}>
                        {saved && <span className={styles.savedMsg}>Saved successfully.</span>}
                        <button
                            type="submit"
                            className={styles.saveBtn}
                            disabled={saving || !displayName.trim()}
                        >
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </Section>

            <Section title="Security" description="Session and access controls for this admin account.">
                <div className={styles.infoRow}>
                    <div>
                        <p className={styles.infoLabel}>Sign out</p>
                        <p className={styles.infoValueSecondary}>Ends your current session and returns you to the login page.</p>
                    </div>
                    <button
                        type="button"
                        className={styles.dangerBtn}
                        onClick={handleSignOut}
                        disabled={signingOut}
                    >
                        {signingOut ? 'Signing out…' : 'Sign Out'}
                    </button>
                </div>
            </Section>

            <Section title="Platform Info" description="Read-only configuration details for this Firebase project.">
                <InfoRow label="Firebase project" value={app.options.projectId} mono />
                <InfoRow label="Cloud Functions region" value="europe-west1" mono />
                <InfoRow label="Auth domain" value={app.options.authDomain} mono />
                <InfoRow label="Environment" value={import.meta.env.MODE} />
            </Section>
        </div>
    );
}

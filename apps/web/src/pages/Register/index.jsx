import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout.jsx';
import StepDots from './StepDots.jsx';
import Step1Credentials from './Step1Credentials.jsx';
import Step2Personal from './Step2Personal.jsx';
import Step3Address from './Step3Address.jsx';
import { doCreateUserWithEmailAndPassword, doSignInWithGoogle, completeGoogleSignUp } from '@readme/shared/src/services/auth';
import { WEB_ROUTES } from '../../constants/webRoutes';

const RegisterBg = '/login-bg.jpeg';

const initialData = {
    email: '', username: '', password: '', confirmPassword: '',
    fullName: '', phoneNumber: '', dob: '', isPublic: true,
    addressLine1: '', addressLine2: '', city: '', district: '', zipCode: '', country: '',
};

export default function Register() {
    const location = useLocation();
    const navigate = useNavigate();

    const [googleUser, setGoogleUser] = useState(location.state?.googleUser || null);
    const [step, setStep] = useState(googleUser ? 2 : 1);
    const [data, setData] = useState(
        googleUser ? { ...initialData, email: googleUser.email, fullName: googleUser.fullName } : initialData
    );
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [done, setDone] = useState(false);

    function set(key, value) {
        setData((d) => ({ ...d, [key]: value }));
    }

    // Triggered from Step1Credentials' "Continue with Google" button.
    async function onGoogleContinue() {
        setError(null);
        try {
            const { user, isNewUser } = await doSignInWithGoogle();
            if (!isNewUser) {
                // Account already exists — just send them into the app.
                navigate(WEB_ROUTES.BOOKS, { replace: true });
                return;
            }
            setGoogleUser({ uid: user.uid, email: user.email, fullName: user.displayName || '' });
            setData((d) => ({ ...d, email: user.email, fullName: user.displayName || '' }));
            setStep(2);
        } catch (err) {
            setError(err.message || 'Failed to authenticate with Google.');
        }
    }

    async function onSubmit() {
        setError(null);
        setSubmitting(true);
        try {
            if (googleUser) {
                await completeGoogleSignUp(googleUser.uid, googleUser.email, data);
            } else {
                await doCreateUserWithEmailAndPassword(data.email, data.password, data);
            }
            setDone(true);
        } catch (err) {
            setError(err.message || 'Could not create account.');
        } finally {
            setSubmitting(false);
        }
    }

    if (done) {
        return (
            <AuthLayout
                title={googleUser ? "You're all set" : 'Check your email'}
                subtitle={googleUser ? 'Your account is ready.' : 'We sent you a verification link. Click it, then sign in.'}
                bgImage={RegisterBg}
                footer={<Link to="/login">Back to sign in</Link>}
            >
                <></>
            </AuthLayout>
        );
    }

    const subtitleByStep = { 1: 'Create your account.', 2: 'A few details about you.', 3: 'Where are you based?' };

    return (
        <AuthLayout
            title="Sign up"
            subtitle={subtitleByStep[step]}
            bgImage={RegisterBg}
            footer={<span>Already have an account? <Link to="/login">Sign in</Link></span>}
        >
            <StepDots total={googleUser ? 2 : 3} current={googleUser ? step - 1 : step} />
            {step === 1 && !googleUser && (
                <Step1Credentials data={data} set={set} onNext={() => setStep(2)} error={error} onGoogle={onGoogleContinue} />
            )}
            {step === 2 && (
                <Step2Personal
                    data={data}
                    set={set}
                    onNext={() => setStep(3)}
                    onBack={googleUser ? undefined : () => setStep(1)}
                />
            )}
            {step === 3 && (
                <Step3Address
                    data={data}
                    set={set}
                    onSubmit={onSubmit}
                    onBack={() => setStep(2)}
                    submitting={submitting}
                    error={error}
                />
            )}
        </AuthLayout>
    );
}

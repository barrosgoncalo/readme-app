// 3-step register flow mirroring apps/mobile/.../RegisterScreen.
// State lives here; each step is a presentational component.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout.jsx';
import StepDots from './StepDots.jsx';
import Step1Credentials from './Step1Credentials.jsx';
import Step2Personal from './Step2Personal.jsx';
import Step3Address from './Step3Address.jsx';
import { doCreateUserWithEmailAndPassword } from '@readme/shared/src/services/auth';

const RegisterBg = '/login-bg.jpeg';

const initialData = {
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phoneNumber: '',
    dob: '',
    isPublic: true,
    addressLine1: '',
    addressLine2: '',
    city: '',
    district: '',
    zipCode: '',
    country: '',
};

export default function Register() {
    const [step, setStep] = useState(1);
    const [data, setData] = useState(initialData);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [done, setDone] = useState(false);
    const navigate = useNavigate();

    function set(key, value) {
        setData((d) => ({ ...d, [key]: value }));
    }

    async function onSubmit() {
        setError(null);
        setSubmitting(true);
        try {
            await doCreateUserWithEmailAndPassword(data.email, data.password, data);
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
                title="Check your email"
                subtitle="We sent you a verification link. Click it, then sign in."
                bgImage={RegisterBg}
                footer={<Link to="/login">Back to sign in</Link>}
            >
                <></>
            </AuthLayout>
        );
    }

    const subtitleByStep = {
        1: 'Create your account.',
        2: 'A few details about you.',
        3: 'Where are you based?',
    };

    return (
        <AuthLayout
            title="Sign up"
            subtitle={subtitleByStep[step]}
            bgImage={RegisterBg}
            footer={
                <span>
                    Already have an account? <Link to="/login">Sign in</Link>
                </span>
            }
        >
            <StepDots total={3} current={step} />
            {step === 1 && (
                <Step1Credentials data={data} set={set} onNext={() => setStep(2)} error={error} />
            )}
            {step === 2 && (
                <Step2Personal data={data} set={set} onNext={() => setStep(3)} onBack={() => setStep(1)} />
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
            <div style={{ textAlign: 'center', marginTop: 'var(--space-3)' }}>
                <button
                    type="button"
                    onClick={() => navigate('/login')}
                    style={{ background: 'transparent', color: 'var(--subtext)', fontSize: '0.85rem' }}
                >
                    Cancel
                </button>
            </div>
        </AuthLayout>
    );
}

import styles from './DownloadSection.module.css';

/**
 * PhoneMockup
 * The screen is intentionally left empty — pass your explore-page
 * screenshot in as `screenImage`, or pass custom JSX as `children`
 * and it'll render inside the screen area instead.
 */
function PhoneMockup({ screenImage, screenAlt = 'App preview', children }) {
    return (
        <div className={styles.phone}>
            <div className={styles.phoneScreen}>
                {children ? (
                    children
                ) : screenImage ? (
                    <img src={screenImage} alt={screenAlt} className={styles.phoneScreenImage} />
                ) : (
                    <div className={styles.phoneScreenPlaceholder}>
                        Drop your explore page photo here
                    </div>
                )}
            </div>
        </div>
    );
}

const OPTIONS = [
    {
        id: 'website',
        icon: 'globe',
        title: 'Continue on Website',
        description: 'Explore our collection, read stories, and connect with fellow book lovers.',
        cta: 'Continue',
        href: 'https://readme---bookworms.web.app/login/',
        download: false,
    },
    {
        id: 'app',
        icon: 'android',
        title: 'Download Our App',
        description: 'Get the full experience on the go. Download our Android app.',
        cta: 'Download APK',
        href: 'https://github.com/barrosgoncalo/readme-app/releases/latest/download/readme-app.apk',
        download: true,
    },
];

function OptionIcon({ type }) {
    if (type === 'globe') {
        return (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <path d="M12 3c2.5 2.7 3.8 6 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-6-3.8-9s1.3-6.3 3.8-9z" />
            </svg>
        );
    }
    return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
            {/* Antennae */}
            <line x1="6.8" y1="3.5" x2="8.6" y2="6.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <line x1="17.2" y1="3.5" x2="15.4" y2="6.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />

            {/* Head with transparent eye cutouts */}
            <path
                fillRule="evenodd"
                d="M 6 11 A 6 6 0 0 1 18 11 Z M 9.2 7.3 A 0.8 0.8 0 1 0 9.2 8.9 A 0.8 0.8 0 1 0 9.2 7.3 M 14.8 7.3 A 0.8 0.8 0 1 0 14.8 8.9 A 0.8 0.8 0 1 0 14.8 7.3"
            />

            {/* Torso */}
            <path d="M 6 11.8 H 18 V 16.2 C 18 17.2 17.2 18 16.2 18 H 7.8 C 6.8 18 6 17.2 6 16.2 Z" />

            {/* Arms */}
            <rect x="3.6" y="11.8" width="1.6" height="5.2" rx="0.8" />
            <rect x="18.8" y="11.8" width="1.6" height="5.2" rx="0.8" />

            {/* Legs */}
            <rect x="8.1" y="17.2" width="1.6" height="4.0" rx="0.8" />
            <rect x="14.3" y="17.2" width="1.6" height="4.0" rx="0.8" />
        </svg>
    );
}

function ShieldIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2 4 5v6c0 5 3.4 8.9 8 11 4.6-2.1 8-6 8-11V5l-8-3z" />
            <polyline points="9 12 11 14 15 9.5" />
        </svg>
    );
}

/**
 * DownloadCard
 * The "Take Your Library With You" panel: title, divider,
 * subtitle, and the two option rows (website / app).
 */
function DownloadCard() {
    return (
        <div className={styles.card}>
            <div className={styles.divider}>
                <span className={styles.line} />
                <span className={styles.diamond} />
                <span className={styles.line} />
            </div>

            <h2 className={styles.title}>
                Take Your Library<br />With You
            </h2>
            <p className={styles.subtitle}>
                Continue on the website or download our app to read, save, and discover
                your next favorite book.
            </p>

            <div className={styles.options}>
                {OPTIONS.map(option => (
                    <div className={styles.option} key={option.id}>
                        <span className={styles.optionIcon}>
                            <OptionIcon type={option.icon} />
                        </span>

                        <div className={styles.optionBody}>
                            <h3 className={styles.optionTitle}>{option.title}</h3>
                            <p className={styles.optionDescription}>{option.description}</p>
                        </div>

                        <a
                            href={option.href}
                            {...(option.download ? { download: true } : {})}
                            className={styles.optionButton}
                        >
                            {option.cta}
                        </a>
                    </div>
                ))}
            </div>

            <div className={styles.secureNote}>
                <ShieldIcon />
                <span>Secure, fast and easy to install.</span>
            </div>
        </div>
    );
}

export default function DownloadSection({ screenImage, screenAlt, children }) {
    return (
        <section className={styles.section}>
            <div className={styles.grid}>
                <PhoneMockup screenImage={screenImage} screenAlt={screenAlt}>
                    {children}
                </PhoneMockup>
                <DownloadCard />
            </div>
        </section>
    );
}

export { PhoneMockup, DownloadCard };

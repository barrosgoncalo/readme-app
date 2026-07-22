import React, { useEffect, useRef, useState, useCallback } from 'react';
import bgImage from '../assets/welcome-bg-variance.png';
import bernardoPhoto from '../assets/team/bernardo-lobao.png';
// import omarPhoto from '../assets/team/omar-hassan.jpg';
// import zaraPhoto from '../assets/team/zara-malik.jpg';
// import bilalPhoto from '../assets/team/bilal-ahmed.jpg';

const TOTAL_SECTIONS = 3;
const TRANSITION_DURATION = 900; 
const WHEEL_THRESHOLD = 15; 
const TOUCH_THRESHOLD = 50; 

// --- TEAM DATA ---
const TEAM = [
    {
        name: 'Bernardo Lobão',
        role: 'Founder & CEO',
        bio: 'Book lover and entrepreneur passionate about creating meaningful reader experiences.',
        photo: bernardoPhoto,
    },
    {
        name: 'Gonçalo Barros',
        role: 'Head of Operations',
        bio: 'Ensures smooth operations and helps our community grow every day.',
        // photo: omarPhoto,
    },
    {
        name: 'Francisco Campos',
        role: 'Curation Lead',
        bio: 'Curates quality books and brings stories that inspire our readers.',
        // photo: zaraPhoto,
    },
    {
        name: 'Manuel Anão',
        role: 'Tech Lead',
        bio: 'Builds and maintains the platform to deliver a seamless experience.',
        // photo: bilalPhoto,
    },
];

export default function Welcome() {
  const [currentSection, setCurrentSection] = useState(0);
  const isAnimating = useRef(false);
  const touchStartY = useRef(0);
  const containerRef = useRef(null);
  const timerRef = useRef(null); 

  const goToSection = useCallback((index) => {
    if (isAnimating.current) return;

    const target = Math.max(0, Math.min(index, TOTAL_SECTIONS - 1));
    if (target === currentSection) return;

    isAnimating.current = true;
    setCurrentSection(target);

    if (timerRef.current) window.clearTimeout(timerRef.current);
    
    timerRef.current = window.setTimeout(() => {
      isAnimating.current = false;
    }, TRANSITION_DURATION);
  }, [currentSection]);

  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault();
      if (isAnimating.current) return;
      if (Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;

      const direction = e.deltaY > 0 ? 1 : -1;
      goToSection(currentSection + direction);
    };

    const node = containerRef.current;
    node.addEventListener('wheel', handleWheel, { passive: false });
    return () => node.removeEventListener('wheel', handleWheel);
  }, [currentSection, goToSection]);

  useEffect(() => {
    const handleTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      if (isAnimating.current) return;
      const touchEndY = e.changedTouches[0].clientY;
      const delta = touchStartY.current - touchEndY;

      if (Math.abs(delta) > TOUCH_THRESHOLD) {
        const direction = delta > 0 ? 1 : -1;
        goToSection(currentSection + direction);
      }
    };

    const node = containerRef.current;
    node.addEventListener('touchstart', handleTouchStart, { passive: true });
    node.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      node.removeEventListener('touchstart', handleTouchStart);
      node.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentSection, goToSection]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isAnimating.current) return;
      if (['ArrowDown', 'PageDown'].includes(e.key)) {
        e.preventDefault();
        goToSection(currentSection + 1);
      } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        goToSection(currentSection - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSection, goToSection]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} style={containerStyle}>
      <style>{`
        /* --- HERO TEXT (SCREEN 1) --- */
        .hero-text-container {
          position: absolute;
          top: 8%;
          left: 8%;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          z-index: 5;
        }

        .hero-title {
          font-family: var(--heading, Georgia, serif);
          font-size: 75px;
          letter-spacing: 5px;
          text-transform: uppercase;
          font-weight: 20;
          margin: 0 0 24px 0;
          background: linear-gradient(160deg, #d6a462 0%, #5a381f 50%, #2b1c11 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-motto {
          font-family: 'Playfair Display', 'Bodoni MT', 'Didot', 'Times New Roman', serif;
          transform: scale(1.05, 1.15);
          transform-origin: left top; 
          font-size: 80px;
          font-weight: 500;
          line-height: 1.15; 
          letter-spacing: 2px; 
          margin: 0 0 60px 0; 
          background: linear-gradient(160deg, #e5b36a 0%, #7d5229 45%, #4e3422 90%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-divider-container {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          max-width: 320px; 
        }

        .hero-divider-line {
          flex: 1;
          height: 4px;
          background: #cda066;
        }

        .hero-divider-diamond {
          width: 20px;
          height: 20px;
          border: 3px solid #cda066;
          background: transparent;
          transform: rotate(45deg);
        }

        /* --- SUBTLE FROSTED GOLD DIAMOND INDICATOR --- */
        @keyframes diamondDipGold {
          0%, 100% {
            background: rgba(230, 200, 148, 0.15);
            transform: translateY(0) rotate(45deg) scale(1);
            box-shadow: 0 0 0 rgba(230, 200, 148, 0);
          }
          50% {
            background: rgba(230, 200, 148, 0.85);
            transform: translateY(8px) rotate(45deg) scale(1.05);
            box-shadow: 0 0 8px rgba(230, 200, 148, 0.4);
          }
        }
        
        .single-diamond-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 14px;
          filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.2));
        }

        .diamond-gold {
          width: 16px; 
          height: 16px; 
          border-radius: 1.8px; 
          background: rgba(230, 200, 148, 0.15);
          backdrop-filter: blur(4px); 
          border: 1px solid rgba(230, 200, 148, 0.5); 
          transform: rotate(45deg);
          animation: diamondDipGold 3s infinite ease-in-out;
        }

        .sections-track {
          transition: transform ${TRANSITION_DURATION}ms cubic-bezier(0.65, 0, 0.35, 1);
        }

        /* --- TEAM SECTION STYLES (SCREEN 2) --- */
        .team-section {
          background: #f7f4ee;
          border-radius: 40px;
          padding: 36px 32px 40px;
          width: 90%;
          max-width: none;
          margin: 0 auto;
          box-sizing: border-box;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 5;
        }

        .team-header {
          text-align: center;
          max-width: 260px;
          margin: 0 auto 28px;
        }

        .team-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 22px;
        }

        .team-line {
          width: 200px;
          height: 1px;
          background: linear-gradient(
            to right,
            rgba(201, 154, 75, 0),
            rgba(201, 154, 75, 1),
            rgba(201, 154, 75, 0)
          );
        }

        .team-diamond {
          width: 15px;
          height: 15px;
          background: transparent;
          border: 2px solid #c99a4b;
          transform: rotate(45deg);
          flex-shrink: 0;
          box-sizing: border-box;
        }

        .team-title {
          font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
          font-size: 2.6rem;
          font-weight: 500;
          color: #2e2115;
          margin: 0 0 8px;
        }

        .team-subtitle {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 0.92rem;
          line-height: 1.5;
          color: #6b6459;
          margin: 0;
        }

        .team-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .team-card {
          background: #fbfaf7;
          border-radius: 16px;
          padding: 24px 18px 26px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(46, 33, 21, 0.06);
        }

        .team-photoWrap {
          width: 96px;
          height: 96px;
          margin: 0 auto 14px;
          border-radius: 50%;
          overflow: hidden;
          background-color: #eaddcf; /* Fallback for missing images */
        }

        .team-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .team-name {
          font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
          font-size: 1.15rem;
          font-weight: 600;
          color: #2e2115;
          margin: 0 0 4px;
        }

        .team-role {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: #c9963c;
          margin: 0 0 10px;
        }

        .team-roleLine {
          display: block;
          width: 26px;
          height: 2px;
          background: #c99a4b;
          margin: 0 auto 12px;
          border-radius: 1px;
        }

        .team-bio {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 0.82rem;
          line-height: 1.45;
          color: #6b6459;
          margin: 0;
        }

        /* Responsive Media Queries */
        @media (max-width: 960px) {
          .team-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 560px) {
          .team-section {
            padding: 24px 18px 26px;
          }
          .team-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }
          .team-title {
            font-size: 1.6rem;
          }
        }

        /* --- THIRD SCREEN UI --- */
        .action-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          width: 90%;
          max-width: 440px;
          padding: 48px 32px;
          border-radius: 20px;
          background: #ffffff;
          border: 1px solid rgba(90, 67, 41, 0.12);
          box-shadow: 0 16px 36px rgba(90, 67, 41, 0.08);
        }

        .brand-subtitle {
          font-family: var(--heading, Georgia, serif);
          font-size: 13px;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: #5a4329;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .brand-title {
          font-family: var(--heading, Georgia, serif);
          font-size: 32px;
          color: #5a4329;
          font-weight: 700;
          line-height: 1.25;
          margin: 0 0 16px 0;
        }

        .action-divider-container {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          max-width: 180px;
          margin-bottom: 32px;
        }

        .action-divider-line {
          flex: 1;
          height: 1px;
          background: #cda066;
        }

        .action-divider-diamond {
          width: 7px;
          height: 7px;
          background: #cda066;
          transform: rotate(45deg);
        }

        .btn-group {
          display: flex;
          flex-direction: column;
          gap: 14px;
          width: 100%;
        }

        .btn-primary {
          width: 100%;
          padding: 16px 24px;
          background-color: #5a4329;
          color: #fcfaf7;
          border: none;
          border-radius: 8px;
          font-family: var(--heading, Georgia, serif);
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(90, 67, 41, 0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          text-decoration: none;
          box-sizing: border-box;
        }

        .btn-primary:hover {
          background-color: #42301c;
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(90, 67, 41, 0.32);
        }

        .btn-secondary {
          width: 100%;
          padding: 15px 24px;
          background-color: transparent;
          color: #5a4329;
          border: 2px solid #5a4329;
          border-radius: 8px;
          font-family: var(--heading, Georgia, serif);
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          text-decoration: none;
          box-sizing: border-box;
        }

        .btn-secondary:hover {
          background-color: rgba(90, 67, 41, 0.08);
          transform: translateY(-2px);
        }
      `}</style>

      <div
        className="sections-track"
        style={{
          width: '100%',
          height: `${TOTAL_SECTIONS * 100}vh`,
          transform: `translateY(-${currentSection * 100}vh)`,
        }}
      >
        {/* --- 200VH TRACK FOR THE 2-PAGE ARTWORK (SCREENS 1 & 2) --- */}
        <div style={artworkTrackStyle}>
          
          {/* SCREEN 1 */}
          <section style={screenStyle}>
            
            <div className="hero-text-container">
              <h1 className="hero-title">README</h1>
              <h2 className="hero-motto">
                Read.<br />
                Connect.<br />
                Trade.
              </h2>
              <div className="hero-divider-container">
                <div className="hero-divider-line"></div>
                <div className="hero-divider-diamond"></div>
                <div className="hero-divider-line"></div>
              </div>
            </div>

            <div style={indicatorWrapperStyle} onClick={() => goToSection(1)}>
              <div className="single-diamond-wrapper">
                <div className="diamond-gold"></div>
              </div>
            </div>
          </section>

          {/* SCREEN 2 (Now containing the Team Section) */}
          <section style={screenStyle}>
            
            {/* The imported Team Section */}
            <div className="team-section">
              <div className="team-header">
                <div className="team-divider">
                  <span className="team-line" />
                  <span className="team-diamond" />
                  <span className="team-line" />
                </div>
                <h2 className="team-title">Our Team</h2>
                <p className="team-subtitle">
                  A passionate group of book lovers building a trusted space for readers and collectors.
                </p>
              </div>

              <div className="team-grid">
                {TEAM.map(member => (
                  <div className="team-card" key={member.name}>
                    <div className="team-photoWrap">
                      {member.photo && <img src={member.photo} alt={member.name} className="team-photo" />}
                    </div>
                    <h3 className="team-name">{member.name}</h3>
                    <p className="team-role">{member.role}</p>
                    <span className="team-roleLine" />
                    <p className="team-bio">{member.bio}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={indicatorWrapperStyle} onClick={() => goToSection(2)}>
              <div className="single-diamond-wrapper">
                <div className="diamond-gold"></div>
              </div>
            </div>
          </section>

        </div>

        {/* --- SCREEN 3: COMPLETE CUT TO CLEAN LIGHT BACKGROUND --- */}
        <section style={screen3Style}>
          <div className="action-card">
            <span className="brand-subtitle">README</span>
            <h2 className="brand-title">Continue Your Journey</h2>
            
            <div className="action-divider-container">
              <div className="action-divider-line"></div>
              <div className="action-divider-diamond"></div>
              <div className="action-divider-line"></div>
            </div>

            <div className="btn-group">
              <a href="https://yourwebsite.com" className="btn-primary">
                <span>Continue to Website</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </a>

              <a href="/app-release.apk" download className="btn-secondary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.523 15.3414C17.062 15.3414 16.688 14.9674 16.688 14.5064C16.688 14.0454 17.062 13.6714 17.523 13.6714C17.984 13.6714 18.358 14.0454 18.358 14.5064C18.358 14.9674 17.984 15.3414 17.523 15.3414ZM6.477 15.3414C6.016 15.3414 5.642 14.9674 5.642 14.5064C5.642 14.0454 6.016 13.6714 6.477 13.6714C6.938 13.6714 7.312 14.0454 7.312 14.5064C7.312 14.9674 6.938 15.3414 6.477 15.3414ZM17.957 10.3644L19.78 7.20641C19.92 6.96341 19.838 6.65441 19.595 6.51441C19.352 6.37441 19.043 6.45641 18.903 6.69941L17.043 9.92141C15.539 9.23641 13.822 8.84141 12 8.84141C10.178 8.84141 8.461 9.23641 6.957 9.92141L5.097 6.69941C4.957 6.45641 4.648 6.37441 4.405 6.51441C4.162 6.65441 4.08 6.96341 4.22 7.20641L6.043 10.3644C2.658 12.2114 0.358 15.6564 0 19.7214H24C23.642 15.6564 21.342 12.2114 17.957 10.3644Z"/>
                </svg>
                <span>Download Android APK</span>
              </a>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

// --- Inline Styles ---
const containerStyle = {
  width: '100%',
  height: '100vh',
  overflow: 'hidden', 
  position: 'relative',
};

// Locks the 2-page artwork strictly to 200vh (Screens 1 and 2)
const artworkTrackStyle = {
  width: '100%',
  height: '200vh', 
  backgroundImage: `url(${bgImage})`,
  backgroundSize: 'cover',       
  backgroundPosition: 'top center',
  backgroundRepeat: 'no-repeat',
};

const screenStyle = {
  height: '100vh',
  width: '100%',
  position: 'relative',
};

// Screen 3: Complete cut off the image into a clean off-white screen
const screen3Style = {
  height: '100vh',
  width: '100%',
  backgroundColor: '#fcfaf7', 
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
};

const indicatorWrapperStyle = {
  position: 'absolute',
  bottom: '40px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 10,
  cursor: 'pointer',
};

import React, { useEffect, useRef, useState, useCallback } from 'react';
import TeamSection from '../components/TeamSection.jsx';
import bgBackImage from '../assets/welcome-bg-back-layer.png';
import bgFrontImage from '../assets/welcome-bg-front-layer.png';

const TOTAL_SECTIONS = 3;
const TRANSITION_DURATION = 900;
const WHEEL_THRESHOLD = 15;
const TOUCH_THRESHOLD = 50;

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
    if (node) node.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      if (node) node.removeEventListener('wheel', handleWheel);
    };
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
    if (node) {
      node.addEventListener('touchstart', handleTouchStart, { passive: true });
      node.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
    return () => {
      if (node) {
        node.removeEventListener('touchstart', handleTouchStart);
        node.removeEventListener('touchend', handleTouchEnd);
      }
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
        /* --- LAYERED BACKGROUNDS --- */
        .bg-layer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 200dvh;
          background-repeat: no-repeat;
          pointer-events: none;
          /* Forces the image to be exactly 1 screen wide and 2 screens tall */
          background-size: 100vw 200dvh; 
          background-position: center top;
        }

        .bg-layer-back {
          z-index: 1;
        }

        .bg-layer-front {
          z-index: 10;
        }

        /* --- HERO TEXT (SCREEN 1) --- */
        .hero-text-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          z-index: 5;
          width: min(90%, 800px);
        }

        .hero-title {
          font-family: var(--heading, Georgia, serif);
          font-size: clamp(2rem, 5vw, 4.5rem);
          letter-spacing: clamp(2px, 0.4vw, 5px);
          text-transform: uppercase;
          font-weight: 200;
          margin: 0 0 clamp(0.5rem, 1.5vh, 1rem) 0;
          background: linear-gradient(160deg, #d6a462 0%, #5a381f 50%, #2b1c11 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-motto {
          font-family: 'Playfair Display', 'Bodoni MT', 'Didot', 'Times New Roman', serif;
          font-size: clamp(2.2rem, 6.5vw, 5rem);
          font-weight: 500;
          line-height: 1.15;
          letter-spacing: clamp(1px, 0.2vw, 2px);
          margin: 0 0 clamp(1rem, 3vh, 2rem) 0;
          background: linear-gradient(160deg, #e5b36a 0%, #7d5229 45%, #4e3422 90%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-divider-container {
          display: flex;
          align-items: center;
          gap: clamp(8px, 1.5vw, 14px);
          width: 100%;
          max-width: clamp(180px, 40vw, 320px);
        }

        .hero-divider-line {
          flex: 1;
          height: clamp(2px, 0.3vh, 4px);
          background: #cda066;
        }

        .hero-divider-diamond {
          width: clamp(12px, 2vw, 20px);
          height: clamp(12px, 2vw, 20px);
          border: clamp(2px, 0.3vw, 3px) solid #cda066;
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
            transform: translateY(-0.75rem) rotate(45deg) scale(1.1);
            box-shadow: 0 0 12px rgba(230, 200, 148, 0.6);
          }
        }

        .single-diamond-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: clamp(8px, 1.5vh, 14px);
          filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.2));
        }

        .diamond-gold {
          width: clamp(12px, 1.8vw, 16px);
          height: clamp(12px, 1.8vw, 16px);
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

        /* --- TEAM SECTION OVERRIDE --- */
        .team-wrapper-override {
     z-index: 5;
          width: 100%;
          max-width: 1200px;
          display: flex;
          justify-content: center;
          align-items: center;
          box-sizing: border-box;
          /* Removes bottom padding push so it stays elevated */
          padding-bottom: 0; 
        }

        .team-wrapper-override .team-card,
        .team-wrapper-override [class*="card"] {
          box-shadow: none !important;
        }

        /* --- THIRD SCREEN UI --- */
        .action-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          width: min(90%, 440px);
          padding: clamp(1.5rem, 4vh, 3rem) clamp(1.25rem, 4vw, 2rem);
          border-radius: clamp(12px, 2vw, 20px);
          background: #ffffff;
          border: 1px solid rgba(90, 67, 41, 0.12);
          box-shadow: 0 8px 24px rgba(58, 42, 22, 0.08);
          box-sizing: border-box;
        }

        .brand-subtitle {
          font-family: var(--heading, Georgia, serif);
          font-size: clamp(11px, 1.2vw, 13px);
          letter-spacing: clamp(2px, 0.3vw, 4px);
          text-transform: uppercase;
          color: #5a4329;
          font-weight: 600;
          margin-bottom: clamp(4px, 1vh, 8px);
        }

        .brand-title {
          font-family: var(--heading, Georgia, serif);
          font-size: clamp(1.3rem, 3vw, 2rem);
          color: #5a4329;
          font-weight: 700;
          line-height: 1.25;
          margin: 0 0 clamp(0.75rem, 2vh, 1rem) 0;
        }

        .action-divider-container {
          display: flex;
          align-items: center;
          gap: clamp(8px, 1vw, 12px);
          width: 100%;
          max-width: clamp(120px, 30vw, 180px);
          margin-bottom: clamp(1.25rem, 3.5vh, 2rem);
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
          gap: clamp(10px, 1.5vh, 14px);
          width: 100%;
        }

        .btn-primary {
          width: 100%;
          padding: clamp(12px, 2vh, 16px) clamp(16px, 3vw, 24px);
          background-color: #5a4329;
          color: #fcfaf7;
          border: none;
          border-radius: 8px;
          font-family: var(--heading, Georgia, serif);
          font-size: clamp(13px, 1.5vw, 15px);
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
          padding: clamp(11px, 1.8vh, 15px) clamp(16px, 3vw, 24px);
          background-color: transparent;
          color: #5a4329;
          border: 2px solid #5a4329;
          border-radius: 8px;
          font-family: var(--heading, Georgia, serif);
          font-size: clamp(13px, 1.5vw, 15px);
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
          height: `${TOTAL_SECTIONS * 100}dvh`,
          transform: `translateY(-${currentSection * 100}dvh)`,
        }}
      >
        {/* --- 200DVH TRACK FOR THE 2-PAGE ARTWORK (SCREENS 1 & 2) --- */}
        <div style={artworkTrackStyle}>

          {/* 1. BACK LAYER */}
          <div
            className="bg-layer bg-layer-back"
            style={{ backgroundImage: `url(${bgBackImage})` }}
          />

          {/* SCREEN 1 CONTENT */}
          <section style={screen1Style}>
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

          {/* SCREEN 2 CONTENT */}
          <section style={screen2Style}>
            <div className="team-wrapper-override">
              <TeamSection />
            </div>

            <div style={indicatorWrapperStyle} onClick={() => goToSection(2)}>
              <div className="single-diamond-wrapper">
                <div className="diamond-gold"></div>
              </div>
            </div>
          </section>

          {/* 2. FRONT LAYER */}
          <div
            className="bg-layer bg-layer-front"
            style={{ backgroundImage: `url(${bgFrontImage})` }}
          />

        </div>

        {/* --- SCREEN 3: CLEAN LIGHT BACKGROUND --- */}
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

// --- INLINE STYLES ---
const containerStyle = {
  width: '100%',
  height: '100dvh',
  overflow: 'hidden',
  position: 'relative',
};

const artworkTrackStyle = {
  width: '100%',
  height: '200dvh',
  position: 'relative',
};

const baseScreenStyle = {
  height: '100dvh',
  width: '100%',
  position: 'relative',
  overflow: 'hidden',
  boxSizing: 'border-box',
};

const screen1Style = {
  ...baseScreenStyle,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start', // Changed from 'center' to top-align
  paddingTop: 'clamp(3rem, 10vh, 8rem)', // Controls how high up content sits dynamically
  paddingLeft: 'clamp(5%, 8vw, 12%)',
  paddingRight: 'clamp(5%, 8vw, 12%)',
};

const screen2Style = {
  ...baseScreenStyle,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start', // Changed from 'center' to top-align
  alignItems: 'center',
  paddingTop: 'clamp(2rem, 6vh, 5rem)', // Pulls the team section closer to the top
  paddingLeft: 'clamp(1rem, 4vw, 3rem)',
  paddingRight: 'clamp(1rem, 4vw, 3rem)',
};

const screen3Style = {
  ...baseScreenStyle,
  backgroundColor: '#fcfaf7',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 20,
};

const indicatorWrapperStyle = {
  position: 'absolute',
  bottom: 'clamp(12px, 3vh, 28px)',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 15,
  cursor: 'pointer',
};

import React, { useEffect, useRef, useState, useCallback } from 'react';
import bgImage from '../assets/welcome-bg.png';

const TOTAL_SECTIONS = 2;
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
        /* Frosted Light Gold Single Diamond - Subtle */
        @keyframes diamondDipGold {
          0%, 100% {
            background: rgba(230, 200, 148, 0.15); /* Softer translucent resting state */
            transform: translateY(0) rotate(45deg) scale(1);
            box-shadow: 0 0 0 rgba(230, 200, 148, 0);
          }
          50% {
            background: rgba(230, 200, 148, 0.85); /* Almost solid, but retains a hint of softness */
            /* Shorter dip, barely noticeable scale up for a breathing effect */
            transform: translateY(8px) rotate(45deg) scale(1.05);
            /* Softer, tighter glow */
            box-shadow: 0 0 8px rgba(230, 200, 148, 0.4);
          }
        }
        
        .single-diamond-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 14px;
          /* Softened the dark drop-shadow slightly */
          filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.2));
        }

        .diamond-gold {
          width: 18px; 
          height: 18px; 
          border-radius: 1.6px; 
          background: rgba(230, 200, 148, 0.15);
          backdrop-filter: blur(4px); 
          border: 1px solid rgba(230, 200, 148, 0.5); /* Slightly softer outer rim */
          transform: rotate(45deg);
          /* Extended the duration to 3s for a more relaxed, ambient pace */
          animation: diamondDipGold 3s infinite ease-in-out;
        }

        .sections-track {
          transition: transform ${TRANSITION_DURATION}ms cubic-bezier(0.65, 0, 0.35, 1);
        }
      `}</style>

      <div
        className="sections-track"
        style={{
          ...trackStyle,
          transform: `translateY(-${currentSection * 100}vh)`,
        }}
      >
        {/* --- FIRST SCREEN --- */}
        <section style={screenStyle}>
          
          {/* Frosted Light Gold Single Diamond Indicator */}
          <div style={indicatorWrapperStyle} onClick={() => goToSection(1)}>
            <div className="single-diamond-wrapper">
              <div className="diamond-gold"></div>
            </div>
          </div>

        </section>{/* --- FIRST SCREEN --- */}
        <section style={screenStyle}>
          
          {/* Frosted Light Gold Single Diamond Indicator */}
          <div style={indicatorWrapperStyle} onClick={() => goToSection(1)}>
            <div className="single-diamond-wrapper">
              <div className="diamond-gold"></div>
            </div>
          </div>

        </section>

        {/* --- SECOND SCREEN --- */}
        <section style={screenStyle}>
          {/* Your Screen 2 buttons go here */}
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

const trackStyle = {
  width: '100%',
  height: `${TOTAL_SECTIONS * 100}vh`, 
  backgroundImage: `url(${bgImage})`,
  backgroundSize: 'cover',       
  backgroundPosition: 'top center',
  backgroundRepeat: 'no-repeat',
};

const screenStyle = {
  height: '100vh',
  width: '100%',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
};

const indicatorWrapperStyle = {
  position: 'absolute',
  bottom: '35px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 10,
  cursor: 'pointer',
};

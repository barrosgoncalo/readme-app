import React, { useEffect, useRef, useState, useCallback } from 'react';
import TeamSection from '../components/TeamSection.jsx';
import DownloadSection from '../components/DownloadSection.jsx';
import bgBackImage from '../assets/welcome-bg-back-layer.png';
import bgFrontImage from '../assets/welcome-bg-front-layer.png';
import explorePhoto from '../assets/explore-preview.png';

import reactLogo from '../assets/logos/React-logo.png';
import expoLogo from '../assets/logos/Expo-logo.png';
import firebaseLogo from '../assets/logos/Firebase-logo.png';
import algoliaLogo from '../assets/logos/Algolia-logo.png';
import gbooksLogo from '../assets/logos/Google-Books-logo.png';
import gmapsLogo from '../assets/logos/Google-Maps-logo.png';
import osmLogo from '../assets/logos/OpenStreetMap-logo.png';
import openLogo from '../assets/logos/Open-Library-logo.png';

const TOTAL_SECTIONS = 3;
const TRANSITION_DURATION = 900;
const WHEEL_THRESHOLD = 15;
const TOUCH_THRESHOLD = 50;

export default function Welcome() {
    const [currentSection, setCurrentSection] = useState(0);
    const [bgSize, setBgSize] = useState(null);
    const [bgScale, setBgScale] = useState(1);
    const isAnimating = useRef(false);
    const touchStartY = useRef(0);
    const containerRef = useRef(null);
    const timerRef = useRef(null);
    const refImgDims = useRef(null);

    const BASE_VW = 1512;
    const BASE_VH_x2 = 1800;

    const recomputeBgSize = useCallback(() => {
        if (!refImgDims.current) return;
        const { w: imgW, h: imgH } = refImgDims.current;
        const vw = window.innerWidth;
        const vh = (window.visualViewport?.height || window.innerHeight) * 2;
        const scale = Math.max(vw / imgW, vh / imgH);
        const baseScale = Math.max(BASE_VW / imgW, BASE_VH_x2 / imgH);
        const normalized = scale / baseScale;

        setBgSize({
            width: Math.ceil(imgW * scale),
            height: Math.ceil(imgH * scale),
        });

        // Clamped scale to keep team section balanced
        setBgScale(Math.min(1.25, Math.max(0.7, normalized)));
    }, []);

    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            refImgDims.current = { w: img.naturalWidth, h: img.naturalHeight };
            recomputeBgSize();
        };
        img.src = bgBackImage;

        let resizeTimer;
        const handleResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(recomputeBgSize, 100);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(resizeTimer);
        };
    }, [recomputeBgSize]);

    // Array com a lista de tecnologias para a barra
    const techStack = [
        { src: reactLogo, name: 'React Native' },
        { src: expoLogo, name: 'Expo' },
        { src: firebaseLogo, name: 'Firebase' },
        { src: algoliaLogo, name: 'Algolia' },
        { src: gbooksLogo, name: 'Google Books' },
        { src: gmapsLogo, name: 'Google Maps' },
        { src: osmLogo, name: 'OpenStreetMap' },
        { src: openLogo, name: 'Open Library' },
    ];

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

            // 1. Capture the raw scroll value
            let normalizedDelta = e.deltaY;

            // 2. Adjust for Windows mice scrolling by lines or pages
            if (e.deltaMode === 1) {
                // DOM_DELTA_LINE: Multiply by a reasonable pixel height per line
                normalizedDelta *= 25;
            } else if (e.deltaMode === 2) {
                // DOM_DELTA_PAGE: Multiply by a larger pixel height
                normalizedDelta *= 100;
            }

            // 3. Now check against the threshold safely
            if (Math.abs(normalizedDelta) < WHEEL_THRESHOLD) return;

            // 4. Determine direction and transition
            const direction = normalizedDelta > 0 ? 1 : -1;
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
        <div ref={containerRef} style={{ ...containerStyle, '--bg-scale': bgScale }}>
            <style>{`
            /* --- LAYERED BACKGROUNDS --- */
            .bg-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 200dvh;
            background-size: cover;
            background-position: center top;
            background-repeat: no-repeat;
            pointer-events: none;
            }

            .bg-layer-back {
            z-index: 1;
            }

            /* Front layer overlay control */
            .bg-layer-front {
            z-index: 8; /* Positioned just around screen 2 elements */
            background-position: center top;
            }

            /* Prevents front overlay from exploding inwards on wide screens (Macs - 16:10) */
            @media (min-aspect-ratio: 16/10) {
                .bg-layer-front {
                    background-position: center 10%; 
                }
            }

            /* --- WINDOWS / 16:9 ASPECT RATIO FIX --- */
            @media (min-aspect-ratio: 16/9) {
                .bg-layer-back,
                .bg-layer-front {
                    /* 
                       Increasing this percentage pulls the BOTTOM shelf UP.
                       Try 30%, 35%, or 40% if you need it even higher.
                    */
                    background-position: center 25% !important; 
                }

                .team-wrapper-override {
                    /* Pulls the team section up noticeably */
                    transform: translateY(-10vh) scale(var(--bg-scale, 1));
                }
            }

            /* --- HERO TEXT (SCREEN 1) --- */
            .hero-text-container {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            z-index: 10;
            width: min(90%, 800px);
            }

            .hero-title {
            font-family: var(--heading, Georgia, serif);
            font-size: clamp(2rem, calc(3.2rem * var(--bg-scale, 1)), 4.5rem);
            letter-spacing: clamp(2px, calc(3px * var(--bg-scale, 1)), 5px);
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
            font-size: clamp(2.2rem, calc(4rem * var(--bg-scale, 1)), 5rem);
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
            z-index: 7; /* Sits naturally with front layer overlay */
            width: 100%;
            max-width: min(1200px, 92vw);
            display: flex;
            justify-content: center;
            align-items: center;
            box-sizing: border-box;
            padding-bottom: 0; 
            transform: scale(var(--bg-scale, 1));
            transform-origin: top center;
            position: relative;
            }

            /* Ensures inner team card content stays above front foliage */
            .team-wrapper-override p,
            .team-wrapper-override h2,
            .team-wrapper-override h3,
            .team-wrapper-override img,
            .team-wrapper-override button,
            .team-wrapper-override a {
            position: relative;
            z-index: 9; 
            }

            .team-wrapper-override .team-card,
            .team-wrapper-override [class*="card"] {
            box-shadow: none !important;
            }
            }

            /* --- TECH STACK BAR (ICONS + LABELS) --- */
            .tech-stack-container {
              z-index: 5;
              margin-top: auto;
              margin-bottom: clamp(4rem, 10vh, 6rem);
              width: 100vw;
              position: relative;
              left: 50%;
              transform: translateX(-50%);
              background: rgba(230, 200, 148, 0.12);
              border-top: 1px solid rgba(205, 160, 102, 0.2);
              border-bottom: 1px solid rgba(205, 160, 102, 0.2);
              padding: clamp(1.5rem, 3.5vh, 2.5rem) 0;
              display: flex;
              justify-content: center;
              align-items: center;
              gap: clamp(1rem, 3vw, 4rem);
              flex-wrap: wrap;
            }

        .tech-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          transition: all 0.3s ease;
          cursor: default;
        }

        .tech-item:hover {
          transform: translateY(-4px);
        }

        .tech-stack-logo {
          height: clamp(28px, 4vh, 45px);
          width: auto;
          object-fit: contain;
          opacity: 0.65;
          mix-blend-mode: multiply; /* Remove o fundo branco do JPG */
          transition: opacity 0.3s ease;
          user-select: none;
        }

        .tech-item:hover .tech-stack-logo {
          opacity: 1;
        }

        .tech-label {
          font-family: var(--heading, Georgia, serif);
          font-size: clamp(0.65rem, 1vw, 0.8rem);
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #7d5229;
          opacity: 0.8;
          transition: all 0.3s ease;
        }

        .tech-item:hover .tech-label {
          opacity: 1;
          color: #4e3422;
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
                        style={{
                            backgroundImage: `url(${bgBackImage})`,
                            backgroundSize: bgSize ? `${bgSize.width}px ${bgSize.height}px` : 'cover',
                        }}
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

                    {/* --- TECH STACK BAR (ICONS + TEXT) --- */}
                    <div className="tech-stack-container">
                      {techStack.map((tech, index) => (
                          <div key={index} className="tech-item">
                            <img src={tech.src} alt={tech.name} className="tech-stack-logo" />
                            <span className="tech-label">{tech.name}</span>
                          </div>
                      ))}
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
                        style={{
                            backgroundImage: `url(${bgFrontImage})`,
                            backgroundSize: bgSize ? `${bgSize.width}px ${bgSize.height}px` : 'cover',
                        }}
                    />

                </div>

                {/* --- SCREEN 3: CLEAN LIGHT BACKGROUND --- */}
                <section style={screen3Style}>
                    <DownloadSection
                        screenImage={explorePhoto}
                        screenAlt="App explore page preview"
                    />
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
    justifyContent: 'flex-start',
    paddingTop: 'clamp(3rem, 10vh, 8rem)',
    paddingLeft: 'clamp(5%, 8vw, 12%)',
    paddingRight: 'clamp(5%, 8vw, 12%)',
};

const screen2Style = {
    ...baseScreenStyle,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 'clamp(3rem, 8vh, 6rem)',
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

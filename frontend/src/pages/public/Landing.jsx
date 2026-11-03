/**
 * Landing.jsx — Scroll-scrubbed video landing page for SmartCart AI.
 *
 * How it works:
 *  • The page is 560vh tall (.sc-track). Every visible element is position:fixed.
 *  • Scrolling scrubs a fixed full-screen video frame by frame and cross-fades
 *    three text panels over it. Nothing visible actually scrolls.
 *  • Video must be ALL-INTRA encoded (every frame a keyframe) for instant seeks:
 *      ffmpeg -c:v libx264 -x264-params keyint=1 -crf 23 -an out.mp4
 *  • Place the file at frontend/public/shopcart-explode.mp4.
 *    A CDN stock video auto-fallback is used if the file is absent.
 */

import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

// Sourced from a custom 3D render: 1920x1080, 10s, 24fps, 240 frames,
// re-encoded ALL-INTRA so scroll scrub can land on an exact frame instantly.
// Host this file in frontend/public/ and update the path below if needed.
const VIDEO_URL = '/shopcart-explode.mp4';
const FALLBACK_URL = 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smartphone-while-shopping-online-42950-large.mp4';

// Cue table: [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd] in 0..1 scroll progress.
// Dead zones between panels (e.g. 0.12->0.18) are intentional — video-only breathing room.
// Panel 3 fadeOutEnd > 1 means it holds fully visible through the end of the page.
const CUES = [
  [0.00, 0.00, 0.06, 0.12], // Panel 1 — immediately visible at scroll=0, fades out as user scrolls
  [0.18, 0.28, 0.44, 0.52], // Panel 2 — under the hood
  [0.64, 0.74, 1.10, 1.20], // Panel 3 — CTA (holds to end)
];

const DRIFT = 22;

const PANELS_DATA = [
  {
    eyebrow: 'AI shopping assistant · Live on every session',
    h1: 'Shop smarter.<br />Decide faster.',
    sub: 'SmartCart AI reads browsing behavior in real time and surfaces the one product a customer is actually about to buy.',
    ctaLabel: 'See it in action',
    ctaTo: '/products',
  },
  {
    eyebrow: 'Under the hood',
    h1: 'Built on real data,<br />not guesswork.',
    sub: 'Purchase probability, churn risk, and engagement scores — trained on real behavior, refreshed on every visit.',
    ctaLabel: 'Explore dashboard',
    ctaTo: '/login',
  },
  {
    eyebrow: 'Get started',
    h1: 'Ready when<br />you are.',
    sub: 'Plug SmartCart AI into your storefront in an afternoon. Demo accounts included — no data science team required.',
    ctaLabel: 'Start free',
    ctaTo: '/register',
  },
];

const PAGE_CSS = `
body.sc-landing-active{overflow-x:hidden;}
.sc-boot{position:fixed;inset:0;z-index:90;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:#F5F6F8;transition:opacity .7s cubic-bezier(.22,.61,.36,1),visibility .7s;}
.sc-boot.done{opacity:0;visibility:hidden;pointer-events:none;}
.sc-boot p{font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12.5px;letter-spacing:.05em;color:rgba(15,20,29,.42);text-transform:uppercase;}
.sc-bar{width:150px;height:1px;background:rgba(15,20,29,.14);overflow:hidden;}
.sc-bar i{display:block;height:100%;width:100%;background:#5B6EF5;transform:scaleX(0);transform-origin:0 50%;}
.sc-stage{position:fixed;inset:0;z-index:0;overflow:hidden;background:#F5F6F8;}
.sc-stage video{position:absolute;top:50%;left:50%;width:100%;height:100%;transform:translate(-50%,-50%) scale(1.02);object-fit:cover;filter:contrast(1.02);will-change:transform;}
.sc-veil{position:absolute;inset:0;pointer-events:none;background:linear-gradient(to bottom,rgba(245,246,248,.62) 0%,rgba(245,246,248,.12) 22%,rgba(245,246,248,.12) 78%,rgba(245,246,248,.66) 100%),radial-gradient(100% 80% at 50% 48%,rgba(245,246,248,0) 0%,rgba(245,246,248,.34) 100%),rgba(245,246,248,.20);}
.sc-grain{position:absolute;inset:-50%;opacity:.13;mix-blend-mode:multiply;pointer-events:none;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/></filter><rect width='140' height='140' filter='url(%23n)' opacity='.5'/></svg>");}
.sc-meter{position:fixed;top:0;left:0;z-index:50;height:2px;width:100%;transform:scaleX(0);transform-origin:0 50%;background:#5B6EF5;opacity:.7;}
.sc-chrome{position:fixed;left:0;right:0;top:0;z-index:40;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:max(14px,calc(env(safe-area-inset-top,0px) + 12px)) clamp(16px,3.4vw,44px) 14px;background:linear-gradient(to bottom,rgba(245,246,248,.94) 0%,rgba(245,246,248,.78) 72%,rgba(245,246,248,0) 100%);}
.sc-mark{display:flex;align-items:center;gap:9px;font-family:'Space Grotesk','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;font-weight:500;letter-spacing:-.012em;color:#0F141D;min-width:0;flex-shrink:1;text-decoration:none;}
.sc-mark-star{opacity:.9;color:#5B6EF5;}
.sc-nav{display:flex;align-items:center;gap:clamp(14px,2.4vw,32px);flex-shrink:0;}
.sc-nav a:not(.sc-pill){color:#0F141D;text-decoration:none;font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14.5px;letter-spacing:-.008em;opacity:.88;transition:opacity .3s cubic-bezier(.22,.61,.36,1);}
.sc-nav a:not(.sc-pill):hover{opacity:1;}
.sc-pill{display:inline-flex;align-items:center;justify-content:center;height:40px;padding:0 21px;border-radius:999px;background:#5B6EF5;color:#fff !important;-webkit-text-fill-color:#fff !important;font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14.5px;font-weight:500;letter-spacing:-.008em;text-decoration:none;white-space:nowrap;border:1px solid rgba(91,110,245,.25);box-shadow:0 1px 0 rgba(255,255,255,.10) inset;transition:transform .4s cubic-bezier(.22,.61,.36,1),background .3s cubic-bezier(.22,.61,.36,1);}
.sc-nav .sc-pill{color:#fff;-webkit-text-fill-color:#fff;}
.sc-pill:hover,.sc-pill:focus-visible{transform:translateY(-2px);background:#4351D6;color:#fff !important;-webkit-text-fill-color:#fff !important;}
.sc-pill:focus-visible{outline:2px solid #5B6EF5;outline-offset:2px;}
.sc-foot{position:fixed;bottom:0;left:0;right:0;z-index:40;display:flex;justify-content:center;padding:14px clamp(16px,4vw,24px) max(16px,calc(env(safe-area-inset-bottom,0px) + 12px));font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.45;letter-spacing:.02em;color:rgba(15,20,29,.42);text-align:center;pointer-events:none;background:linear-gradient(to top,rgba(245,246,248,.92) 0%,rgba(245,246,248,.72) 72%,rgba(245,246,248,0) 100%);}
.sc-panels{position:fixed;inset:0;z-index:20;pointer-events:none;}
.sc-panel{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:max(104px,calc(env(safe-area-inset-top,0px) + 88px)) clamp(20px,5vw,60px) max(96px,calc(env(safe-area-inset-bottom,0px) + 80px));opacity:0;will-change:opacity,transform;}
.sc-eyebrow{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:6px 12px;font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12.5px;letter-spacing:.045em;color:#5B6EF5;text-transform:uppercase;margin-bottom:clamp(16px,2vw,22px);max-width:min(46ch,100%);text-align:center;}
.sc-panel h1{font-family:'Space Grotesk','Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:500;font-size:clamp(34px,7.1vw,100px);line-height:.99;letter-spacing:-.03em;max-width:15ch;color:#0F141D;text-wrap:balance;margin:0;}
.sc-sub{margin-top:clamp(18px,2.2vw,28px);font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:clamp(15px,1.28vw,19px);line-height:1.5;letter-spacing:-.008em;color:rgba(15,20,29,.64);max-width:min(46ch,100%);text-wrap:pretty;}
.sc-cta{margin-top:clamp(28px,3.4vw,44px);pointer-events:auto;width:100%;display:flex;justify-content:center;}
.sc-cta .sc-pill{height:48px;padding:0 27px;font-size:15px;max-width:min(100%,320px);}
.sc-track{position:relative;z-index:1;height:560vh;min-height:3200px;}
@media(max-width:900px){.sc-veil{background:linear-gradient(to bottom,rgba(245,246,248,.72) 0%,rgba(245,246,248,.18) 24%,rgba(245,246,248,.18) 76%,rgba(245,246,248,.74) 100%),radial-gradient(100% 80% at 50% 48%,rgba(245,246,248,0) 0%,rgba(245,246,248,.40) 100%),rgba(245,246,248,.24);}}
@media(max-width:720px){.sc-nav a:not(.sc-pill){display:none;}.sc-mark{font-size:14px;}.sc-nav .sc-pill{height:38px;padding:0 16px;font-size:13.5px;}.sc-panel h1{max-width:12ch;font-size:clamp(30px,9.8vw,52px);}.sc-sub{font-size:15px;max-width:34ch;}.sc-panel{padding:max(92px,calc(env(safe-area-inset-top,0px) + 76px)) 18px max(88px,calc(env(safe-area-inset-bottom,0px) + 72px));}.sc-foot{font-size:11px;max-width:34ch;}}
@media(max-width:420px){.sc-mark-star{display:none;}.sc-nav .sc-pill{height:36px;padding:0 14px;font-size:13px;}.sc-panel h1{max-width:11ch;font-size:clamp(28px,10.5vw,40px);}.sc-eyebrow{font-size:11px;letter-spacing:.04em;max-width:28ch;}.sc-cta .sc-pill{width:100%;max-width:280px;height:44px;padding:0 20px;font-size:14px;}}
@media(max-height:520px) and (orientation:landscape){.sc-panel{padding:max(72px,calc(env(safe-area-inset-top,0px) + 56px)) 24px max(64px,calc(env(safe-area-inset-bottom,0px) + 48px));}.sc-panel h1{font-size:clamp(28px,8vh,44px);}.sc-sub{margin-top:12px;font-size:14px;}.sc-cta{margin-top:16px;}}
`;

function clamp(v, a, b) { return Math.min(Math.max(v, a), b); }
function smooth(t) { return t * t * (3 - 2 * t); }
function ramp(p, a, b) {
  if (b <= a) return p >= b ? 1 : 0;
  return smooth(clamp((p - a) / (b - a), 0, 1));
}

export default function Landing() {
  const clipRef    = useRef(null);
  const bootRef    = useRef(null);
  const bootBarRef = useRef(null);
  const bootPctRef = useRef(null);
  const meterRef   = useRef(null);
  const panelsRef  = useRef([]);
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  async function handleLogout() {
    await logout();
    showToast('Logged out successfully.', 'success');
  }

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = PAGE_CSS;
    document.head.appendChild(style);
    const pc1 = Object.assign(document.createElement('link'), { rel: 'preconnect', href: 'https://fonts.googleapis.com' });
    const pc2 = Object.assign(document.createElement('link'), { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: '' });
    const font = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600&display=swap' });
    document.head.append(pc1, pc2, font);
    document.body.classList.add('sc-landing-active');
    return () => {
      document.head.removeChild(style);
      document.head.removeChild(pc1);
      document.head.removeChild(pc2);
      document.head.removeChild(font);
      document.body.classList.remove('sc-landing-active');
    };
  }, []);

  useEffect(() => {
    const clip    = clipRef.current;
    const boot    = bootRef.current;
    const bootBar = bootBarRef.current;
    const bootPct = bootPctRef.current;
    const meter   = meterRef.current;
    const panels  = panelsRef.current;
    if (!clip || !boot) return;

    let progress = 0, seekTo = 0, seekAt = 0, duration = 0, ready = false;
    let rafId, started = false, attached = false;

    function readScroll() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress = max > 0 ? clamp(window.pageYOffset / max, 0, 1) : 0;
      if (duration) seekTo = progress * duration;
    }

    function paint() {
      if (meter) meter.style.transform = 'scaleX(' + progress + ')';
      CUES.forEach(function (c, i) {
        const el = panels[i]; if (!el) return;
        const enter = ramp(progress, c[0], c[1]);
        const leave = ramp(progress, c[2], c[3]);
        const o = enter * (1 - leave);
        const y = (1 - enter) * DRIFT - leave * DRIFT;
        el.style.opacity = o;
        el.style.transform = 'translate3d(0,' + y + 'px,0)';
        el.style.pointerEvents = o > 0.6 ? 'auto' : 'none';
      });
    }

    function setProgress(f) {
      if (bootBar) bootBar.style.transform = 'scaleX(' + f + ')';
      if (bootPct) bootPct.textContent = 'LOADING ' + Math.round(f * 100) + '%';
    }

    function start() {
      if (started) return;
      started = true; ready = true;
      boot.classList.add('done');
      readScroll(); seekAt = seekTo;
    }

    function attach(src) {
      if (attached) return;
      attached = true;
      clip.addEventListener('loadedmetadata', function () {
        duration = clip.duration || 0; clip.pause(); readScroll(); seekAt = seekTo;
        try { clip.currentTime = seekAt; } catch (e) {}
      });
      clip.addEventListener('loadeddata', start);
      clip.addEventListener('canplaythrough', start);
      clip.addEventListener('error', start);
      clip.src = src; clip.load();
      setTimeout(start, 12000);
    }

    // Preload as a fully buffered blob first.
    // Seeking inside a buffered blob is near-instant (every byte is local).
    // Seeking via range requests requires a new HTTP round-trip per seek —
    // scrubbing over the network looks like a slideshow. ~6.5 MB fallback
    // is this file's approximate size when the server sends no content-length.
    function preload() {
      let bail, controller;
      if (typeof AbortController !== 'undefined') controller = new AbortController();
      bail = setTimeout(function () {
        if (!attached) { if (controller) controller.abort(); setProgress(1); attach(FALLBACK_URL); }
      }, 15000);
      fetch(VIDEO_URL, controller ? { signal: controller.signal } : {})
        .then(function (res) {
          if (!res.ok || !res.body) throw new Error('bad response');
          const total = parseInt(res.headers.get('content-length') || '0', 10);
          const reader = res.body.getReader(); const chunks = []; let got = 0;
          function pump() {
            return reader.read().then(function (r) {
              if (r.done) return new Blob(chunks, { type: 'video/mp4' });
              chunks.push(r.value); got += r.value.length;
              setProgress(total ? got / total : Math.min(got / 6.5e6, 0.95));
              return pump();
            });
          }
          return pump();
        })
        .then(function (blob) { clearTimeout(bail); setProgress(1); attach(URL.createObjectURL(blob)); })
        .catch(function () { clearTimeout(bail); setProgress(1); attach(FALLBACK_URL); });
    }

    // rAF loop — eases currentTime toward scroll target.
    // The 0.115 easing factor turns a jumpy snap into a smooth scrub. Do not change.
    function frame() {
      if (ready && duration) {
        const gap = seekTo - seekAt;
        if (Math.abs(gap) > 0.0008) {
          seekAt += gap * 0.115;
          if (clip.readyState >= 2 && !clip.seeking) {
            try { clip.currentTime = seekAt; } catch (e) {}
          }
        }
      }
      paint();
      rafId = requestAnimationFrame(frame);
    }

    // iOS play/pause nudge.
    // iOS will not paint any video frame until the element has been played once.
    // We play() then immediately pause() on first interaction to unlock scrubbing.
    function unlock() {
      const p = clip.play();
      if (p && p.then) p.then(function () { clip.pause(); }).catch(function () {});
      else clip.pause();
    }
    ['touchstart', 'pointerdown', 'wheel', 'keydown'].forEach(function (ev) {
      window.addEventListener(ev, unlock, { once: true, passive: true });
    });

    window.addEventListener('scroll', readScroll, { passive: true });
    window.addEventListener('resize', readScroll);
    readScroll(); paint(); preload();
    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', readScroll);
      window.removeEventListener('resize', readScroll);
    };
  }, []);

  return (
    <>
      <div className="sc-boot" ref={bootRef}>
        <div className="sc-bar"><i ref={bootBarRef} /></div>
        <p ref={bootPctRef}>LOADING 0%</p>
      </div>

      <div className="sc-stage">
        <video ref={clipRef} muted playsInline preload="auto" disablePictureInPicture />
        <div className="sc-veil" />
        <div className="sc-grain" />
      </div>

      <i className="sc-meter" ref={meterRef} />

      <header className="sc-chrome">
        <div className="sc-mark">
          <img
            src="/logo.jpg"
            alt="SmartCart AI logo"
            style={{ width: 34, height: 34, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }}
          />
          &nbsp;SmartCart AI
        </div>
        <nav className="sc-nav">
          <Link to="/products">Products</Link>
          {user ? (
            <>
              <Link to={user.role === 'admin' ? '/admin' : '/dashboard'}>Dashboard</Link>
              <button
                type="button"
                onClick={handleLogout}
                className="sc-pill"
                style={{ cursor: 'pointer', border: 'none' }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Sign in</Link>
              <Link to="/register" className="sc-pill">Get started</Link>
            </>
          )}
        </nav>
      </header>

      <main className="sc-panels">
        {PANELS_DATA.map((p, i) => (
          <section
            key={i}
            className="sc-panel"
            ref={(el) => { panelsRef.current[i] = el; }}
            data-panel
          >
            <p className="sc-eyebrow">{p.eyebrow}</p>
            <h1 dangerouslySetInnerHTML={{ __html: p.h1 }} />
            <p className="sc-sub">{p.sub}</p>
            <div className="sc-cta">
              <Link to={p.ctaTo} className="sc-pill">{p.ctaLabel}</Link>
            </div>
          </section>
        ))}
      </main>

      <footer className="sc-foot">
        Predictions that convert &nbsp;&middot;&nbsp; Live on every order, every session
      </footer>

      <div className="sc-track" />
    </>
  );
}

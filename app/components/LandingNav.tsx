"use client";
import { useState } from "react";
import Link from "next/link";

export default function LandingNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <nav className="inv-nav">
        <Link href="/" className="inv-nav-logo" onClick={close}>
          <svg className="inv-nav-logo-mark" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="url(#lnLogoGrad)"/>
            <rect x="7" y="20" width="4" height="5" rx="1" fill="white" fillOpacity="0.9"/>
            <rect x="14" y="14" width="4" height="11" rx="1" fill="white" fillOpacity="0.9"/>
            <rect x="21" y="8" width="4" height="17" rx="1" fill="white" fillOpacity="0.9"/>
            <defs>
              <linearGradient id="lnLogoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#059669"/>
                <stop offset="100%" stopColor="#0ea5e9"/>
              </linearGradient>
            </defs>
          </svg>
          <span className="inv-nav-logo-text">Learn<span>2</span>Earn</span>
        </Link>

        <ul className="inv-nav-links">
          <li><a href="#platform">Platform</a></li>
          <li><a href="#impact">Impact</a></li>
          <li><a href="#usecases">Use Cases</a></li>
          <li><a href="#demo">Demo</a></li>
          <li><a href="#contact">Contact</a></li>
          <li>
            <a href="#demo" className="inv-btn inv-btn-glass inv-btn-nav">Book a Demo</a>
          </li>
          <li>
            <a href="#contact" className="inv-btn inv-btn-primary inv-btn-nav">Request a Pilot Plan</a>
          </li>
        </ul>

        <button
          className={`inv-hamburger${open ? " inv-hamburger-open" : ""}`}
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
        >
          <span className="inv-hb-bar"></span>
          <span className="inv-hb-bar"></span>
          <span className="inv-hb-bar"></span>
        </button>
      </nav>

      <div className={`inv-mobile-nav${open ? " inv-mobile-nav-open" : ""}`} aria-hidden={!open}>
        <a href="#platform" className="inv-mobile-link" onClick={close}>Platform</a>
        <a href="#impact" className="inv-mobile-link" onClick={close}>Impact</a>
        <a href="#usecases" className="inv-mobile-link" onClick={close}>Use Cases</a>
        <a href="#demo" className="inv-mobile-link" onClick={close}>Demo</a>
        <a href="#contact" className="inv-mobile-link" onClick={close}>Contact</a>
        <div className="inv-mobile-actions">
          <a href="#demo" className="inv-btn inv-btn-glass" onClick={close}>Book a Demo</a>
          <a href="#contact" className="inv-btn inv-btn-primary" onClick={close}>Request a Pilot Plan</a>
        </div>
      </div>
    </>
  );
}

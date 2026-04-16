"use client";

import { useState, useEffect } from "react";

export default function AustinNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleLinkClick = () => {
    setMenuOpen(false);
  };

  return (
    <nav className="atx-nav">
      <a href="/" className="atx-nav-logo">
        <svg viewBox="0 0 32 32" fill="none">
          <rect x="4" y="18" width="6" height="10" rx="1" fill="#00467F" opacity="0.5" />
          <rect x="13" y="12" width="6" height="16" rx="1" fill="#00467F" opacity="0.7" />
          <rect x="22" y="6" width="6" height="22" rx="1" fill="#00467F" />
        </svg>
        Learn2Earn
      </a>

      <button
        className={`atx-nav-hamburger ${menuOpen ? "atx-nav-hamburger--open" : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
      >
        <span />
        <span />
        <span />
      </button>

      <div className={`atx-nav-links ${menuOpen ? "atx-nav-links--open" : ""}`}>
        <a href="#problem" onClick={handleLinkClick}>Challenge</a>
        <a href="#solution" onClick={handleLinkClick}>Solution</a>
        <a href="#how-it-works" onClick={handleLinkClick}>Process</a>
        <a href="#scope" onClick={handleLinkClick}>Scope</a>
        <a href="#funding" onClick={handleLinkClick}>Funding</a>
        <a href="#learning-paths" onClick={handleLinkClick}>Paths</a>
        <a href="#timeline" onClick={handleLinkClick}>Timeline</a>
        <a href="#contact" className="atx-nav-cta" onClick={handleLinkClick}>Request Pilot Plan</a>
      </div>

      {menuOpen && (
        <div className="atx-nav-overlay" onClick={() => setMenuOpen(false)} />
      )}
    </nav>
  );
}

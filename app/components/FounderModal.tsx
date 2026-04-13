"use client";
import { useState, useEffect, useCallback } from "react";

export default function FounderModal() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  return (
    <>
      <button className="inv-footer-about-btn" onClick={() => setOpen(true)}>
        About Us
      </button>

      {open && (
        <div className="inv-founder-overlay" onClick={close}>
          <div
            className="inv-founder-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="About the Founder"
          >
            <button
              className="inv-founder-modal-close"
              onClick={close}
              aria-label="Close"
            >
              &times;
            </button>

            <div className="inv-founder-modal-body">
              <div className="inv-founder-photo-wrap">
                <img
                  src="/images/founder-headshot.jpeg"
                  alt="Anthony Cognet, Founder of Learn2Earn"
                  className="inv-founder-photo"
                  width={180}
                  height={180}
                />
              </div>

              <div className="inv-founder-story">
                <h3 className="inv-founder-name">Anthony Cognet</h3>
                <p className="inv-founder-role">Founder</p>

                <p className="inv-founder-text">
                  Anthony grew up in Los Angeles, raised by young parents who were caught
                  up in the cycle of negative influences and substance abuse. What started
                  as instability at home eventually led his family into homelessness &mdash;
                  an experience that shaped how he sees the world and the people in it.
                </p>
                <p className="inv-founder-text">
                  That firsthand understanding of what it means to feel invisible, to wonder
                  where the next meal is coming from, and to fight for a future that nobody
                  expects you to have &mdash; that&apos;s the heart of Learn to Earn. Anthony
                  built this platform because he knows that people experiencing homelessness
                  aren&apos;t lacking ability. They&apos;re lacking opportunity. Learn to Earn
                  exists to close that gap: real education, real incentives, and real support
                  for people ready to take the next step.
                </p>

                <div className="inv-founder-edu">
                  <span className="inv-founder-edu-label">Education</span>
                  <p className="inv-founder-edu-text">
                    Bachelor of Arts in Business Administration
                  </p>
                  <p className="inv-founder-edu-school">
                    California State Polytechnic University, Pomona &middot; 2014 &ndash; 2019
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

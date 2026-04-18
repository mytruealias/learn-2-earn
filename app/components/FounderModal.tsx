"use client";
import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { useModalA11y } from "@/lib/use-modal-a11y";

export default function FounderModal() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useModalA11y(open, dialogRef, close);

  return (
    <>
      <button
        className="inv-footer-about-btn"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        About Us
      </button>

      {open && (
        <div className="inv-founder-overlay" onClick={close}>
          <div
            ref={dialogRef}
            tabIndex={-1}
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
                <Image
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
                  I grew up in Los Angeles. My parents were young, caught up in substance
                  abuse and the cycle that comes with it. That instability at home eventually
                  put my family on the streets. I know what it feels like to wonder where
                  the next meal is coming from and to fight for a future nobody expects
                  you to have.
                </p>
                <p className="inv-founder-text">
                  That experience is why I built Learn to Earn. I&apos;ve seen firsthand
                  that people experiencing homelessness aren&apos;t lacking ability. They&apos;re
                  lacking opportunity. This platform exists to close that gap. Real education,
                  real incentives, and real support for people who are ready to take the
                  next step.
                </p>
                <p className="inv-founder-text">
                  I know what rock bottom looks like. I know what it&apos;s like when
                  you can&apos;t even afford a bottle of water. That&apos;s why Learn to Earn
                  pays people to learn instead of charging them. This was never about
                  building a business. It&apos;s about building something bigger than me.
                  A movement that meets people where they are and gives them a real shot
                  at moving forward. Impact comes first. Everything else follows.
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

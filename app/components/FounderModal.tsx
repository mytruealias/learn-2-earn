"use client";
import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { useModalA11y } from "@/lib/use-modal-a11y";

const TEAM = [
  {
    name: "Maya",
    role: "Lead Engineer",
    note: "Builds the case-worker tools and admin dashboards.",
  },
  {
    name: "Daniel",
    role: "Mobile Engineer",
    note: "Makes the learner experience fast on any phone.",
  },
  {
    name: "Priya",
    role: "Full-Stack Engineer",
    note: "Connects payouts, partners, and reporting.",
  },
  {
    name: "Marcus",
    role: "Data & Reporting",
    note: "Turns participation into insights for funders.",
  },
];

function HeartGlyph() {
  return (
    <svg
      className="inv-team-heart"
      width="34"
      height="34"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 21s-7.5-4.6-9.5-9.1C1.1 8.4 3.4 5 6.8 5c1.9 0 3.6.9 4.7 2.4l.5.7.5-.7C13.6 5.9 15.3 5 17.2 5c3.4 0 5.7 3.4 4.3 6.9C19.5 16.4 12 21 12 21z"
        fill="currentColor"
        fillOpacity="0.55"
      />
    </svg>
  );
}

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
            aria-label="About Learn2Earn"
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
                <p className="inv-founder-role">Founder &amp; Executive Director</p>

                <p className="inv-founder-text">
                  Anthony grew up in a family that experienced homelessness firsthand.
                  He started Learn to Earn because he&apos;s seen up close that people
                  on the streets aren&apos;t lacking ability &mdash; they&apos;re
                  lacking opportunity. That conviction is what this whole
                  organization is built on.
                </p>

                <div className="inv-founder-org">
                  <span className="inv-founder-org-label">About the Organization</span>
                  <p className="inv-founder-text">
                    Learn2Earn is a Texas-based nonprofit. We&apos;ve spent the last
                    four years building this work from the ground up &mdash; showing up
                    at local townhall meetings, listening to residents and city leaders,
                    and sitting down regularly with nonprofit representatives across
                    the region to understand what people on the ground actually need.
                  </p>
                </div>

                <div className="inv-team-section">
                  <span className="inv-team-section-label">Meet the Team</span>
                  <p className="inv-team-section-intro">
                    A small Texas-based crew of full-time engineers building and
                    maintaining the platform every day.
                  </p>
                  <div className="inv-team-grid">
                    {TEAM.map((m) => (
                      <div key={m.name} className="inv-team-card">
                        <div
                          className="inv-team-avatar"
                          aria-label={`${m.name}, ${m.role} (placeholder photo)`}
                        >
                          <HeartGlyph />
                        </div>
                        <div className="inv-team-name">{m.name}</div>
                        <div className="inv-team-role">{m.role}</div>
                        <div className="inv-team-note">{m.note}</div>
                      </div>
                    ))}
                  </div>
                  <p className="inv-team-placeholder-note">
                    Headshots coming soon &mdash; the placeholders above stand in for
                    real teammates.
                  </p>
                </div>

                <div className="inv-hiring">
                  <span className="inv-hiring-label">We&apos;re Hiring</span>
                  <h4 className="inv-hiring-title">
                    Looking for people who care about this work.
                  </h4>
                  <p className="inv-hiring-text">
                    We&apos;re a Texas nonprofit looking for engineers, designers,
                    and partnership-minded people who want to help cities and
                    shelters serve people experiencing homelessness. If that sounds
                    like you, we&apos;d love to hear from you.
                  </p>
                  <a
                    className="inv-btn inv-btn-primary inv-hiring-cta"
                    href="mailto:partners@learn2earn.org?subject=Hiring%20inquiry"
                  >
                    Get in touch
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

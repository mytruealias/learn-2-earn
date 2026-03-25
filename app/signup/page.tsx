"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PenIcon, MapPinIcon, ShieldIcon } from "../components/icons";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    dateOfBirth: "",
    phone: "",
    city: "",
    state: "",
    zipCode: "",
    caseNumber: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  };

  const handleSubmit = async () => {
    if (!form.fullName || !form.email || !form.password) {
      setError("Name, email, and password are required");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const guestId = localStorage.getItem("l2e_user_id");

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, guestId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      localStorage.setItem("l2e_user_id", data.user.id);
      localStorage.setItem("l2e_logged_in", "true");
      router.push("/profile");
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "0.85rem 1rem",
    backgroundColor: "var(--bg-card)",
    border: "1px solid var(--border-color)",
    borderRadius: "10px",
    color: "var(--text-primary)",
    fontSize: "0.95rem",
    fontFamily: "var(--font-display)",
    outline: "none",
  };

  const labelStyle = {
    fontSize: "0.75rem" as const,
    fontWeight: "600" as const,
    color: "var(--text-secondary)",
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
    marginBottom: "0.35rem",
    display: "block" as const,
  };

  const stepIcons = [
    <PenIcon key="pen" size={20} color="var(--accent-green)" />,
    <MapPinIcon key="pin" size={20} color="var(--accent-green)" />,
    <ShieldIcon key="shield" size={20} color="var(--accent-green)" />,
  ];
  const stepLabels = ["Your Info", "Location", "Emergency"];

  return (
    <div className="grid-bg" style={{ minHeight: "100vh", padding: "2rem 1.5rem 4rem" }}>
      <div style={{ maxWidth: "500px", margin: "0 auto" }}>
        <Link href="/app" style={{
          color: "var(--accent-green)",
          fontSize: "0.85rem",
          fontWeight: "600",
          display: "inline-block",
          marginBottom: "1.5rem",
        }}>
          ← Back to Home
        </Link>

        <div style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.5rem",
        }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{
              flex: 1,
              height: "4px",
              borderRadius: "999px",
              backgroundColor: s <= step ? "var(--accent-green)" : "var(--border-color)",
              transition: "background-color 0.3s",
            }} />
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          {stepIcons[step - 1]}
          <span style={{
            fontSize: "0.75rem",
            fontWeight: "700",
            color: "var(--accent-green)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}>Step {step} of 3 — {stepLabels[step - 1]}</span>
        </div>

        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "2rem",
          fontWeight: "700",
          marginBottom: "0.5rem",
        }}>
          Create Your Account
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "2rem", lineHeight: "1.5" }}>
          {step === 1 && "Let's start with your basic information. This helps the program identify you."}
          {step === 2 && "Optional: Help your caseworker find your records faster."}
          {step === 3 && "Optional: Who should we contact in an emergency?"}
        </p>

        {error && (
          <div style={{
            backgroundColor: "rgba(255,75,75,0.1)",
            border: "1px solid var(--accent-red)",
            borderRadius: "10px",
            padding: "0.75rem 1rem",
            marginBottom: "1.25rem",
            color: "var(--accent-red)",
            fontSize: "0.85rem",
            fontFamily: "var(--font-display)",
          }}>
            {error}
          </div>
        )}

        {step === 1 && (
          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input type="text" placeholder="Your full legal name" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email *</label>
              <input type="email" placeholder="your@email.com" value={form.email} onChange={(e) => update("email", e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Password *</label>
              <input type="password" placeholder="At least 6 characters" value={form.password} onChange={(e) => update("password", e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Date of Birth</label>
              <input type="date" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input type="tel" placeholder="(555) 123-4567" value={form.phone} onChange={(e) => update("phone", e.target.value)} style={inputStyle} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>City</label>
              <input type="text" placeholder="Your city" value={form.city} onChange={(e) => update("city", e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>State</label>
              <input type="text" placeholder="Your state" value={form.state} onChange={(e) => update("state", e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Zip Code</label>
              <input type="text" placeholder="ZIP code" value={form.zipCode} onChange={(e) => update("zipCode", e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Case Number</label>
              <input type="text" placeholder="Government case or ID number (if any)" value={form.caseNumber} onChange={(e) => update("caseNumber", e.target.value)} style={inputStyle} />
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                Assigned by your caseworker or social services
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Emergency Contact Name</label>
              <input type="text" placeholder="Name of someone who can be reached" value={form.emergencyContactName} onChange={(e) => update("emergencyContactName", e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Emergency Contact Phone</label>
              <input type="tel" placeholder="Their phone number" value={form.emergencyContactPhone} onChange={(e) => update("emergencyContactPhone", e.target.value)} style={inputStyle} />
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "2rem" }}>
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              style={{
                flex: 1,
                padding: "0.85rem",
                backgroundColor: "var(--bg-card)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "12px",
                fontWeight: "600",
                fontSize: "0.95rem",
                fontFamily: "var(--font-display)",
              }}
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => {
                if (step === 1 && (!form.fullName || !form.email || !form.password)) {
                  setError("Please fill in name, email, and password");
                  return;
                }
                if (step === 1 && form.password.length < 6) {
                  setError("Password must be at least 6 characters");
                  return;
                }
                setStep((s) => s + 1);
              }}
              style={{
                flex: 1,
                padding: "0.85rem",
                backgroundColor: "var(--accent-green)",
                color: "#0f1923",
                border: "none",
                borderRadius: "12px",
                fontWeight: "700",
                fontSize: "0.95rem",
                fontFamily: "var(--font-display)",
                letterSpacing: "0.03em",
              }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                flex: 1,
                padding: "0.85rem",
                backgroundColor: loading ? "var(--bg-card)" : "var(--accent-green)",
                color: loading ? "var(--text-muted)" : "#0f1923",
                border: "none",
                borderRadius: "12px",
                fontWeight: "700",
                fontSize: "0.95rem",
                fontFamily: "var(--font-display)",
                letterSpacing: "0.03em",
              }}
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Already have an account? </span>
          <Link href="/login" style={{
            color: "var(--accent-blue)",
            fontSize: "0.85rem",
            fontWeight: "600",
          }}>
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { AuthService } from "../auth/authService";
import { S } from "../utils/theme";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    linkedIn: "",
    countryCode: "+91",
    mobile: "",
    photoBase64: "",
    isMobileVerified: false,
    role: "",
    domain: "",
    batch: ""
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");

  useEffect(() => {
    AuthService.apiFetch("/profile")
      .then((data) => {
        let fetchedMobile = data.mobile || "";
        let fetchedCode = "+91"; 
        
        const knownCodes = ["+91", "+1", "+44", "+61", "+971"];
        for (let code of knownCodes) {
          if (fetchedMobile.startsWith(code)) {
            fetchedCode = code;
            fetchedMobile = fetchedMobile.slice(code.length).trim();
            break;
          }
        }

        setProfile({
          name: data.name || "",
          email: data.email || "",
          linkedIn: data.linkedIn || "",
          countryCode: fetchedCode,
          mobile: fetchedMobile,
          photoBase64: data.photoBase64 || "",
          isMobileVerified: data.isMobileVerified || false,
          role: data.role || "",
          domain: data.domain || "",
          batch: data.batch || ""
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, photoBase64: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fullMobile = profile.mobile ? `${profile.countryCode}${profile.mobile.trim()}` : "";
      await AuthService.apiFetch("/profile", {
        method: "PUT",
        body: JSON.stringify({ ...profile, mobile: fullMobile }),
      });
      alert("Profile updated successfully!");
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const requestOtp = async () => {
    if (!profile.mobile) return alert("Please enter a mobile number first.");
    setVerifying(true);
    try {
      const fullMobile = `${profile.countryCode}${profile.mobile.trim()}`;
      
      await AuthService.apiFetch("/profile", {
        method: "PUT",
        body: JSON.stringify({ ...profile, mobile: fullMobile }),
      });

      await AuthService.apiFetch("/profile/send-otp", { method: "POST" });
      setShowOtpModal(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setVerifying(false);
    }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    try {
      await AuthService.apiFetch("/profile/verify-mobile", {
        method: "POST",
        body: JSON.stringify({ otp: otpInput })
      });
      setProfile({ ...profile, isMobileVerified: true });
      setShowOtpModal(false);
      setOtpInput("");
      alert("Mobile number verified successfully!");
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div style={{ color: "#6B7280" }}>Loading profile...</div>;

  return (
    <>
      <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ ...S.card, padding: 32 }}>
          <h2 style={{ margin: "0 0 24px 0", color: "#111827", fontSize: 20 }}>Profile Management</h2>
          
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{
                width: 100, height: 100, borderRadius: "50%", background: "#F3F4F6",
                border: "2px dashed #D1D5DB", display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", position: "relative"
              }}>
                {profile.photoBase64 ? (
                  <img src={profile.photoBase64} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 32, color: "#9CA3AF" }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </span>
                )}
              </div>
              <div>
                <label style={{
                  background: "#7C3AED", color: "#fff", padding: "8px 16px", borderRadius: 8,
                  fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-block"
                }}>
                  Upload Photo
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: "none" }} />
                </label>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 8 }}>JPG, GIF or PNG. Max size of 2MB.</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Full Name</label>
                <input type="text" name="name" value={profile.name} onChange={handleChange} style={{
                  padding: "10px 14px", borderRadius: 8, border: "1px solid #D1D5DB", outline: "none", fontSize: 14
                }} required />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Email Address (Read Only)</label>
                <input type="email" value={profile.email} disabled style={{
                  padding: "10px 14px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#9CA3AF", outline: "none", fontSize: 14
                }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>LinkedIn Profile URL</label>
                <input type="url" name="linkedIn" value={profile.linkedIn} onChange={handleChange} placeholder="https://linkedin.com/in/..." style={{
                  padding: "10px 14px", borderRadius: 8, border: "1px solid #D1D5DB", outline: "none", fontSize: 14
                }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Mobile Number</label>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{
                    display: "flex", flex: 1, border: "1px solid #D1D5DB",
                    borderRadius: 8, overflow: "hidden", background: "#fff"
                  }}>
                    <select
                      name="countryCode"
                      value={profile.countryCode}
                      onChange={handleChange}
                      style={{
                        padding: "10px 8px", background: "#F9FAFB", border: "none",
                        borderRight: "1px solid #E5E7EB", outline: "none", cursor: "pointer",
                        fontSize: 14, color: "#4B5563", fontWeight: 500
                      }}
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+61">🇦🇺 +61</option>
                      <option value="+971">🇦🇪 +971</option>
                    </select>
                    <input
                      type="tel"
                      name="mobile"
                      value={profile.mobile}
                      onChange={handleChange}
                      placeholder="98765 43210"
                      style={{
                        flex: 1, padding: "10px 14px", border: "none", outline: "none", fontSize: 14
                      }}
                    />
                  </div>
                  
                  {profile.isMobileVerified ? (
                    <div style={{ display: "flex", alignItems: "center", padding: "0 14px", background: "#ECFDF5", color: "#059669", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "1px solid #A7F3D0" }}>
                      Verified ✓
                    </div>
                  ) : (
                    <button type="button" onClick={requestOtp} disabled={!profile.mobile || verifying} style={{
                      padding: "0 16px", background: profile.mobile ? "#F3F4F6" : "#F9FAFB", color: profile.mobile ? "#111827" : "#D1D5DB",
                      border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: profile.mobile ? "pointer" : "not-allowed",
                      whiteSpace: "nowrap"
                    }}>
                      {verifying ? "Sending..." : "Verify"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, padding: "16px", background: "#F9FAFB", borderRadius: 8, border: "1px solid #E5E7EB" }}>
              <div style={{ fontSize: 13, color: "#4B5563" }}><strong>Role:</strong> <span style={{ textTransform: "capitalize" }}>{profile.role}</span></div>
              <div style={{ fontSize: 13, color: "#4B5563" }}><strong>Domain:</strong> {profile.domain || "Unassigned"}</div>
              <div style={{ fontSize: 13, color: "#4B5563" }}><strong>Batch:</strong> {profile.batch || "Unassigned"}</div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid #E5E7EB", paddingTop: 20, marginTop: 10 }}>
              <button type="submit" disabled={saving} style={{
                background: "#7C3AED", color: "#fff", border: "none", borderRadius: 8, padding: "12px 24px",
                fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", fontSize: 14
              }}>
                {saving ? "Saving Changes..." : "Save Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showOtpModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(17, 24, 39, 0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
        }}>
          <div style={{
            background: "#fff", padding: 32, borderRadius: 16, width: 380,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: 20, color: "#111827" }}>Verify Mobile</h3>
            <p style={{ margin: "0 0 24px 0", fontSize: 14, color: "#4B5563", lineHeight: 1.5 }}>
            Enter the 6-digit verification code sent to your registered email (<strong>{profile.email}</strong>) to verify your mobile number.
            </p>

            <form onSubmit={submitOtp}>
              <input
                type="text"
                value={otpInput}
                onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                placeholder="••••••"
                autoFocus
                style={{
                  width: "100%", padding: "16px", borderRadius: 12, border: "2px solid #E5E7EB",
                  fontSize: 28, letterSpacing: 12, textAlign: "center", outline: "none",
                  marginBottom: 24, fontWeight: 700, color: "#111827", boxSizing: "border-box"
                }}
                required
              />
              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={() => setShowOtpModal(false)} style={{
                  flex: 1, padding: "12px", background: "#F3F4F6", color: "#374151",
                  border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14
                }}>
                  Cancel
                </button>
                <button type="submit" disabled={otpInput.length !== 6} style={{
                  flex: 1, padding: "12px", background: otpInput.length === 6 ? "#7C3AED" : "#C4B5FD", 
                  color: "#fff", border: "none", borderRadius: 8, cursor: otpInput.length === 6 ? "pointer" : "not-allowed", 
                  fontWeight: 600, fontSize: 14
                }}>
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
import { useState } from "react";

export default function PhoneAuthWeb() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [message, setMessage] = useState("");

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        "recaptcha-container",
        {
          size: "invisible", // or 'normal'
          callback: (response) => {
            console.log("reCAPTCHA resolved:", response);
          },
        },
        auth
      );
    }
  };

  const sendOtp = async () => {
    setupRecaptcha();
    const appVerifier = window.recaptchaVerifier;

    try {
      const result = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmationResult(result);
      setMessage("OTP sent!");
    } catch (error) {
      setMessage(`Error sending OTP: ${error.message}`);
    }
  };

  const verifyOtp = async () => {
    if (!confirmationResult) return;

    try {
      await confirmationResult.confirm(otp);
      setMessage("✅ Phone authentication successful!");
    } catch (error) {
      setMessage(`❌ Error verifying OTP: ${error.message}`);
    }
  };

  return (
    <div>
      <h3>Phone Auth (Web)</h3>
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+92xxxxxxxxxx"
      />
      <button onClick={sendOtp}>Send OTP</button>

      {confirmationResult && (
        <>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
          />
          <button onClick={verifyOtp}>Verify</button>
        </>
      )}

      <div id="recaptcha-container"></div>
      <p>{message}</p>
    </div>
  );
}

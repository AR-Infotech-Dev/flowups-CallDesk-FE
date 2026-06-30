import AuthVisualShell from "./AuthVisualShell";
import VerificationForm from "./forms/VerificationForm";

const Verification = () => {
  return (
    <AuthVisualShell
      title="Verification"
      subtitle="Enter the code and set your new password."
    >
      <VerificationForm />
    </AuthVisualShell>
  );
};

export default Verification;

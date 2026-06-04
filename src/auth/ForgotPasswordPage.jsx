import Spinner from "../components/ui/Spinner";

function ForgotPasswordPage({
  formData,
  error,
  helperText,
  onChange,
  onSubmit,
  onBack,
  loading = false,
}) {
  return (
    <div className="flex flex-col md:flex-row h-screen">
      <div className="hidden md:flex md:w-[42%] items-center justify-center p-10 bg-brand-primary text-white" />

      <div className="w-full md:w-[58%] flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold text-[#172b4d] mb-2">
            Forgot Password
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Enter your email to receive a verification code.
          </p>

          <form onSubmit={onSubmit}>
            <div className="mb-4">
              <input
                className="bg-[#e9ebf4] border-none rounded-md p-3 text-sm w-full text-[#172b4d] placeholder:text-[#172b4d]/50"
                type="email"
                name="email"
                value={formData.email}
                onChange={onChange}
                placeholder="Email address"
                autoComplete="off"
                disabled={loading}
              />
            </div>

            {error ? (
              <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                {error}
              </div>
            ) : null}
            {helperText ? (
              <div className="mb-4 rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
                {helperText}
              </div>
            ) : null}

            <button
              type="submit"
              className="w-full bg-brand-primary text-white py-2 rounded-md hover:bg-primary/90 font-medium text-sm mb-4 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading}
            >
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Spinner />
                  Sending...
                </span>
              ) : (
                "Send Verification"
              )}
            </button>

            <button
              type="button"
              className="w-full rounded-md border border-gray-200 bg-white py-2 text-sm font-medium text-[#172b4d] hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70"
              onClick={onBack}
              disabled={loading}
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;

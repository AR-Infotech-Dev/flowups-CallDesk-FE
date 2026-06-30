import { useState } from "react";
import { useParams } from "react-router-dom";
import { makeRequest } from "../api/httpClient";

export default function FeedbackPage() {
  const { ticket_id, token } = useParams();
  const [formData, setFormData] = useState({
    rating: "",
    is_resolved: "yes",
    comment: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  /* =====================================
     HANDLE CHANGE
  ===================================== */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =====================================
     HANDLE STAR CLICK
  ===================================== */
  const handleRating = (value) => {
    setFormData((prev) => ({
      ...prev,
      rating: value,
    }));
  };

  /* =====================================
     SUBMIT
  ===================================== */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.rating) {
      setError("Please select rating");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const res = await makeRequest("/feedback/submit", {
        method: "POST",
        body: {
          ticket_id: Number(ticket_id),
          token:token,
          ...formData,
        },
      });

      if (res.success) {
        setSubmitted(true);
      } else {
        setError(res.message || "Unable to submit feedback");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* =====================================
     SUCCESS
  ===================================== */
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800">
            Thank You!
          </h2>
          <p className="text-gray-600 mt-3">
            Your feedback has been submitted successfully.
          </p>
        </div>
      </div>
    );
  }

  /* =====================================
     FORM
  ===================================== */
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 px-6 py-5">
          <h1 className="text-white text-2xl font-bold">
            Customer Ticket Feedback
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            Ticket #TKT-{ticket_id}
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              How would you rate our service?
            </label>

            <div className="flex gap-2 h-5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => handleRating(star)}
                  className={` transition ${Number(formData.rating) >= star
                      ? "text-yellow-400"
                      : "text-gray-300"
                    }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Resolved */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Was your issue resolved?
            </label>

            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="is_resolved"
                  value="yes"
                  checked={formData.is_resolved === "yes"}
                  onChange={handleChange}
                />
                Yes
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="is_resolved"
                  value="no"
                  checked={formData.is_resolved === "no"}
                  onChange={handleChange}
                />
                No
              </label>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Additional Comments
            </label>

            <textarea
              name="comment"
              rows="5"
              value={formData.comment}
              onChange={handleChange}
              placeholder="Share your experience..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Feedback"}
          </button>
        </form>
      </div>
    </div>
  );
}
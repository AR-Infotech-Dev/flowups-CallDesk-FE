import { useState } from "react";
import { useParams } from "react-router-dom";
import { makeRequest } from "../api/httpClient";
import { getCurrentVisitLocation } from "../utils/visitLocation";

const MARK_VISIT_ENDPOINT = "/tickets/visits/customer-confirm";

export default function MarkVisit() {
  const { visit_id, token } = useParams();
  const [formData, setFormData] = useState({
    customer_name: "",
    comment: "",
    visit_done: "yes",
  });
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const captureLocation = async () => {
    try {
      setLocationLoading(true);
      setError("");
      const currentLocation = await getCurrentVisitLocation();
      setLocation(currentLocation);
    } catch (locationError) {
      setLocation(null);
      setError(locationError.message || "Location permission is required.");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.customer_name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!location) {
      setError("Please allow location before confirming the visit.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await makeRequest(MARK_VISIT_ENDPOINT, {
        method: "POST",
        body: {
          visit_id: Number(visit_id),
          token,
          customer_name: formData.customer_name.trim(),
          visit_done: formData.visit_done,
          comment: formData.comment.trim(),
          ...location,
        },
      });

      if (response?.success) {
        setSubmitted(true);
        return;
      }

      setError(response?.message || response?.msg || "Unable to confirm visit.");
    } catch (submitError) {
      setError(submitError?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700">
            OK
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Visit Confirmed</h2>
          <p className="text-gray-600 mt-3">
            Thank you. Your visit confirmation has been submitted successfully.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="bg-blue-700 px-6 py-5">
          <h1 className="text-2xl font-bold text-white">Confirm Visit</h1>
          <p className="mt-1 text-sm text-blue-100">Visit #{visit_id}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Your Name
            </label>
            <input
              type="text"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleChange}
              placeholder="Enter your name"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-3 block text-sm font-semibold text-gray-700">
              Was the visit completed?
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="visit_done"
                  value="yes"
                  checked={formData.visit_done === "yes"}
                  onChange={handleChange}
                />
                Yes
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="visit_done"
                  value="no"
                  checked={formData.visit_done === "no"}
                  onChange={handleChange}
                />
                No
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-700">Location Proof</p>
                <p className="mt-1 text-xs text-gray-500">
                  Location is required to confirm this visit.
                </p>
              </div>
              <button
                type="button"
                onClick={captureLocation}
                disabled={locationLoading || loading}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {locationLoading ? "Getting..." : location ? "Refresh Location" : "Allow Location"}
              </button>
            </div>

            {location ? (
              <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                Location captured. Accuracy: {Math.round(location.visited_location_accuracy || 0)}m
              </div>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Comment
            </label>
            <textarea
              name="comment"
              rows="4"
              value={formData.comment}
              onChange={handleChange}
              placeholder="Add any comment about this visit"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error ? (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading || locationLoading}
            className="w-full rounded-xl bg-blue-700 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Confirm Visit"}
          </button>
        </form>
      </div>
    </div>
  );
}

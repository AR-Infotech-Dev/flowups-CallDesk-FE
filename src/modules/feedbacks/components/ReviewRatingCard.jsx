import { AlertCircle, Star } from "lucide-react";

const RATING_KEYS = [
  [5, "five_star", "five_star_percent"],
  [4, "four_star", "four_star_percent"],
  [3, "three_star", "three_star_percent"],
  [2, "two_star", "two_star_percent"],
  [1, "one_star", "one_star_percent"],
];

const clampPercent = (value) => Math.min(100, Math.max(0, Number(value) || 0));

const ReviewRatingCard = ({ ratingSummary = {}, loading = false, error = "", className = "" }) => {
  const totalReviews = Number(ratingSummary?.total_reviews ?? 0);
  const averageRating = Number(ratingSummary?.average_rating ?? 0);
  const ratings = RATING_KEYS.map(([star, countKey, percentKey]) => ({
    star,
    count: Number(ratingSummary?.[countKey] ?? 0),
    percent: clampPercent(ratingSummary?.[percentKey]),
  }));

  return (
    <section className={`flex w-full min-w-0 flex-col rounded-sm border border-slate-200 bg-white p-4 shadow-xs ${className}`} aria-labelledby="review-rating-heading">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 id="review-rating-heading" className="text-sm font-semibold text-slate-800">Rating breakdown</h2>
          <p className="mt-1 text-xs text-slate-400">Distribution across all reviews</p>
        </div>
        {!loading ? (
          <div className="text-right">
            <div className="flex items-center justify-end gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
              <span className="text-lg font-bold tabular-nums text-slate-800">{averageRating.toFixed(1)}</span>
            </div>
            <p className="text-[11px] text-slate-400">{totalReviews.toLocaleString()} total</p>
          </div>
        ) : <div className="h-9 w-16 animate-pulse rounded bg-slate-200" />}
      </div>

      {!loading && error ? (
        <div className="mt-3 flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600" role="alert">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="mt-4 space-y-3.5">
        {ratings.map(({ star, count, percent }) => (
          <div key={star} className="grid grid-cols-[32px_minmax(70px,1fr)_72px] items-center gap-2.5">
            {loading ? (
              <>
                <div className="h-4 w-7 animate-pulse rounded bg-slate-200" />
                <div className="h-2 w-full animate-pulse rounded-full bg-slate-200" />
                <div className="ml-auto h-4 w-14 animate-pulse rounded bg-slate-200" />
              </>
            ) : (
              <>
                <span className="flex items-center gap-1 text-xs font-semibold tabular-nums text-slate-600">
                  {star}<Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                </span>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100" aria-label={`${star} star reviews: ${percent}%`}>
                  <div className="h-full rounded-full bg-blue-500 transition-[width] duration-500" style={{ width: `${percent}%` }} />
                </div>
                <span className="whitespace-nowrap text-right text-xs tabular-nums text-slate-500">
                  {count.toLocaleString()} <span className="text-slate-400">({percent}%)</span>
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default ReviewRatingCard;

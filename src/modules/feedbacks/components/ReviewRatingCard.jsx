import { Star } from "lucide-react";

const DEFAULT_RATING_SUMMARY = {
  total_reviews: 0,
  average_rating: 0,

  five_star: 0,
  five_star_percent: 0,

  four_star: 0,
  four_star_percent: 0,

  three_star: 0,
  three_star_percent: 0,

  two_star: 0,
  two_star_percent: 0,

  one_star: 0,
  one_star_percent: 0,
};

const ReviewRatingCard = ({
  ratingSummary = {},
  loading = false,
  error = "",
  className = "",
}) => {
  const summary = {
    ...DEFAULT_RATING_SUMMARY,
    ...ratingSummary,
  };

  const ratingData = [
    {
      star: 5,
      count: Number(summary.five_star ?? 0),
      percent: Number(summary.five_star_percent ?? 0),
    },
    {
      star: 4,
      count: Number(summary.four_star ?? 0),
      percent: Number(summary.four_star_percent ?? 0),
    },
    {
      star: 3,
      count: Number(summary.three_star ?? 0),
      percent: Number(summary.three_star_percent ?? 0),
    },
    {
      star: 2,
      count: Number(summary.two_star ?? 0),
      percent: Number(summary.two_star_percent ?? 0),
    },
    {
      star: 1,
      count: Number(summary.one_star ?? 0),
      percent: Number(summary.one_star_percent ?? 0),
    },
  ];

  const totalReviews = Number(summary.total_reviews ?? 0);

  return (
    <div
      className={`
        flex min-h-[400px] w-full min-w-0 flex-col gap-2
        rounded-md border border-slate-100
        bg-white p-4 shadow-sm md:p-5
        ${className}
      `}
    >
      {/* Header */}
      <div className="mb-6 flex min-h-[26px] items-center justify-between">
        <h2 className="text-[17px] font-semibold text-gray-600">
          Review Rating
        </h2>
      </div>

      {/* API error */}
      {!loading && error && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* Rating List */}
      <div className="space-y-10">
        {ratingData.map((item) => (
          <div
            key={item.star}
            className="
              grid min-h-[20px]
              grid-cols-[42px_80px_minmax(80px,1fr)_75px]
              items-center gap-2
            "
          >
            {loading ? (
              <>
                {/* Rating number skeleton */}
                <div className="h-4 w-7 animate-pulse rounded bg-slate-200" />

                {/* Stars skeleton */}
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((starNumber) => (
                    <div
                      key={starNumber}
                      className="h-3.5 w-3.5 animate-pulse rounded bg-slate-200"
                    />
                  ))}
                </div>

                {/* Progress bar skeleton */}
                <div className="h-2.5 w-full animate-pulse rounded-full bg-slate-200" />

                {/* Count skeleton */}
                <div className="ml-auto h-4 w-[65px] animate-pulse rounded bg-slate-200" />
              </>
            ) : (
              <>
                {/* Rating number */}
                <span className="text-sm font-medium text-gray-500">
                  {item.star}★
                </span>

                {/* Stars */}
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((starNumber) => (
                    <Star
                      key={starNumber}
                      size={14}
                      className={
                        starNumber <= item.star
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-200"
                      }
                    />
                  ))}
                </div>

                {/* Progress bar */}
                <div className="h-2.5 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="
                      h-full rounded-full bg-blue-500
                      transition-all duration-500
                    "
                    style={{
                      width: `${Math.min(
                        Math.max(item.percent, 0),
                        100
                      )}%`,
                    }}
                  />
                </div>

                {/* Count and percentage */}
                <span className="whitespace-nowrap text-right text-sm text-gray-500">
                  {item.count} ({item.percent}%)
                </span>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-auto min-h-[50px] border-t border-gray-200 pt-5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-600">
            Total Reviews
          </span>

          {loading ? (
            <div className="h-6 w-14 animate-pulse rounded bg-slate-200" />
          ) : (
            <span className="text-lg font-bold text-[#014aad]">
              {totalReviews}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewRatingCard;
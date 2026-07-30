import { Star } from "lucide-react";

const FeedbackTable = ({
  rows = [],
  loading = false,
  className = "",
}) => {
  return (
    <div
      className={`
        h-[452px] w-full min-w-0 overflow-hidden
        rounded-md border border-slate-100
        bg-white shadow-sm
        ${className}
      `}
    >
      {/* Header नेहमी दिसेल */}
      <div className="flex h-[52px] items-center justify-between px-5">
        <h2 className="text-lg font-semibold text-[#27364B]">
          Recent Feedback
        </h2>

        <button
          type="button"
          className="text-sm font-medium text-blue-600"
        >
          View all reviews
        </button>
      </div>

      {/* Loading आणि data दोन्हीसाठी height समान */}
      <div className="h-[400px] w-full overflow-y-auto">
        {loading ? (
          /* Direct table data skeleton */
          <div className="animate-pulse">
            {Array.from({ length: 7 }).map((_, index) => (
              <div
                key={index}
                className="
                  grid min-h-[50px] w-full grid-cols-1
                  items-center gap-3 px-5 py-2
                  md:grid-cols-2
                  xl:grid-cols-[minmax(190px,1.2fr)_minmax(220px,1.5fr)_minmax(130px,0.8fr)_minmax(120px,0.7fr)]
                "
              >
                {/* Customer skeleton */}
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200" />

                  <div className="space-y-2">
                    <div className="h-3.5 w-28 rounded bg-slate-200" />
                    <div className="h-3 w-36 rounded bg-slate-200" />
                  </div>
                </div>

                {/* Rating and comment skeleton */}
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map(
                      (_, starIndex) => (
                        <div
                          key={starIndex}
                          className="h-4 w-4 rounded bg-slate-200"
                        />
                      )
                    )}
                  </div>

                  <div className="h-3.5 w-4/5 rounded bg-slate-200" />
                </div>

                {/* Assignee skeleton */}
                <div className="space-y-2">
                  <div className="h-3 w-16 rounded bg-slate-200" />
                  <div className="h-3.5 w-24 rounded bg-slate-200" />
                </div>

                {/* Date skeleton */}
                <div className="flex xl:justify-end">
                  <div className="h-3.5 w-28 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : rows.length > 0 ? (
          rows.map((item, index) => (
            <div
              key={item.feedback_id || index}
              className="
                grid min-h-[50px] w-full grid-cols-1
                items-center gap-3 px-5 py-2
                md:grid-cols-2
                xl:grid-cols-[minmax(190px,1.2fr)_minmax(220px,1.5fr)_minmax(130px,0.8fr)_minmax(120px,0.7fr)]
              "
            >
              {/* Customer */}
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500 text-sm font-semibold text-white">
                  {item.client_id
                    ?.charAt(0)
                    ?.toUpperCase() || "?"}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#27364B]">
                    {item.client_id || "-"}
                  </p>

                  <p className="truncate text-xs text-gray-500">
                    Ticket: {item.ticket_id || "-"}
                  </p>
                </div>
              </div>

              {/* Rating and feedback */}
              <div className="min-w-0">
                <div className="mb-1 flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      className={
                        star <= Number(item.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-300"
                      }
                    />
                  ))}
                </div>

                <p className="truncate text-sm text-[#5E636E]">
                  {item.comment || "-"}
                </p>
              </div>

              {/* Assignee */}
              <div>
                <p className="text-xs text-gray-400">
                  Assignee
                </p>

                <p className="mt-1 truncate text-sm text-gray-600">
                  {item.assignee_name ||
                    item.client_id ||
                    "-"}
                </p>
              </div>

              {/* Date */}
              <div className="text-left xl:text-right">
                <p className="text-xs text-gray-500">
                  {item.submitted_at || "-"}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <p className="text-sm text-gray-400">
              No feedback available
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackTable;
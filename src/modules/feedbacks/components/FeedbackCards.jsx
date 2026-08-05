import { Frown, MessageSquareText, Smile, Star } from "lucide-react";

const CARD_STYLES = {
  blue: "bg-blue-50 text-blue-600 ring-blue-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  orange: "bg-orange-50 text-orange-600 ring-orange-100",
};

const FeedbackCards = ({ ratingSummary = {}, loading = false }) => {
  const totalReviews = Number(ratingSummary?.total_reviews ?? 0);
  const averageRating = Number(ratingSummary?.average_rating ?? 0);
  const positiveCount = Number(ratingSummary?.five_star ?? 0) + Number(ratingSummary?.four_star ?? 0);
  const attentionCount = Number(ratingSummary?.one_star ?? 0) + Number(ratingSummary?.two_star ?? 0);
  const percentage = (count) => (totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0);

  const cards = [
    { title: "Average rating", value: averageRating.toFixed(1), subtitle: "out of 5", icon: Star, tone: "amber" },
    { title: "Total reviews", value: totalReviews.toLocaleString(), subtitle: "all time", icon: MessageSquareText, tone: "blue" },
    { title: "Positive", value: `${percentage(positiveCount)}%`, subtitle: `${positiveCount.toLocaleString()} reviews`, icon: Smile, tone: "emerald" },
    { title: "Needs attention", value: `${percentage(attentionCount)}%`, subtitle: `${attentionCount.toLocaleString()} reviews`, icon: Frown, tone: "orange" },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 px-3 py-2 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ title, value, subtitle, icon: Icon, tone }) => (
        <article key={title} className="flex min-h-[88px] items-center gap-3 rounded-sm border border-slate-200 bg-white px-4 py-3 shadow-xs">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ${CARD_STYLES[tone]}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">{title}</p>
            {loading ? (
              <div className="mt-2 h-5 w-16 animate-pulse rounded bg-slate-200" />
            ) : (
              <p className="mt-0.5 text-xl font-bold leading-none tabular-nums text-slate-800">{value}</p>
            )}
            <p className="mt-1 truncate text-[11px] text-slate-400">{loading ? "Loading…" : subtitle}</p>
          </div>
        </article>
      ))}
    </div>
  );
};

export default FeedbackCards;

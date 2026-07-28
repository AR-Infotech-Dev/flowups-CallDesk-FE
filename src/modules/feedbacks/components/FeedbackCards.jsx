import {
  Star,
  MessageSquare,
  Smile,
  Frown,
} from "lucide-react";

const FeedbackCards = ({
  ratingSummary = {},
  loading = false,
}) => {
  const totalReviews = Number(
    ratingSummary?.total_reviews ?? 0
  );

  const averageRating = Number(
    ratingSummary?.average_rating ?? 0
  );

  const fiveStar = Number(
    ratingSummary?.five_star ?? 0
  );

  const fourStar = Number(
    ratingSummary?.four_star ?? 0
  );

  const twoStar = Number(
    ratingSummary?.two_star ?? 0
  );

  const oneStar = Number(
    ratingSummary?.one_star ?? 0
  );

  // 4 आणि 5 star positive feedback
  const positiveCount = fiveStar + fourStar;

  // 1 आणि 2 star needs attention
  const attentionCount = oneStar + twoStar;

  const positivePercent =
    totalReviews > 0
      ? Math.round(
          (positiveCount / totalReviews) * 100
        )
      : 0;

  const attentionPercent =
    totalReviews > 0
      ? Math.round(
          (attentionCount / totalReviews) * 100
        )
      : 0;

  const cards = [
    {
      title: "Average Rating",
      value: averageRating.toFixed(1),
      subtitle: "Out of 5",
      icon: Star,
      color: "bg-blue-200",
      iconColor: "text-blue-400",
      showStar: true,
    },
    {
      title: "Total Reviews",
      value: totalReviews.toLocaleString(),
      subtitle: "All time",
      icon: MessageSquare,
      color: "bg-blue-200",
      iconColor: "text-blue-600",
    },
    {
      title: "Positive",
      value: `${positivePercent}%`,
      subtitle: `${positiveCount} reviews`,
      icon: Smile,
      color: "bg-green-200",
      iconColor: "text-green-500",
    },
    {
      title: "Needs Attention",
      value: `${attentionPercent}%`,
      subtitle: `${attentionCount} reviews`,
      icon: Frown,
      color: "bg-orange-200",
      iconColor: "text-orange-500",
    },
  ];

  return (
    <div className="mb-2 grid grid-cols-1 gap-2 px-5 py-2 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        
        return (
          <div
            key={card.title}
            className="
              min-h-fit w-full rounded-lg
              border border-slate-100 bg-white
              px-4 py-2 shadow-sm
              transition hover:shadow-md
            "
          >
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div
                className={`
                  flex h-8 w-8 shrink-0
                  items-center justify-center
                  rounded-full
                  ${card.color}
                `}
              >
                <Icon
                  className={`h-4 w-4 ${card.iconColor}`}
                />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-500">
                  {card.title}
                </p>

                <div className="my-0.5 flex items-center gap-2">
                  <h6 className="text-sm font-extrabold text-slate-800">
                    {loading ? "..." : card.value}
                  </h6>

                  {card.showStar && !loading && (
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  )}
                </div>

                <p className="truncate text-xs text-gray-400">
                  {loading
                    ? "Loading..."
                    : card.subtitle}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FeedbackCards;
// import {
//   Star,
//   MessageSquare,
//   Smile,
//   Frown,
// } from "lucide-react";

// const FeedbackCards = ({
//   summary = {},
//   loading = false,
// }) => {
//   const cards = [
//     {
//       title: "Average Rating",
//       value: summary.average_rating ?? 0,
//       subtitle: "Out of 5",
//       icon: Star,
//       iconBg: "bg-blue-100",
//       iconColor: "text-[#014aad]",
//     },
//     {
//       title: "Total Reviews",
//       value: summary.total_reviews ?? 0,
//       subtitle: "All time",
//       icon: MessageSquare,
//       iconBg: "bg-blue-100",
//       iconColor: "text-[#014aad]",
//     },
//     {
//       title: "Positive",
//       value: `${summary.positive_percent ?? 0}%`,
//       subtitle: `${summary.positive_reviews ?? 0} reviews`,
//       icon: Smile,
//       iconBg: "bg-green-100",
//       iconColor: "text-green-500",
//     },
//     {
//       title: "Needs Attention",
//       value: `${summary.needs_attention_percent ?? 0}%`,
//       subtitle: `${summary.needs_attention_reviews ?? 0} reviews`,
//       icon: Frown,
//       iconBg: "bg-orange-100",
//       iconColor: "text-orange-500",
//     },
//   ];

//   return (
//     <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
//       {cards.map((card) => {
//         const Icon = card.icon;

//         return (
//           <div
//             key={card.title}
//             className="
//               h-[130px] w-full min-w-0
//               rounded-md border border-slate-100
//               bg-white p-4 shadow-sm
//             "
//           >
//             <div className="flex h-full items-center justify-between gap-4">
//               <div className="min-w-0">
//                 {/* Title नेहमी दिसेल */}
//                 <p className="mb-2 text-sm font-medium text-gray-500">
//                   {card.title}
//                 </p>

//                 {/* फक्त backend data skeleton होईल */}
//                 {loading ? (
//                   <div className="animate-pulse space-y-2">
//                     <div className="h-7 w-20 rounded bg-slate-200" />
//                     <div className="h-3 w-24 rounded bg-slate-200" />
//                   </div>
//                 ) : (
//                   <div className="space-y-1">
//                     <h3 className="text-2xl font-semibold text-[#27364B]">
//                       {card.value}
//                     </h3>

//                     <p className="text-xs text-gray-400">
//                       {card.subtitle}
//                     </p>
//                   </div>
//                 )}
//               </div>

//               {/* Icon नेहमी दिसेल */}
//               <div
//                 className={`
//                   flex h-11 w-11 shrink-0 items-center
//                   justify-center rounded-full
//                   ${card.iconBg}
//                 `}
//               >
//                 <Icon className={`h-5 w-5 ${card.iconColor}`} />
//               </div>
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// };

// export default FeedbackCards;
import { Star, TrendingUp, Users } from "lucide-react";

export default function FeedbackSummaryCard({ avgRating, totalReviews }) {
  const ratingPercentage = (parseFloat(avgRating) / 5) * 100;
  
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--color-text)]">
          Overall Rating
        </h3>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="text-center">
          <span className="text-4xl font-bold text-[var(--color-text)]">{avgRating}</span>
          <span className="text-lg text-[var(--color-text-muted)]">/5</span>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={24}
                className={`${
                  star <= Math.round(parseFloat(avgRating))
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          
          <div className="w-full h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${ratingPercentage}%` }}
            />
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex items-center gap-2 text-[var(--color-text-secondary)]">
        <Users className="w-4 h-4" />
        <span className="text-sm">
          Based on <strong className="text-[var(--color-text)]">{totalReviews}</strong> {totalReviews === 1 ? "review" : "reviews"}
        </span>
      </div>
    </div>
  );
}

const Star = ({ filled }) => (
  <svg
    className={`w-4 h-4 ${filled ? "text-yellow-400" : "text-gray-300"}`}
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M12 2l2.9 6.6 7.1.6-5.3 4.6 1.6 7-6.3-3.7-6.3 3.7 1.6-7L2 9.2l7.1-.6L12 2z" />
  </svg>
);

export default function ReviewCard({
  name,
  role,
  rating,
  review,
  avatar,
  date,
}) {
  return (
    <article className="bg-white rounded-xl shadow-md p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <img
            src={avatar || "/images/default_img.webp"}
            alt={name}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/images/default_img.webp";
            }}

          />
          <div>
            <p className="font-medium text-gray-900">{name}</p>
            <p className="text-sm text-gray-500">{role}</p>
          </div>
        </div>

        {date && (
          <time className="text-xs text-gray-400 whitespace-nowrap">
            {date}
          </time>
        )}
      </div>

      {/* Rating */}
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} filled={i <= rating} />
        ))}
      </div>

      {/* Review */}
      <p className="text-gray-600 text-sm leading-relaxed">
        “{review}”
      </p>
    </article>
  );
}

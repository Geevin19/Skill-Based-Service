import { FiStar } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';

export default function StarRating({ rating = 0, max = 5, size = 16, interactive = false, onChange }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <button
          key={i}
          type={interactive ? 'button' : undefined}
          onClick={() => interactive && onChange?.(i + 1)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
          disabled={!interactive}
        >
          {i < Math.round(rating)
            ? <FaStar size={size} className="text-yellow-400" />
            : <FiStar size={size} className="text-gray-300" />}
        </button>
      ))}
    </div>
  );
}

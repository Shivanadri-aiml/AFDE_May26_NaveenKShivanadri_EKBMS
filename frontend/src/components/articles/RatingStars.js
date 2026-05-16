import React, { useState } from 'react';
import { FiStar } from 'react-icons/fi';
import { rateArticle } from '../../services/articleService';
import { useAuth } from '../../context/AuthContext';

const RatingStars = ({ articleId, currentRating = 0, userRating = 0, totalRatings = 0, onRate }) => {
  const { isAuthenticated } = useAuth();
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedRating, setSelectedRating] = useState(userRating);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avgRating, setAvgRating] = useState(currentRating);
  const [ratingCount, setRatingCount] = useState(totalRatings);

  const handleRate = async (rating) => {
    if (!isAuthenticated || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await rateArticle(articleId, rating);
      setSelectedRating(rating);
      if (response.averageRating !== undefined) {
        setAvgRating(response.averageRating);
      }
      if (response.totalRatings !== undefined) {
        setRatingCount(response.totalRatings);
      }
      onRate && onRate(rating);
    } catch (error) {
      console.error('Rating failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoveredStar || selectedRating;

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= (displayRating || Math.round(avgRating));
          return (
            <button
              key={star}
              onClick={() => handleRate(star)}
              onMouseEnter={() => isAuthenticated && setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              disabled={!isAuthenticated || isSubmitting}
              className={`transition-all duration-100 ${
                isAuthenticated && !isSubmitting
                  ? 'cursor-pointer hover:scale-110'
                  : 'cursor-default'
              }`}
            >
              <FiStar
                size={20}
                className={`transition-colors ${
                  isFilled
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                } ${hoveredStar && star <= hoveredStar ? 'text-yellow-400 fill-current' : ''}`}
              />
            </button>
          );
        })}
      </div>
      <div className="flex items-center space-x-1 text-sm text-gray-600">
        <span className="font-semibold text-gray-800">
          {avgRating > 0 ? Number(avgRating).toFixed(1) : '0.0'}
        </span>
        <span className="text-gray-400">({ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'})</span>
      </div>
      {!isAuthenticated && (
        <span className="text-xs text-gray-400 italic">Login to rate</span>
      )}
      {selectedRating > 0 && (
        <span className="text-xs text-green-600 font-medium">Your rating: {selectedRating}/5</span>
      )}
    </div>
  );
};

export default RatingStars;

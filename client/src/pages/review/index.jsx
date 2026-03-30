import { memo, useEffect, useState } from "react";
import styles from "./index.module.css";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
const GOOGLE_PROFILE_URL =
  "https://www.google.com/search?q=minha+empresa&mat=CUnJg9Et2l2oEkwBTVDHnj3yaWq3Khm3N5mnDUf-Twj3ynO0wPbj_9_eefZ_tJJIyqA01sLLlDCaBuzZspcrqYi97q8e76Ru4z3nRmnT76zfxXNXNHXL&hl=pt-BR&authuser=0";

const fallbackReviewData = {
  placeUrl: GOOGLE_PROFILE_URL,
  rating: 5,
  totalReviews: 0,
  highlight:
    "Google reviews will appear here automatically after the Google Places configuration is connected.",
  reviews: [
    {
      id: 1,
      author: "Customer name",
      rating: 5,
      relativeTime: "Recent review",
      text: "Add a real Google review here to show service quality, communication, and finished results.",
      authorUri: "",
    },
    {
      id: 2,
      author: "Customer name",
      rating: 5,
      relativeTime: "Recent review",
      text: "Use this card for a review that mentions punctuality, clean installation, and professionalism.",
      authorUri: "",
    },
    {
      id: 3,
      author: "Customer name",
      rating: 5,
      relativeTime: "Recent review",
      text: "Add another review here highlighting tile work, flooring quality, or overall customer satisfaction.",
      authorUri: "",
    },
  ],
};

function ReviewStars({ rating }) {
  return (
    <div className={styles.stars} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={`star-${index}`}
          className={index < Math.round(rating) ? styles.starFilled : styles.star}
        >
          {"\u2605"}
        </span>
      ))}
    </div>
  );
}

function Review() {
  const [reviewData, setReviewData] = useState(fallbackReviewData);

  useEffect(() => {
    let isMounted = true;

    async function loadReviews() {
      try {
        const response = await fetch(`${API_BASE_URL}/reviews`);
        if (!response.ok) return;

        const data = await response.json();
        if (!isMounted) return;

        if (!Array.isArray(data.reviews) || data.reviews.length === 0) {
          setReviewData((current) => ({
            ...current,
            placeUrl: data.placeUrl || current.placeUrl,
            rating: data.rating || current.rating,
            totalReviews: data.totalReviews || 0,
            highlight:
              data.message ||
              "Google reviews will appear here automatically after the Google Places configuration is connected.",
          }));
          return;
        }

        setReviewData({
          placeUrl: data.placeUrl || GOOGLE_PROFILE_URL,
          rating: data.rating || 5,
          totalReviews: data.totalReviews || data.reviews.length,
          highlight: `Live Google reviews from ${data.businessName || "Conexion Services"}.`,
          reviews: data.reviews,
        });
      } catch (error) {
        console.error("Failed to load reviews:", error);
      }
    }

    loadReviews();

    return () => {
      isMounted = false;
    };
  }, []);

  const { placeUrl, rating, totalReviews, highlight, reviews } = reviewData;

  return (
    <section
      id="reviews"
      className={styles.reviewSection}
      aria-labelledby="reviews-title"
    >
      <div className={styles.reviewIntro}>
        <span className={styles.eyebrow}>Google Reviews</span>
        <h3 id="reviews-title">What clients say about Conexion Services</h3>
        <p>{highlight}</p>
      </div>

      <div className={styles.reviewSummary}>
        <div className={styles.ratingBlock}>
          <span className={styles.ratingValue}>{rating.toFixed(1)}</span>
          <ReviewStars rating={rating} />
          <span className={styles.reviewCount}>
            {totalReviews > 0
              ? `${totalReviews} Google reviews`
              : "Ready for your Google Business reviews"}
          </span>
        </div>

        <a
          className={styles.googleButton}
          href={placeUrl}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!placeUrl}
        >
          Open Google profile
        </a>
      </div>

      <div className={styles.reviewGrid}>
        {reviews.map((review) => (
          <article key={review.id} className={styles.reviewCard}>
            <div className={styles.reviewCardTop}>
              <div>
                {review.authorUri ? (
                  <a
                    className={styles.authorLink}
                    href={review.authorUri}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {review.author}
                  </a>
                ) : (
                  <strong>{review.author}</strong>
                )}
                <span>{review.relativeTime}</span>
              </div>
              <ReviewStars rating={review.rating} />
            </div>
            <p>{review.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default memo(Review);

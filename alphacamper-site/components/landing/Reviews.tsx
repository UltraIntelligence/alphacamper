const reviews = [
  {
    quote: "Every campsite I wanted was fully booked. Alphacamper found me a spot at Golden Ears within 3 days. Absolute lifesaver for our family trip.",
    name: "Sarah M.",
    detail: "BC Parks camper",
  },
  {
    quote: "I was skeptical at first but it actually works. Got an alert for Rathtrevor Beach on a Saturday morning and booked it within minutes.",
    name: "James T.",
    detail: "Weekend warrior",
  },
  {
    quote: "As a parent of three, I can't sit refreshing a booking page all day. Alphacamper does the watching for me. Worth every penny.",
    name: "Michelle K.",
    detail: "Ontario Parks camper",
  },
  {
    quote: "Signed up for the free plan just to try it. Got a notification the same week. Now I'm on the paid plan with 6 active watches.",
    name: "David L.",
    detail: "Algonquin regular",
  },
]

export function Reviews() {
  return (
    <section className="reviews-section">
      <h2>What campers are saying</h2>
      <div className="reviews-grid">
        {reviews.map((review, i) => (
          <div key={i} className="review-card">
            <div className="review-stars">★★★★★</div>
            <p className="review-quote">&ldquo;{review.quote}&rdquo;</p>
            <div className="review-author">
              <span className="review-name">{review.name}</span>
              <span className="review-detail">{review.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

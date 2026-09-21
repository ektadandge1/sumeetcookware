export function AnnouncementBar() {
  return (
    <div
      className="announcement-bar"
      role="region"
      aria-label="Store announcement"
    >
      <span aria-hidden="true">‹</span>
      <p>
        7% off All Products Minimum purchase of ₹3,000 Use the code: FESTIVE7
      </p>
      <span aria-hidden="true">›</span>
    </div>
  );
}

// campaign-atlas.jpg is a 4x2 sprite sheet (8 tiles) of illustrative
// creative-direction photography; each tile is cropped via background
// position rather than shipping 8 separate files.
const POSITIONS = [
  "0% 0%",
  "33.333% 0%",
  "66.666% 0%",
  "100% 0%",
  "0% 100%",
  "33.333% 100%",
  "66.666% 100%",
  "100% 100%",
];

export function CampaignArt({
  index,
  className = "",
  label = "Illustrative creative-direction photography",
}: {
  index: number;
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`bg-bg-elevated bg-no-repeat ${className}`}
      style={{
        backgroundImage: "url(/images/campaign-atlas.jpg)",
        backgroundSize: "400% 200%",
        backgroundPosition: POSITIONS[index % POSITIONS.length],
      }}
    />
  );
}

// creative-comparison.jpg is a single image split down the middle: left
// half illustrates manual production, right half illustrates Backlot.
export function ComparisonArt({
  side,
  className = "",
}: {
  side: "old" | "new";
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={
        side === "old"
          ? "Illustrative photo representing manual ad production"
          : "Illustrative photo representing the Backlot workflow"
      }
      className={`bg-bg-elevated bg-no-repeat ${className}`}
      style={{
        backgroundImage: "url(/images/creative-comparison.jpg)",
        backgroundSize: "200% 100%",
        backgroundPosition: side === "old" ? "0% 50%" : "100% 50%",
      }}
    />
  );
}

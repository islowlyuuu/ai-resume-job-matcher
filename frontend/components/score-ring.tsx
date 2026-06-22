type ScoreRingProps = {
  score: number;
};

export function ScoreRing({ score }: ScoreRingProps) {
  const degrees = Math.max(0, Math.min(100, score)) * 3.6;

  return (
    <div
      className="grid h-28 w-28 place-items-center rounded-full"
      style={{
        background: `conic-gradient(#b75f3d ${degrees}deg, #e7ded1 0deg)`
      }}
      aria-label={`Match score ${score}`}
    >
      <div className="grid h-20 w-20 place-items-center rounded-full bg-paper text-center">
        <span className="text-3xl font-semibold text-ink">{score}</span>
      </div>
    </div>
  );
}

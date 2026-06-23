type ScoreRingProps = {
  score: number;
};

export function ScoreRing({ score }: ScoreRingProps) {
  const degrees = Math.max(0, Math.min(100, score)) * 3.6;

  return (
    <div
      className="grid h-28 w-28 place-items-center rounded-full shadow-[inset_0_0_0_1px_rgba(31,27,24,0.06)]"
      style={{
        background: `conic-gradient(#b3654f ${degrees}deg, #e6ded7 0deg)`
      }}
      aria-label={`Match score ${score}`}
    >
      <div className="grid h-20 w-20 place-items-center rounded-full bg-[#fffdf9] text-center shadow-sm">
        <span className="text-3xl font-semibold text-ink">{score}</span>
      </div>
    </div>
  );
}

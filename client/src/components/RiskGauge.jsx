import { useEffect, useState } from 'react';

const RiskGauge = ({ score }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  // Map score to color
  const getColor = (s) => {
    if (s >= 70) return '#ef4444'; // critical (red)
    if (s >= 40) return '#f97316'; // high (orange)
    if (s >= 20) return '#eab308'; // moderate (yellow)
    return '#22c55e'; // safe (green)
  };

  const color = getColor(animatedScore);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  // Use a semicircle
  const strokeDashoffset = circumference - (animatedScore / 100) * (circumference / 2);

  return (
    <div style={{ position: 'relative', width: '200px', height: '110px', margin: '0 auto' }}>
      <svg width="200" height="110" viewBox="0 0 200 110" style={{ transform: 'rotate(180deg)' }}>
        {/* Background Arc */}
        <circle
          cx="100" cy="10" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={circumference / 2}
          strokeLinecap="round"
        />
        {/* Value Arc */}
        <circle
          cx="100" cy="10" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.5s ease-out, stroke 1.5s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute',
        top: '60px',
        left: '0',
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', fontWeight: 800, color: color, lineHeight: '1' }}>
          {animatedScore}
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '4px' }}>
          Risk Score
        </div>
      </div>
    </div>
  );
};

export default RiskGauge;

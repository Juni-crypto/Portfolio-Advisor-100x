import { DollarSign, PiggyBank, TrendingUp, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';

export const FloatingIcons = () => {
  const [positions, setPositions] = useState([
    { x: 0, y: 0, direction: 1 },
    { x: 20, y: 20, direction: -1 },
    { x: 40, y: 40, direction: 1 },
    { x: 60, y: 60, direction: -1 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPositions((prev) =>
        prev.map((pos) => ({
          x: pos.x,
          y: pos.y + pos.direction * 0.5,
          direction: pos.y > 50 ? -1 : pos.y < -50 ? 1 : pos.direction,
        }))
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none">
      <DollarSign
        className="absolute text-gold-400 w-8 h-8 transition-all duration-1000 opacity-30"
        style={{
          left: '10%',
          top: `${positions[0].y + 20}%`,
        }}
      />
      <PiggyBank
        className="absolute text-gold-400 w-8 h-8 transition-all duration-1000 opacity-30"
        style={{
          left: '30%',
          top: `${positions[1].y + 40}%`,
        }}
      />
      <TrendingUp
        className="absolute text-gold-400 w-8 h-8 transition-all duration-1000 opacity-30"
        style={{
          right: '30%',
          top: `${positions[2].y + 30}%`,
        }}
      />
      <Wallet
        className="absolute text-gold-400 w-8 h-8 transition-all duration-1000 opacity-30"
        style={{
          right: '10%',
          top: `${positions[3].y + 50}%`,
        }}
      />
    </div>
  );
};
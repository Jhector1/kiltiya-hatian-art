import React from 'react';

interface Achievement {
  label: string;
  threshold: number;
}

interface AchievementsProps {
  ordersPlaced: number;
}

const ACHIEVEMENTS: Achievement[] = [
  { label: 'First Purchase', threshold: 1 },
  { label: 'Supporter of Haitian Artists', threshold: 10 },
  { label: 'Top Collector', threshold: 20 },
];

export default function Achievements({ ordersPlaced }: AchievementsProps) {
  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Achievements</h3>
      <div className="flex flex-wrap gap-4">
        {ACHIEVEMENTS.map((ach, i) => {
          const unlocked = ordersPlaced >= ach.threshold;
          // alert(unlocked)
          return (
            <div
              key={i}
              className={
                `px-4 py-2 rounded-full font-medium shadow transition-opacity ` +
                (unlocked
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed')
              }
            >
              🏆 {ach.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

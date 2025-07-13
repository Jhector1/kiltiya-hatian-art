// components/Achievements.tsx
export default function Achievements({ achievements }: { achievements: string[] }) {
  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Achievements</h3>
      <div className="flex flex-wrap gap-4">
        {achievements.map((badge, i) => (
          <div key={i} className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-medium shadow">
            🏆 {badge}
          </div>
        ))}
      </div>
    </div>
  );
}
'use client';
export default function ProfileTabs({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  const tabs = ['Profile', 'Collections', 'Settings'];

  return (
    <div className="flex gap-4 mt-4 sm:mt-0">
      {tabs.map(tab => (
        <button
          key={tab}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

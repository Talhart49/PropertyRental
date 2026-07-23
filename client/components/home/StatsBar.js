"use client";

export default function StatsBar({ stats, loading, defaultStats }) {
  if (loading) {
    return (
      <section className="relative -mt-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-px rounded-2xl bg-surface-200 overflow-hidden shadow-lg lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white px-6 py-8 text-center animate-pulse"
              >
                <div className="h-8 w-20 bg-surface-200 rounded mx-auto" />
                <div className="h-4 w-24 bg-surface-200 rounded mt-3 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const displayStats = stats || defaultStats;

  return (
    <section className="relative -mt-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-px rounded-2xl bg-surface-200 overflow-hidden shadow-lg lg:grid-cols-4">
          {displayStats.map((stat, index) => (
            <div key={index} className="bg-white px-6 py-8 text-center">
              <p className="text-2xl font-bold text-brand-600">{stat.value}</p>
              <p className="mt-1 text-sm text-surface-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
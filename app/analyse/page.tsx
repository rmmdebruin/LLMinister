'use client';

import {
    MdBarChart,
    MdGridView,
    MdOutlineAccountCircle,
    MdOutlineLeaderboard,
    MdOutlinePieChart
} from 'react-icons/md';

const AnalysePage = () => {
  // Sample data for charts (in a real app, this would come from API/state)
  const partyCounts = [
    { party: 'CDA', count: 12 },
    { party: 'D66', count: 15 },
    { party: 'VVD', count: 8 },
    { party: 'PVV', count: 10 },
    { party: 'GL-PvdA', count: 18 },
    { party: 'CU', count: 6 },
    { party: 'SGP', count: 5 },
    { party: 'BBB', count: 7 },
    { party: 'NSC', count: 9 },
  ];

  const topicCounts = [
    { topic: 'Algemeen', count: 25 },
    { topic: 'Financiën', count: 15 },
    { topic: 'Personeel', count: 10 },
    { topic: 'Wettelijk kader', count: 18 },
    { topic: 'Implementatie', count: 12 },
    { topic: 'Europese zaken', count: 8 },
  ];

  const statusCounts = [
    { status: 'Draft', count: 45 },
    { status: 'Herschreven', count: 20 },
    { status: 'Definitief', count: 15 },
  ];

  const generateBarChart = (data: { [key: string]: any, count: number }[], labelKey: string) => {
    const maxCount = Math.max(...data.map(item => item.count));

    return (
      <div className="flex flex-col space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="w-24 text-sm font-medium text-slate-700 dark:text-slate-300">
              {item[labelKey]}
            </div>
            <div className="flex-1">
              <div className="h-6 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="w-10 text-right text-sm font-medium text-slate-600 dark:text-slate-400">
              {item.count}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const generateStatusDonut = () => {
    const total = statusCounts.reduce((sum, item) => sum + item.count, 0);
    let cumulative = 0;

    return (
      <div className="relative w-48 h-48 mx-auto">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {statusCounts.map((item, index) => {
            const percentage = (item.count / total) * 100;
            const startAngle = (cumulative / total) * 360;
            cumulative += item.count;
            const endAngle = (cumulative / total) * 360;
            const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

            // Calculate coordinates on the circle
            const startX = 50 + 40 * Math.cos((startAngle - 90) * (Math.PI / 180));
            const startY = 50 + 40 * Math.sin((startAngle - 90) * (Math.PI / 180));
            const endX = 50 + 40 * Math.cos((endAngle - 90) * (Math.PI / 180));
            const endY = 50 + 40 * Math.sin((endAngle - 90) * (Math.PI / 180));

            // Gradient colors for each status
            const colors = {
              'Draft': ['#60a5fa', '#3b82f6'],
              'Herschreven': ['#a78bfa', '#8b5cf6'],
              'Definitief': ['#34d399', '#10b981'],
            };

            // Pick the gradient for current status
            const [startColor, endColor] = colors[item.status as keyof typeof colors];

            return (
              <g key={index}>
                <defs>
                  <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={startColor} />
                    <stop offset="100%" stopColor={endColor} />
                  </linearGradient>
                </defs>
                <path
                  d={`M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
                  fill={`url(#gradient-${index})`}
                  stroke="#fff"
                  strokeWidth="0.5"
                />
              </g>
            );
          })}
          <circle cx="50" cy="50" r="20" fill="white" />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            {total}
          </div>
          <div className="text-xs text-slate-500">
            Totaal
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
          Analyse
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Overzicht en statistieken van parlementaire vragen gericht aan de minister.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 mr-3">
              <MdGridView className="text-xl" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Samenvatting
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
              <div className="text-slate-600 dark:text-slate-300 text-sm">Totaal aantal vragen</div>
              <div className="text-slate-800 dark:text-slate-200 font-semibold">80</div>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
              <div className="text-slate-600 dark:text-slate-300 text-sm">Beantwoorde vragen</div>
              <div className="text-slate-800 dark:text-slate-200 font-semibold">35</div>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
              <div className="text-slate-600 dark:text-slate-300 text-sm">Open vragen</div>
              <div className="text-slate-800 dark:text-slate-200 font-semibold">45</div>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
              <div className="text-slate-600 dark:text-slate-300 text-sm">Gemiddelde antwoordtijd</div>
              <div className="text-slate-800 dark:text-slate-200 font-semibold">3.2 dagen</div>
            </div>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center mb-5">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 mr-3">
              <MdOutlinePieChart className="text-xl" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Status Verdeling
            </h2>
          </div>

          <div>
            {generateStatusDonut()}

            <div className="mt-4 grid grid-cols-3 gap-2">
              {statusCounts.map((item, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full mb-1 ${
                    item.status === 'Draft' ? 'bg-blue-500' :
                    item.status === 'Herschreven' ? 'bg-purple-500' : 'bg-emerald-500'
                  }`}></div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">{item.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500 mr-3">
              <MdOutlineAccountCircle className="text-xl" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Top Vraagstellers
            </h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center p-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                1
              </div>
              <div>
                <div className="text-slate-800 dark:text-slate-200 font-medium">Joris Thijssen</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">GL-PvdA • 18 vragen</div>
              </div>
            </div>
            <div className="flex items-center p-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                2
              </div>
              <div>
                <div className="text-slate-800 dark:text-slate-200 font-medium">Joost Sneller</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">D66 • 15 vragen</div>
              </div>
            </div>
            <div className="flex items-center p-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                3
              </div>
              <div>
                <div className="text-slate-800 dark:text-slate-200 font-medium">Inge van Dijk</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">CDA • 12 vragen</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 mr-3">
              <MdBarChart className="text-xl" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Vragen per Partij
            </h2>
          </div>

          {generateBarChart(partyCounts, 'party')}
        </div>

        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 mr-3">
              <MdOutlineLeaderboard className="text-xl" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Vragen per Categorie
            </h2>
          </div>

          {generateBarChart(topicCounts, 'topic')}
        </div>
      </div>

      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
          Meest Recente Vragen
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vraag</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kamerlid</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Partij</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Datum</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {[1, 2, 3, 4, 5].map((_, index) => (
                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                    <div className="max-w-md truncate">
                      {index === 0 ? "Welke concrete maatregelen neemt het ministerie om de onafhankelijkheid van het Adviescollege Toetsing Regeldruk te waarborgen?" :
                       index === 1 ? "Kan de minister toelichten wat de rol van het ATR zal zijn bij het verminderen van administratieve lasten voor het MKB?" :
                       index === 2 ? "Hoe verhoudt de taak van het Adviescollege zich tot Europese regelgeving?" :
                       index === 3 ? "Zijn er plannen om de capaciteit van het Adviescollege uit te breiden gezien de hoge werkdruk?" :
                       "Wanneer verwacht de minister de eerste resultaten van het nieuwe werkprogramma van het ATR?"}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                    {index === 0 ? "Joost Sneller" :
                     index === 1 ? "Inge van Dijk" :
                     index === 2 ? "Pieter Grinwis" :
                     index === 3 ? "Rachel van Meetelen" :
                     "Folker Idsinga"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400">
                    {index === 0 ? "D66" :
                     index === 1 ? "CDA" :
                     index === 2 ? "CU" :
                     index === 3 ? "PVV" :
                     "NSC"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      index === 0 ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" :
                      index === 1 ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" :
                      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    }`}>
                      {index === 0 ? "Draft" :
                       index === 1 ? "Herschreven" :
                       "Definitief"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {index === 0 ? "05-03-2025" :
                     index === 1 ? "04-03-2025" :
                     index === 2 ? "04-03-2025" :
                     index === 3 ? "03-03-2025" :
                     "02-03-2025"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalysePage;
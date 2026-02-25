'use client';

import { useEffect, useMemo, useState } from 'react';

type Category = {
  key: string;
  label: string;
};

type LogFile = {
  id: string;
  name: string;
  category: string;
  service: string;
  distroPath: string;
  fallbackPath: string;
  size: string;
  lastUpdated: string;
  highlights: readonly string[];
  lines: readonly string[];
};

type LogInsight = {
  source: string;
  signal: string;
  level: string;
  count: number;
  latest: string;
};

type SortKey = 'source' | 'signal' | 'level' | 'count' | 'latest';

type Props = {
  categories: Category[];
  files: LogFile[];
  insights: LogInsight[];
  view: 'overview' | 'journal' | 'snapshot' | 'alerts';
};

function levelClass(level: string) {
  if (level.toLowerCase() === 'critical') return 'text-rose-700 bg-rose-50 border-rose-200';
  if (level.toLowerCase() === 'warning') return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-slate-700 bg-slate-100 border-slate-200';
}

function sortArrow(active: boolean, direction: 'asc' | 'desc') {
  if (!active) return '↕';
  return direction === 'asc' ? '↑' : '↓';
}

export default function LogsWorkbench({ categories, files, insights, view }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFileId, setSelectedFileId] = useState<string>(files[0]?.id ?? '');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('latest');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const filteredFiles = useMemo(() => {
    if (selectedCategory === 'all') return files;
    return files.filter((file) => file.category === selectedCategory);
  }, [files, selectedCategory]);

  const selectedFile = useMemo(
    () => filteredFiles.find((file) => file.id === selectedFileId) ?? filteredFiles[0],
    [filteredFiles, selectedFileId]
  );

  const renderedLines = useMemo(() => {
    if (!selectedFile) return [];
    const loweredSearch = searchTerm.trim().toLowerCase();

    return selectedFile.lines
      .map((line, index) => {
        const loweredLine = line.toLowerCase();
        const hitTerms = selectedFile.highlights.filter((term) => loweredLine.includes(term.toLowerCase()));
        const isSearchMatch = loweredSearch.length > 0 && loweredLine.includes(loweredSearch);

        if (!loweredSearch || isSearchMatch || hitTerms.length > 0) {
          return {
            line,
            lineNumber: index + 1,
            hitTerms,
            isSearchMatch
          };
        }

        return null;
      })
      .filter((entry): entry is { line: string; lineNumber: number; hitTerms: readonly string[]; isSearchMatch: boolean } => Boolean(entry));
  }, [searchTerm, selectedFile]);

  const sortedInsights = useMemo(() => {
    return [...insights].sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      if (sortKey === 'count') return (a.count - b.count) * direction;

      const left = String(a[sortKey]).toLowerCase();
      const right = String(b[sortKey]).toLowerCase();
      if (left < right) return -1 * direction;
      if (left > right) return 1 * direction;
      return 0;
    });
  }, [insights, sortDirection, sortKey]);


  useEffect(() => {
    if (view === 'journal') {
      setSelectedCategory('system');
      const systemLog = files.find((file) => file.id === 'boot-log') ?? files[0];
      if (systemLog) setSelectedFileId(systemLog.id);
      setSortKey('latest');
      setSortDirection('desc');
      return;
    }

    if (view === 'snapshot') {
      setSelectedCategory('all');
      setSortKey('count');
      setSortDirection('desc');
      return;
    }

    if (view === 'alerts') {
      setSelectedCategory('security');
      const secureLog = files.find((file) => file.id === 'secure-log') ?? files[0];
      if (secureLog) setSelectedFileId(secureLog.id);
      setSortKey('level');
      setSortDirection('asc');
      return;
    }

    setSelectedCategory('all');
  }, [files, view]);

  const setSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDirection(key === 'count' ? 'desc' : 'asc');
  };

  return (
    <section className="space-y-4">
      <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">
        {view === 'overview' && <p>Overview mode: sammanställd signalbild för alla loggar.</p>}
        {view === 'journal' && <p>Journal query mode: fokus på system- och bootrelaterade händelser.</p>}
        {view === 'snapshot' && <p>Snapshot export mode: sorterar signaler efter volym för snabb exportprioritering.</p>}
        {view === 'alerts' && <p>Alert rules mode: fokus på security-signaler och avvikelser.</p>}
      </div>

      <div className="machine-summary-grid">
        <article className="machine-summary-card"><p>Total signals (24h)</p><strong>{insights.reduce((sum, item) => sum + item.count, 0)}</strong></article>
        <article className="machine-summary-card"><p>Critical events</p><strong className="text-rose-700">{insights.filter((item) => item.level === 'Critical').length}</strong></article>
        <article className="machine-summary-card"><p>Available log files</p><strong>{files.length}</strong></article>
        <article className="machine-summary-card"><p>Categories</p><strong>{categories.length}</strong></article>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-800">Filter logs</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-md border px-3 py-1 text-sm ${selectedCategory === 'all' ? 'border-sky-300 bg-sky-50 text-sky-800' : 'border-slate-200 bg-white text-slate-700'}`}
            onClick={() => setSelectedCategory('all')}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              type="button"
              key={category.key}
              className={`rounded-md border px-3 py-1 text-sm ${selectedCategory === category.key ? 'border-sky-300 bg-sky-50 text-sky-800' : 'border-slate-200 bg-white text-slate-700'}`}
              onClick={() => {
                setSelectedCategory(category.key);
                const firstInCategory = files.find((file) => file.category === category.key);
                if (firstInCategory) setSelectedFileId(firstInCategory.id);
              }}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[320px,1fr]">
        <article className="rounded-md border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-800">Log files</h3>
          <div className="mt-3 space-y-2">
            {filteredFiles.map((file) => (
              <button
                type="button"
                key={file.id}
                onClick={() => setSelectedFileId(file.id)}
                className={`w-full rounded-md border p-3 text-left text-sm ${selectedFile?.id === file.id ? 'border-sky-300 bg-sky-50' : 'border-slate-200 bg-white'}`}
              >
                <p className="font-medium text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-500">{file.service} · {file.size}</p>
                <p className="text-xs text-slate-500">Updated: {file.lastUpdated}</p>
              </button>
            ))}
          </div>
        </article>

        <article className="rounded-md border border-slate-200 bg-white p-4">
          {selectedFile ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">{selectedFile.name}</h3>
                  <p className="text-xs text-slate-500">Primary path: <code>{selectedFile.distroPath}</code></p>
                  <p className="text-xs text-slate-500">Fallback: <code>{selectedFile.fallbackPath}</code></p>
                </div>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search or mark lines..."
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm lg:w-72"
                />
              </div>

              <p className="mt-3 text-xs text-slate-500">Tips: markera text direkt i loggrutan för snabb kopiering. Rader med highlight-ord får etiketter.</p>

              <pre className="mt-3 max-h-[420px] overflow-auto rounded-md border border-slate-200 bg-slate-950 p-3 text-xs text-slate-100">
                {renderedLines.map((entry) => (
                  <div key={`${selectedFile.id}-${entry.lineNumber}`} className={`mb-1 rounded px-2 py-1 ${entry.isSearchMatch ? 'bg-sky-900/50' : ''}`}>
                    <span className="mr-3 text-slate-500">{String(entry.lineNumber).padStart(3, '0')}</span>
                    <span>{entry.line}</span>
                    {entry.hitTerms.length > 0 && (
                      <span className="ml-2 inline-flex gap-1 align-middle">
                        {entry.hitTerms.map((term) => (
                          <span key={`${entry.lineNumber}-${term}`} className="rounded border border-amber-300 bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                            {term}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                ))}
              </pre>
            </>
          ) : (
            <p className="text-sm text-slate-500">No logs found for selected category.</p>
          )}
        </article>
      </section>

      <div className="overflow-x-auto">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Detected signals</h3>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th><button type="button" onClick={() => setSort('source')}>Source {sortArrow(sortKey === 'source', sortDirection)}</button></th>
              <th><button type="button" onClick={() => setSort('signal')}>Signal {sortArrow(sortKey === 'signal', sortDirection)}</button></th>
              <th><button type="button" onClick={() => setSort('level')}>Level {sortArrow(sortKey === 'level', sortDirection)}</button></th>
              <th><button type="button" onClick={() => setSort('count')}>Count {sortArrow(sortKey === 'count', sortDirection)}</button></th>
              <th><button type="button" onClick={() => setSort('latest')}>Latest occurrence {sortArrow(sortKey === 'latest', sortDirection)}</button></th>
            </tr>
          </thead>
          <tbody>
            {sortedInsights.map((entry) => (
              <tr key={`${entry.source}-${entry.signal}`}>
                <td>{entry.source}</td>
                <td>{entry.signal}</td>
                <td><span className={`inline-flex rounded border px-2 py-0.5 text-xs font-medium ${levelClass(entry.level)}`}>{entry.level}</span></td>
                <td>{entry.count}</td>
                <td>{entry.latest}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

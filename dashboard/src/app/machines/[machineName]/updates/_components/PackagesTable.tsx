'use client';

import { useMemo, useState } from 'react';
import { PackageInventoryItem } from '../../_lib/machine-data';

type Props = {
  packages: PackageInventoryItem[];
  machineBasePath: string;
  machineQuery: string;
};

export default function PackagesTable({ packages, machineBasePath, machineQuery }: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const allSelected = packages.length > 0 && selected.length === packages.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected([]);
      return;
    }

    setSelected(packages.map((pkg) => pkg.slug));
  };

  const toggleOne = (slug: string) => {
    setSelected((current) => (current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]));
  };

  return (
    <>
      <div className="machine-filter-row">
        <label className="machine-filter-chip inline-flex items-center gap-2">
          <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
          Select all
        </label>
        <span className="machine-filter-chip">Selected: {selected.length}</span>
        <span className="machine-filter-chip">Status: All</span>
      </div>

      <p className="text-sm text-slate-600">Showing {packages.length} of {packages.length} packages</p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="w-10"><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Select all packages" /></th>
              <th>Package</th>
              <th>Status</th>
              <th>Installed version</th>
              <th>Upgradable to</th>
              <th className="w-36">Actions</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((pkg) => (
              <tr key={pkg.slug} className={selectedSet.has(pkg.slug) ? 'bg-sky-50' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedSet.has(pkg.slug)}
                    onChange={() => toggleOne(pkg.slug)}
                    aria-label={`Select package ${pkg.name}`}
                  />
                </td>
                <td>
                  <a className="link" href={`${machineBasePath}/packages/${encodeURIComponent(pkg.slug)}?${machineQuery}`}>
                    {pkg.name}
                  </a>
                </td>
                <td>
                  <span className={pkg.status === 'Up-to-date' ? 'text-emerald-700' : 'text-amber-700'}>{pkg.status}</span>
                </td>
                <td>{pkg.installedVersion}</td>
                <td>{pkg.upgradableTo}</td>
                <td>
                  <select className="rounded border border-slate-300 bg-white px-2 py-1 text-xs" defaultValue="none" aria-label={`Actions for ${pkg.name}`}>
                    <option value="none">Actions…</option>
                    <option value="remove">Remove</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

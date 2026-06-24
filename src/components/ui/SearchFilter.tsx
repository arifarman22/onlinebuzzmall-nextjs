'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from './Button';

interface SearchFilterProps {
  basePath: string;
  placeholder?: string;
  filters?: { key: string; label: string; options: { value: string; label: string }[] }[];
}

export default function SearchFilter({ basePath, placeholder = 'Search...', filters }: SearchFilterProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    Object.entries(filterValues).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set('page', '1');
    const separator = basePath.includes('?') ? '&' : '?';
    router.push(`${basePath}${separator}${params.toString()}`);
  };

  const handleReset = () => {
    setSearch('');
    setFilterValues({});
    router.push(basePath);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 mb-4">
      <div className="flex-1 min-w-[200px]">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-indigo-500"
        />
      </div>

      {filters?.map((f) => (
        <div key={f.key} className="min-w-[150px]">
          <select
            value={filterValues[f.key] || ''}
            onChange={(e) => setFilterValues({ ...filterValues, [f.key]: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          >
            <option value="">{f.label}</option>
            {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      ))}

      <Button type="submit" size="sm">Search</Button>
      <Button type="button" size="sm" variant="outline" onClick={handleReset}>Reset</Button>
    </form>
  );
}

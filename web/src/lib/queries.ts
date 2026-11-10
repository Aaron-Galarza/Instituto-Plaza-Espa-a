'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type {
  CareGroup,
  Insurer,
  PaginatedResult,
  Patient,
  Professional,
  Service,
  Space,
} from '@plaza/shared';
import { api } from './api';

export interface ReferenceData {
  patients: Patient[];
  professionals: Professional[];
  insurers: Insurer[];
  services: Service[];
  spaces: Space[];
  groups: CareGroup[];
}

async function list<T>(path: string): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; ; page += 1) {
    const result = await api<PaginatedResult<T>>(
      `${path}${path.includes('?') ? '&' : '?'}page=${page}&pageSize=100`,
    );
    items.push(...result.items);
    if (page >= result.totalPages) return items;
  }
}

export function useReferenceData() {
  return useQuery<ReferenceData>({
    queryKey: ['reference-data'],
    queryFn: async () => {
      const [patients, professionals, insurers, services, spaces, groups] = await Promise.all([
        list<Patient>('/patients'),
        list<Professional>('/professionals'),
        list<Insurer>('/insurers'),
        list<Service>('/services'),
        list<Space>('/spaces'),
        list<CareGroup>('/care-groups'),
      ]);
      return { patients, professionals, insurers, services, spaces, groups };
    },
    staleTime: 60_000,
  });
}

export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

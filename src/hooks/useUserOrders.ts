// hooks/useUserOrders.ts
'use client';

import { useUser } from '@/contexts/UserContext';
import { CollectionItem, VariantType } from '@/types';
import { useEffect, useState, useMemo } from 'react';

export function useUserOrders(filter: VariantType = 'ALL') {
  const { user } = useUser();

  // 1) Fetch raw data once, on mount
  const [rawData, setRawData] = useState<Record<string, CollectionItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error|null>(null);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);

    fetch(`/api/orders?userId=${user.id}`)
      .then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((json: Record<string, CollectionItem[]>) => {
        setRawData(json);
      })
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, [user?.id]);

  // 2) Flatten and filter client-side
  const flat = useMemo(
    () => Object.values(rawData).flat(),
    [rawData]
  );
  const filtered = useMemo(
    () => filter === 'ALL'
      ? flat
      : flat.filter(item => item.type === filter),
    [flat, filter]
  );

  // 3) Re-group by date whenever filtered list changes
  const data = useMemo(() => {
    return filtered.reduce<Record<string, CollectionItem[]>>((acc, item) => {
      const dateKey = item.order.placedAt.split('T')[0];
      (acc[dateKey] ||= []).push(item);
      return acc;
    }, {});
  }, [filtered]);

  return { data, loading, error };
}

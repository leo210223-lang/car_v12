'use client';

import { useCallback } from 'react';
import { api } from '@/lib/api';

/**
 * [v12] 管理員取消某車的可盤狀態
 */
export function useAdminVehicleTradableActions() {
  const cancelTradable = useCallback(async (vehicleId: string) => {
    return api.post<{ id: string; is_tradable: boolean }>(
      `/admin/vehicles-tradable/${vehicleId}/cancel`
    );
  }, []);

  return { cancelTradable };
}

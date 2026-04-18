/**
 * FaCai-B Platform - App Settings Service
 * File: backend/src/services/settings.service.ts
 * 
 * 應用程式設定與外部服務管理
 */

import { supabaseAdmin } from '../config/supabase';
import { ExternalServices, ExternalService } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface UpdateExternalServicesInput {
  entertainment?: Partial<ExternalService>;
  relaxation?: Partial<ExternalService>;
  comfort?: Partial<ExternalService>;
}

export interface UpsertAppSettingInput {
  key: string;
  value: unknown;
}

// ============================================================================
// Settings Service
// ============================================================================

export const settingsService = {
  /**
   * 取得外部服務設定
   */
  async getExternalServices(): Promise<ServiceResult<ExternalServices>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('app_settings')
        .select('key, value')
        .in('key', ['more_services', 'external_services']);

      if (error) {
        console.error('[SettingsService] GetExternalServices error:', error);

        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      const selected =
        data?.find((item) => item.key === 'more_services') ||
        data?.find((item) => item.key === 'external_services');

      if (!selected) {
        return {
          success: true,
          data: this.getDefaultExternalServices(),
        };
      }

      const normalized = this.normalizeExternalServices(selected.value);

      return { 
        success: true, 
        data: normalized,
      };
    } catch (err) {
      console.error('[SettingsService] GetExternalServices exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '取得外部服務設定失敗' },
      };
    }
  },

  /**
   * 取得啟用的外部服務（公開 API）
   */
  async getActiveExternalServices(): Promise<ServiceResult<Partial<ExternalServices>>> {
    try {
      const result = await this.getExternalServices();
      
      if (!result.success) {
        return result as ServiceResult<Partial<ExternalServices>>;
      }

      const services = result.data!;
      const activeServices: Partial<ExternalServices> = {};

      // 只回傳啟用的服務
      if (services.entertainment?.is_active) {
        activeServices.entertainment = services.entertainment;
      }
      if (services.relaxation?.is_active) {
        activeServices.relaxation = services.relaxation;
      }
      if (services.comfort?.is_active) {
        activeServices.comfort = services.comfort;
      }

      return { success: true, data: activeServices };
    } catch (err) {
      console.error('[SettingsService] GetActiveExternalServices exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '取得外部服務失敗' },
      };
    }
  },

  /**
   * 更新外部服務設定（Admin）
   */
  async updateExternalServices(
    input: UpdateExternalServicesInput,
    adminId: string
  ): Promise<ServiceResult<ExternalServices>> {
    try {
      // 先取得現有設定
      const currentResult = await this.getExternalServices();
      if (!currentResult.success) {
        return currentResult;
      }

      const currentServices = currentResult.data!;

      // 合併更新
      const updatedServices: ExternalServices = {
        entertainment: {
          ...currentServices.entertainment,
          ...(input.entertainment || {}),
        },
        relaxation: {
          ...currentServices.relaxation,
          ...(input.relaxation || {}),
        },
        comfort: {
          ...currentServices.comfort,
          ...(input.comfort || {}),
        },
      };

      const upsertResult = await this.upsertAppSetting({
        key: 'more_services',
        value: updatedServices,
      });

      if (!upsertResult.success) {
        return {
          success: false,
          error: upsertResult.error,
        };
      }

      // 寫入稽核日誌
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: adminId,
          action: 'DICTIONARY_UPDATED', // 使用現有的 action type
          target_type: 'app_settings',
          target_id: 'external_services',
          details: {
            previous: currentServices,
            updated: updatedServices,
          },
        });

      return { 
        success: true, 
        data: this.normalizeExternalServices(upsertResult.data?.value),
      };
    } catch (err) {
      console.error('[SettingsService] UpdateExternalServices exception:', err);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '更新外部服務設定失敗' },
      };
    }
  },

  /**
   * 取得預設外部服務設定
   */
  getDefaultExternalServices(): ExternalServices {
    return {
      entertainment: {
        name: '娛樂服務',
        url: null,
        is_active: false,
      },
      relaxation: {
        name: '放鬆服務',
        url: null,
        is_active: false,
      },
      comfort: {
        name: '舒適服務',
        url: null,
        is_active: false,
      },
    };
  },

  async upsertAppSetting(input: UpsertAppSettingInput): Promise<ServiceResult<{ key: string; value: unknown }>> {
    try {
      let parsedValue = input.value;

      if (typeof parsedValue === 'string') {
        try {
          parsedValue = JSON.parse(parsedValue);
        } catch (error) {
          console.error('[SettingsService] Invalid JSON value:', error);
          return {
            success: false,
            error: { code: 'INVALID_JSON', message: 'value 必須為合法 JSON' },
          };
        }
      }

      const { data, error } = await supabaseAdmin
        .from('app_settings')
        .upsert(
          {
            key: input.key,
            value: parsedValue,
          },
          {
            onConflict: 'key',
          }
        )
        .select('key, value')
        .single();

      if (error) {
        console.error('Supabase Upsert Error:', error);
        return {
          success: false,
          error: { code: 'DB_ERROR', message: error.message },
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Supabase Upsert Error:', error);
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '設定寫入失敗' },
      };
    }
  },

  normalizeExternalServices(rawValue: unknown): ExternalServices {
    const defaultValue = this.getDefaultExternalServices();

    if (!rawValue || typeof rawValue !== 'object') {
      return defaultValue;
    }

    const value = rawValue as Partial<ExternalServices>;

    return {
      entertainment: {
        ...defaultValue.entertainment,
        ...(value.entertainment || {}),
      },
      relaxation: {
        ...defaultValue.relaxation,
        ...(value.relaxation || {}),
      },
      comfort: {
        ...defaultValue.comfort,
        ...(value.comfort || {}),
      },
    };
  },
};

export default settingsService;

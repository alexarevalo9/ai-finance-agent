import { supabase } from './client';
import type { FinancialRecord } from './client';

export class FinancialRecordsService {
  /**
   * Upload file to Supabase storage bucket 'records'
   */
  static async uploadFile(file: File, userId: string): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      console.log('🔄 Uploading file:', fileName, 'Size:', file.size, 'bytes');

      const { data, error } = await supabase.storage
        .from('records')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('❌ Storage upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      console.log('✅ File uploaded successfully:', data);

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('records').getPublicUrl(fileName);

      console.log('📂 File URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('row-level security')) {
          throw new Error(
            'Storage permissions not configured. Please check bucket policies.'
          );
        } else if (error.message.includes('bucket')) {
          throw new Error(
            'Storage bucket "records" not found. Please create it in Supabase dashboard.'
          );
        } else {
          throw new Error(`Upload failed: ${error.message}`);
        }
      }

      throw new Error('Unknown upload error occurred');
    }
  }

  /**
   * Insert multiple financial records from uploaded file
   */
  static async insertRecords(
    records: Omit<FinancialRecord, 'id' | 'created_at' | 'updated_at'>[],
    batchId: string
  ): Promise<FinancialRecord[]> {
    try {
      const recordsWithBatch = records.map((record) => ({
        ...record,
        upload_batch_id: batchId,
      }));

      const { data, error } = await supabase
        .from('financial_records')
        .insert(recordsWithBatch)
        .select();

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error inserting financial records:', error);
      throw error;
    }
  }

  /**
   * Get financial records for a user
   */
  static async getUserRecords(userId?: string): Promise<FinancialRecord[]> {
    try {
      let query = supabase
        .from('financial_records')
        .select('*')
        .order('record_date', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching financial records:', error);
      return [];
    }
  }

  /**
   * Get financial records for a specific session
   */
  static async getSessionRecords(
    sessionId: string
  ): Promise<FinancialRecord[]> {
    try {
      const { data, error } = await supabase
        .from('financial_records')
        .select('*')
        .eq('chat_session_id', sessionId)
        .order('record_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching session records:', error);
      return [];
    }
  }

  /**
   * Delete financial records by batch ID
   */
  static async deleteRecordsBatch(batchId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('financial_records')
        .delete()
        .eq('upload_batch_id', batchId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting records batch:', error);
      return false;
    }
  }

  /**
   * Get summary statistics for user's financial records
   */
  static async getRecordsSummary(userId?: string): Promise<{
    totalIncome: number;
    totalExpenses: number;
    recordCount: number;
    categories: { category: string; amount: number; type: string }[];
  }> {
    try {
      let query = supabase
        .from('financial_records')
        .select('amount, type, category');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const records = data || [];
      const totalIncome = records
        .filter((r) => r.type === 'income')
        .reduce((sum, r) => sum + (r.amount || 0), 0);

      const totalExpenses = records
        .filter((r) => r.type === 'expense')
        .reduce((sum, r) => sum + (r.amount || 0), 0);

      // Group by category
      const categoryMap = new Map<string, { amount: number; type: string }>();
      records.forEach((record) => {
        const key = `${record.category}-${record.type}`;
        const existing = categoryMap.get(key);
        if (existing) {
          existing.amount += record.amount || 0;
        } else {
          categoryMap.set(key, {
            amount: record.amount || 0,
            type: record.type || 'expense',
          });
        }
      });

      const categories = Array.from(categoryMap.entries()).map(
        ([key, value]) => ({
          category: key.split('-')[0],
          amount: value.amount,
          type: value.type,
        })
      );

      return {
        totalIncome,
        totalExpenses,
        recordCount: records.length,
        categories,
      };
    } catch (error) {
      console.error('Error getting records summary:', error);
      return {
        totalIncome: 0,
        totalExpenses: 0,
        recordCount: 0,
        categories: [],
      };
    }
  }
}

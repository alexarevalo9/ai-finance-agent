'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  Download,
} from 'lucide-react';

interface ParsedRecord {
  amount: number;
  type: 'expense' | 'income';
  record_date: string;
  category: string;
  description?: string;
  account?: string;
  payment_type?: string;
  note?: string;
  labels?: string[];
  is_transfer?: boolean;
  [key: string]: unknown;
}

interface FileUploadProps {
  onRecordsParsed: (records: ParsedRecord[]) => void;
  onFileSelected: (file: File | null) => void;
  disabled?: boolean;
}

// Required columns for validation
const REQUIRED_COLUMNS = ['amount', 'type', 'date', 'category'] as const;

// Common column name variations
const COLUMN_MAPPINGS: Record<string, string> = {
  // Amount variations
  amount: 'amount',
  value: 'amount',
  sum: 'amount',
  total: 'amount',
  price: 'amount',

  // Type variations (transaction type: income/expense)
  type: 'type',
  transaction_type: 'type',
  kind: 'type',
  expense_income: 'type',
  transaction_kind: 'type',

  // Date variations
  date: 'record_date',
  transaction_date: 'record_date',
  record_date: 'record_date',
  created_at: 'record_date',

  // Category variations
  category: 'category',
  subcategory: 'category',
  type_category: 'category',
  expense_category: 'category',

  // Optional field mappings
  description: 'description',
  note: 'description',
  memo: 'description',
  details: 'description',
  account: 'account',
  payment_type: 'payment_type',
  payment_method: 'payment_type',
  method: 'payment_type',
};

export default function FinancialRecordsUpload({
  onRecordsParsed,
  onFileSelected,
  disabled = false,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedRecords, setParsedRecords] = useState<ParsedRecord[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>(
    {}
  );
  const [showColumnMapping, setShowColumnMapping] = useState(false);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse date from various formats
  const parseDate = (dateStr: string): string | null => {
    if (!dateStr || dateStr.trim() === '') return null;

    try {
      // Try direct parsing first
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
      }

      // Try common formats
      const formats = [
        /^(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY
        /^(\d{1,2})-(\d{1,2})-(\d{4})/, // MM-DD-YYYY
        /^(\d{4})\/(\d{1,2})\/(\d{1,2})/, // YYYY/MM/DD
      ];

      for (const format of formats) {
        const match = dateStr.match(format);
        if (match) {
          let year, month, day;
          if (format.toString().includes('(\\d{4})')) {
            // Year first formats
            [, year, month, day] = match;
          } else {
            // Month first formats
            [, month, day, year] = match;
          }

          const parsedDate = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day)
          );
          if (!isNaN(parsedDate.getTime())) {
            return parsedDate.toISOString().split('T')[0];
          }
        }
      }

      return null;
    } catch {
      return null;
    }
  };

  // Normalize type values
  const normalizeType = (type: string): 'expense' | 'income' | null => {
    const typeStr = type.toLowerCase().trim();

    // Income patterns
    if (
      [
        'income',
        'credit',
        'deposit',
        'in',
        '+',
        'positive',
        'earning',
        'revenue',
        'salary',
      ].includes(typeStr)
    ) {
      return 'income';
    }

    // Expense patterns
    if (
      [
        'expense',
        'debit',
        'withdrawal',
        'out',
        '-',
        'negative',
        'spending',
        'cost',
        'payment',
        'charge',
      ].includes(typeStr)
    ) {
      return 'expense';
    }

    // Handle cases where the value might be something else (like payment method)
    // This shouldn't happen with proper column mapping, but as a fallback
    console.warn(
      `Unknown transaction type: "${type}". Expected income/expense values.`
    );
    return null;
  };

  // Parse CSV content
  const parseCSV = (csvText: string): string[][] => {
    const lines = csvText.split('\n').filter((line) => line.trim());
    const result: string[][] = [];

    for (const line of lines) {
      const row: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }

      row.push(current.trim());
      result.push(row);
    }

    return result;
  };

  // Auto-detect column mapping
  const detectColumnMapping = (headers: string[]): Record<string, string> => {
    const mapping: Record<string, string> = {};

    // First pass: exact matches (highest priority)
    headers.forEach((header) => {
      const normalizedHeader = header
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '_');

      // Check for exact matches first
      if (COLUMN_MAPPINGS[normalizedHeader]) {
        mapping[header] = COLUMN_MAPPINGS[normalizedHeader];
      }
    });

    // Second pass: partial matches (only if no exact match found for target)
    const mappedTargets = Object.values(mapping);

    headers.forEach((header) => {
      if (mapping[header]) return; // Skip if already mapped

      const normalizedHeader = header
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '_');

      // Check partial matches for unmapped targets
      for (const [pattern, target] of Object.entries(COLUMN_MAPPINGS)) {
        if (mappedTargets.includes(target)) continue; // Skip if target already mapped

        if (
          normalizedHeader.includes(pattern) ||
          pattern.includes(normalizedHeader)
        ) {
          mapping[header] = target;
          mappedTargets.push(target);
          break;
        }
      }
    });

    return mapping;
  };

  // Process uploaded file
  const processFile = async (file: File) => {
    setIsProcessing(true);
    setParseErrors([]);

    try {
      const text = await file.text();
      const data = parseCSV(text);

      if (data.length === 0) {
        throw new Error('File is empty or could not be parsed');
      }

      const headers = data[0].map((h) => h.trim());
      const rows = data.slice(1);

      setDetectedColumns(headers);

      // Auto-detect column mapping
      const autoMapping = detectColumnMapping(headers);
      setColumnMapping(autoMapping);

      // Check if we have all required columns mapped
      const mappedColumns = Object.values(autoMapping);
      const missingRequired = REQUIRED_COLUMNS.filter((col) => {
        if (col === 'date') return !mappedColumns.includes('record_date');
        return !mappedColumns.includes(col);
      });

      if (missingRequired.length > 0) {
        setShowColumnMapping(true);
        setParseErrors([
          `Missing required columns: ${missingRequired.join(', ')}. Please map columns manually.`,
        ]);
        return;
      }

      // Parse records
      const records = parseRecords(headers, rows, autoMapping);
      setParsedRecords(records);
      onRecordsParsed(records);
    } catch (error) {
      console.error('Error processing file:', error);
      setParseErrors([
        `Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Parse records with mapping
  const parseRecords = (
    headers: string[],
    rows: string[][],
    mapping: Record<string, string>
  ): ParsedRecord[] => {
    const records: ParsedRecord[] = [];
    const errors: string[] = [];

    // Create reverse mapping (target -> source index)
    const reverseMapping: Record<string, number> = {};
    Object.entries(mapping).forEach(([source, target]) => {
      const index = headers.indexOf(source);
      if (index !== -1) {
        reverseMapping[target] = index;
      }
    });

    rows.forEach((row, rowIndex) => {
      try {
        if (row.every((cell) => !cell.trim())) return; // Skip empty rows

        // Extract required fields
        const amountStr = row[reverseMapping.amount]?.trim();
        const typeStr = row[reverseMapping.type]?.trim();
        const dateStr = row[reverseMapping.record_date]?.trim();
        const category = row[reverseMapping.category]?.trim();

        if (!amountStr || !typeStr || !dateStr || !category) {
          errors.push(`Row ${rowIndex + 2}: Missing required fields`);
          return;
        }

        // Parse amount
        const amount = parseFloat(amountStr.replace(/[^0-9.-]/g, ''));
        if (isNaN(amount)) {
          errors.push(`Row ${rowIndex + 2}: Invalid amount "${amountStr}"`);
          return;
        }

        // Parse type
        const type = normalizeType(typeStr);
        if (!type) {
          errors.push(
            `Row ${rowIndex + 2}: Invalid type "${typeStr}". Must be income/expense or similar`
          );
          return;
        }

        // Parse date
        const record_date = parseDate(dateStr);
        if (!record_date) {
          errors.push(`Row ${rowIndex + 2}: Invalid date "${dateStr}"`);
          return;
        }

        // Build record
        const record: ParsedRecord = {
          amount: Math.abs(amount), // Always store as positive
          type,
          record_date,
          category,
        };

        // Add optional fields
        if (
          reverseMapping.description !== undefined &&
          row[reverseMapping.description]
        ) {
          record.description = row[reverseMapping.description].trim();
        }
        if (
          reverseMapping.account !== undefined &&
          row[reverseMapping.account]
        ) {
          record.account = row[reverseMapping.account].trim();
        }
        if (
          reverseMapping.payment_type !== undefined &&
          row[reverseMapping.payment_type]
        ) {
          record.payment_type = row[reverseMapping.payment_type].trim();
        }

        // Handle 'note' field - can come from mapped note field or direct note column
        if (reverseMapping.note !== undefined && row[reverseMapping.note]) {
          record.note = row[reverseMapping.note].trim();
        } else {
          // Try to find note column directly
          const noteIndex = headers.indexOf('note');
          if (noteIndex !== -1 && row[noteIndex] && row[noteIndex].trim()) {
            record.note = row[noteIndex].trim();
          }
        }

        // Handle transfer field if present
        const transferIndex = headers.indexOf('transfer');
        if (transferIndex !== -1 && row[transferIndex]) {
          record.is_transfer = row[transferIndex].toLowerCase() === 'true';
        }

        records.push(record);
      } catch (error) {
        errors.push(
          `Row ${rowIndex + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });

    setParseErrors(errors);
    return records;
  };

  // Handle file drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const file = files[0];

      if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
        setUploadedFile(file);
        onFileSelected(file);
        processFile(file);
      } else {
        setParseErrors(['Please upload a CSV file']);
      }
    },
    [onFileSelected, processFile]
  );

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      onFileSelected(file);
      processFile(file);
    }
  };

  // Update column mapping
  const updateColumnMapping = (sourceColumn: string, targetColumn: string) => {
    const newMapping = { ...columnMapping };
    if (targetColumn === '') {
      delete newMapping[sourceColumn];
    } else {
      newMapping[sourceColumn] = targetColumn;
    }
    setColumnMapping(newMapping);
  };

  // Apply manual column mapping
  const applyColumnMapping = () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    uploadedFile.text().then((text) => {
      const data = parseCSV(text);
      const headers = data[0];
      const rows = data.slice(1);

      const records = parseRecords(headers, rows, columnMapping);
      setParsedRecords(records);
      onRecordsParsed(records);
      setShowColumnMapping(false);
      setIsProcessing(false);
    });
  };

  // Clear uploaded file
  const clearFile = () => {
    setUploadedFile(null);
    setParsedRecords([]);
    setParseErrors([]);
    setShowColumnMapping(false);
    onFileSelected(null);
    onRecordsParsed([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Download template
  const downloadTemplate = () => {
    const template =
      'amount,type,date,category,description,account\n100.50,expense,2024-01-15,Food,Grocery shopping,Credit Card\n3000.00,income,2024-01-01,Salary,Monthly salary,Bank Account';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'financial_records_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className='w-full space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-gray-900'>
          Upload Financial Records
        </h3>
        <Button
          variant='outline'
          size='sm'
          onClick={downloadTemplate}
          className='flex items-center gap-2'
        >
          <Download className='w-4 h-4' />
          Download Template
        </Button>
      </div>

      {/* Upload Area */}
      {!uploadedFile && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type='file'
            accept='.csv'
            onChange={handleFileChange}
            className='hidden'
            disabled={disabled}
          />

          <div className='space-y-4'>
            <div className='mx-auto w-12 bg-gray-100 rounded-full flex items-center justify-center'>
              <Upload className='w-6 h-6 text-gray-600' />
            </div>
            <div>
              <p className='text-lg font-medium text-gray-900'>
                Drop your CSV file here
              </p>
              <p className='text-sm text-gray-600 mt-1'>
                Or click to browse files
              </p>
            </div>
            <div className='text-xs text-gray-500'>
              <p>
                Required columns: amount, type (expense/income), date, category
              </p>
              <p>Supported format: CSV files only</p>
            </div>
          </div>
        </div>
      )}

      {/* File Processing Status */}
      {uploadedFile && (
        <div className='bg-gray-50 rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <FileText className='w-5 h-5 text-blue-600' />
              <div>
                <p className='font-medium text-gray-900'>{uploadedFile.name}</p>
                <p className='text-sm text-gray-600'>
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <Button
              variant='ghost'
              size='sm'
              onClick={clearFile}
              className='text-gray-500 hover:text-gray-700'
            >
              <X className='w-4 h-4' />
            </Button>
          </div>

          {/* Processing Status */}
          {isProcessing && (
            <div className='mt-4 flex items-center gap-2 text-blue-600'>
              <div className='w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
              <span className='text-sm'>Processing file...</span>
            </div>
          )}

          {/* Success Status */}
          {!isProcessing &&
            parsedRecords.length > 0 &&
            parseErrors.length === 0 && (
              <div className='mt-4 flex items-center gap-2 text-green-600'>
                <CheckCircle2 className='w-4 h-4' />
                <span className='text-sm'>
                  Successfully parsed {parsedRecords.length} records
                </span>
              </div>
            )}

          {/* Errors */}
          {parseErrors.length > 0 && (
            <div className='mt-4 space-y-2'>
              <div className='flex items-start gap-2 text-red-600'>
                <AlertCircle className='w-4 h-4 mt-0.5 flex-shrink-0' />
                <div className='text-sm space-y-1'>
                  {parseErrors.slice(0, 5).map((error, index) => (
                    <p key={index}>{error}</p>
                  ))}
                  {parseErrors.length > 5 && (
                    <p className='text-gray-500'>
                      ... and {parseErrors.length - 5} more errors
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Column Mapping Interface */}
      {showColumnMapping && (
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
          <h4 className='font-semibold text-yellow-900 mb-3'>
            Map Your Columns
          </h4>
          <p className='text-sm text-yellow-800 mb-4'>
            Please map your file columns to our required fields:
          </p>

          <div className='space-y-3 mb-4'>
            {REQUIRED_COLUMNS.map((requiredCol) => (
              <div key={requiredCol} className='flex items-center gap-3'>
                <span className='w-20 text-sm font-medium text-gray-700'>
                  {requiredCol === 'date' ? 'date' : requiredCol}:
                </span>
                <select
                  className='flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm'
                  value={
                    Object.entries(columnMapping).find(
                      ([, target]) =>
                        target ===
                        (requiredCol === 'date' ? 'record_date' : requiredCol)
                    )?.[0] || ''
                  }
                  onChange={(e) => {
                    const targetCol =
                      requiredCol === 'date' ? 'record_date' : requiredCol;
                    updateColumnMapping(e.target.value, targetCol);
                  }}
                >
                  <option value=''>Select column...</option>
                  {detectedColumns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <Button
            onClick={applyColumnMapping}
            disabled={
              Object.values(columnMapping).length < REQUIRED_COLUMNS.length
            }
            className='w-full'
          >
            Apply Mapping & Parse Records
          </Button>
        </div>
      )}

      {/* Records Preview */}
      {parsedRecords.length > 0 && (
        <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
          <h4 className='font-semibold text-green-900 mb-3'>
            Records Preview ({parsedRecords.length} total)
          </h4>

          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b border-green-200'>
                  <th className='text-left py-2 px-3'>Amount</th>
                  <th className='text-left py-2 px-3'>Type</th>
                  <th className='text-left py-2 px-3'>Date</th>
                  <th className='text-left py-2 px-3'>Category</th>
                  <th className='text-left py-2 px-3'>Description</th>
                </tr>
              </thead>
              <tbody>
                {parsedRecords.slice(0, 5).map((record, index) => (
                  <tr key={index} className='border-b border-green-100'>
                    <td className='py-2 px-3 font-medium'>
                      ${record.amount.toFixed(2)}
                    </td>
                    <td className='py-2 px-3'>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.type === 'income'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {record.type}
                      </span>
                    </td>
                    <td className='py-2 px-3'>{record.record_date}</td>
                    <td className='py-2 px-3'>{record.category}</td>
                    <td className='py-2 px-3'>{record.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {parsedRecords.length > 5 && (
              <p className='text-center text-green-700 py-2 text-sm'>
                ... and {parsedRecords.length - 5} more records
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

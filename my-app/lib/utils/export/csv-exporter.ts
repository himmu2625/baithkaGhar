/**
 * Export data to CSV format
 */
export function exportToCSV(data: any[], filename: string): void {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    // Header row
    headers.join(','),
    // Data rows
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Handle special characters and quotes
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        // Escape quotes and wrap in quotes if contains comma or newline
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Format data for CSV export with custom column names
 */
export function formatForCSV<T extends Record<string, any>>(
  data: T[],
  columnMapping?: Record<string, string>
): any[] {
  if (!data || data.length === 0) return [];

  return data.map(item => {
    const formatted: Record<string, any> = {};
    Object.keys(item).forEach(key => {
      const displayKey = columnMapping?.[key] || key;
      formatted[displayKey] = item[key];
    });
    return formatted;
  });
}

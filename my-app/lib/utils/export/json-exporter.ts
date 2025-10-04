/**
 * Export data to JSON format
 */
export function exportToJSON(data: any[], filename: string): void {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const jsonContent = JSON.stringify(data, null, 2);

  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Export data with metadata
 */
export function exportToJSONWithMetadata(
  data: any[],
  filename: string,
  metadata?: Record<string, any>
): void {
  const exportData = {
    metadata: {
      exportDate: new Date().toISOString(),
      recordCount: data.length,
      ...metadata
    },
    data
  };

  const jsonContent = JSON.stringify(exportData, null, 2);

  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

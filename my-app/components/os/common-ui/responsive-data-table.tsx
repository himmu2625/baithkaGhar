'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  MoreHorizontal,
  ArrowUpDown,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Bed,
  Clock
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

export interface DataTableColumn<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  mobilePriority?: boolean; // Show on mobile
  tabletPriority?: boolean; // Show on tablet
  desktopPriority?: boolean; // Show on desktop
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  pagination?: boolean;
  loading?: boolean;
  onRowClick?: (item: T) => void;
  onExport?: () => void;
  onImport?: () => void;
  onAdd?: () => void;
  title?: string;
  description?: string;
  emptyMessage?: string;
  itemsPerPage?: number;
  className?: string;
}

export function ResponsiveDataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  filterable = true,
  sortable = true,
  pagination = true,
  loading = false,
  onRowClick,
  onExport,
  onImport,
  onAdd,
  title,
  description,
  emptyMessage = "No data available",
  itemsPerPage = 10,
  className
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage, pagination]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getColumnVisibility = (column: DataTableColumn<T>, screenSize: 'mobile' | 'tablet' | 'desktop') => {
    switch (screenSize) {
      case 'mobile':
        return column.mobilePriority !== false;
      case 'tablet':
        return column.tabletPriority !== false;
      case 'desktop':
        return column.desktopPriority !== false;
      default:
        return true;
    }
  };

  const renderMobileCard = (item: T) => (
    <Card key={item.id || Math.random()} className="mb-3 cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            {columns
              .filter(col => getColumnVisibility(col, 'mobile'))
              .slice(0, 2)
              .map(column => (
                <div key={column.key} className="mb-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {column.label}
                  </span>
                  <div className="text-sm font-medium text-gray-900">
                    {column.render ? column.render(item) : item[column.key]}
                  </div>
                </div>
              ))}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onRowClick?.(item)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Additional info in a more compact format */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          {columns
            .filter(col => getColumnVisibility(col, 'mobile') && !col.mobilePriority)
            .slice(0, 4)
            .map(column => (
              <div key={column.key} className="flex items-center gap-1">
                <span className="font-medium">{column.label}:</span>
                <span>{column.render ? column.render(item) : item[column.key]}</span>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderTabletView = (item: T) => (
    <div key={item.id || Math.random()} className="border-b border-gray-200 p-4 hover:bg-gray-50 cursor-pointer">
      <div className="grid grid-cols-3 gap-4">
        {columns
          .filter(col => getColumnVisibility(col, 'tablet'))
          .map(column => (
            <div key={column.key} className="flex flex-col">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                {column.label}
              </span>
              <div className="text-sm font-medium text-gray-900">
                {column.render ? column.render(item) : item[column.key]}
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  const renderDesktopTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            {columns
              .filter(col => getColumnVisibility(col, 'desktop'))
              .map(column => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide",
                    column.sortable && "cursor-pointer hover:text-gray-700",
                    column.width
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && (
                      <ArrowUpDown className="h-3 w-3" />
                    )}
                  </div>
                </th>
              ))}
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((item, index) => (
            <tr
              key={item.id || index}
              className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
              onClick={() => onRowClick?.(item)}
            >
              {columns
                .filter(col => getColumnVisibility(col, 'desktop'))
                .map(column => (
                  <td key={column.key} className="px-4 py-3 text-sm text-gray-900">
                    {column.render ? column.render(item) : item[column.key]}
                  </td>
                ))}
              <td className="px-4 py-3 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      {(title || onAdd || onExport || onImport) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {description && <p className="text-sm text-gray-600">{description}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {onAdd && (
              <Button onClick={onAdd} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add New
              </Button>
            )}
            {onExport && (
              <Button variant="outline" onClick={onExport} size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            )}
            {onImport && (
              <Button variant="outline" onClick={onImport} size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {searchable && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
        {filterable && (
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="sm:w-auto"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && filterable && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {columns
                .filter(col => col.filterable)
                .map(column => (
                  <div key={column.key}>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      {column.label}
                    </label>
                    <Input
                      placeholder={`Filter ${column.label.toLowerCase()}...`}
                      className="text-sm"
                    />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Data Display */}
      {!loading && (
        <>
          {/* Mobile View */}
          <div className="block sm:hidden">
            {paginatedData.length > 0 ? (
              <div className="space-y-3">
                {paginatedData.map(renderMobileCard)}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">{emptyMessage}</p>
              </div>
            )}
          </div>

          {/* Tablet View */}
          <div className="hidden sm:block lg:hidden">
            {paginatedData.length > 0 ? (
              <div className="bg-white rounded-lg border border-gray-200">
                {paginatedData.map(renderTabletView)}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">{emptyMessage}</p>
              </div>
            )}
          </div>

          {/* Desktop View */}
          <div className="hidden lg:block">
            {paginatedData.length > 0 ? (
              <div className="bg-white rounded-lg border border-gray-200">
                {renderDesktopTable()}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">{emptyMessage}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, sortedData.length)} of{' '}
            {sortedData.length} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 
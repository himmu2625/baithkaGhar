'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Eye, 
  EyeOff, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Building,
  Bed,
  Users,
  DollarSign,
  CreditCard,
  FileText,
  Upload,
  X,
  Check,
  AlertCircle
} from 'lucide-react';

// Responsive Input Component
interface ResponsiveInputProps {
  label: string;
  placeholder?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  leftIcon?: React.ComponentType<any>;
  rightIcon?: React.ComponentType<any>;
  className?: string;
  mobileFullWidth?: boolean;
}

export function ResponsiveInput({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className,
  mobileFullWidth = true
}: ResponsiveInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={cn(
      "space-y-2",
      mobileFullWidth ? "w-full" : "w-full sm:w-auto",
      className
    )}>
      <Label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="relative">
        {LeftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <LeftIcon className="h-4 w-4" />
          </div>
        )}
        <Input
          type={isPassword && showPassword ? 'text' : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "h-10 sm:h-11",
            LeftIcon && "pl-10",
            (RightIcon || isPassword) && "pr-10",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500"
          )}
        />
        {isPassword && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        )}
        {RightIcon && !isPassword && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <RightIcon className="h-4 w-4" />
          </div>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

// Responsive Select Component
interface ResponsiveSelectProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ResponsiveSelect({
  label,
  value,
  onValueChange,
  options,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  className
}: ResponsiveSelectProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className={cn(
          "h-10 sm:h-11",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500"
        )}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

// Responsive Form Layout Component
interface ResponsiveFormLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  onSubmit?: (e: React.FormEvent) => void;
  submitText?: string;
  cancelText?: string;
  onCancel?: () => void;
  loading?: boolean;
  className?: string;
}

export function ResponsiveFormLayout({
  children,
  title,
  description,
  onSubmit,
  submitText = "Submit",
  cancelText = "Cancel",
  onCancel,
  loading = false,
  className
}: ResponsiveFormLayoutProps) {
  return (
    <div className={cn("max-w-4xl mx-auto", className)}>
      <Card>
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle className="text-xl">{title}</CardTitle>}
            {description && <p className="text-gray-600">{description}</p>}
          </CardHeader>
        )}
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {children}
            </div>
            
            {(onSubmit || onCancel) && (
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                {onSubmit && (
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full sm:w-auto sm:order-2"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Loading...
                      </div>
                    ) : (
                      submitText
                    )}
                  </Button>
                )}
                {onCancel && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onCancel}
                    className="w-full sm:w-auto sm:order-1"
                  >
                    {cancelText}
                  </Button>
                )}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Responsive File Upload Component
interface ResponsiveFileUploadProps {
  label: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  onFilesSelected: (files: File[]) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ResponsiveFileUpload({
  label,
  accept,
  multiple = false,
  maxSize = 10,
  onFilesSelected,
  error,
  helperText,
  required = false,
  disabled = false,
  className
}: ResponsiveFileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      if (maxSize && file.size > maxSize * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is ${maxSize}MB.`);
        return false;
      }
      return true;
    });
    
    setSelectedFiles(validFiles);
    onFilesSelected(validFiles);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300",
          error && "border-red-500",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-1">
          Drag and drop files here, or{' '}
          <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
            browse
            <input
              type="file"
              accept={accept}
              multiple={multiple}
              onChange={(e) => handleFiles(Array.from(e.target.files || []))}
              disabled={disabled}
              className="hidden"
            />
          </label>
        </p>
        <p className="text-xs text-gray-500">
          Maximum file size: {maxSize}MB
        </p>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Selected Files:</p>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

// Responsive Checkbox Group Component
interface ResponsiveCheckboxGroupProps {
  label: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ResponsiveCheckboxGroup({
  label,
  options,
  selectedValues,
  onSelectionChange,
  error,
  helperText,
  required = false,
  disabled = false,
  className
}: ResponsiveCheckboxGroupProps) {
  const handleToggle = (value: string) => {
    const newSelection = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onSelectionChange(newSelection);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <Checkbox
              id={option.value}
              checked={selectedValues.includes(option.value)}
              onCheckedChange={() => handleToggle(option.value)}
              disabled={disabled || option.disabled}
            />
            <Label
              htmlFor={option.value}
              className={cn(
                "text-sm",
                (disabled || option.disabled) && "text-gray-400"
              )}
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

// Responsive Radio Group Component
interface ResponsiveRadioGroupProps {
  label: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ResponsiveRadioGroup({
  label,
  options,
  value,
  onValueChange,
  error,
  helperText,
  required = false,
  disabled = false,
  className
}: ResponsiveRadioGroupProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <RadioGroup value={value} onValueChange={onValueChange} disabled={disabled}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {options.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem
                value={option.value}
                id={option.value}
                disabled={option.disabled}
              />
              <Label
                htmlFor={option.value}
                className={cn(
                  "text-sm",
                  (disabled || option.disabled) && "text-gray-400"
                )}
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>

      {error && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
} 
'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Eye, EyeOff, Upload, X } from 'lucide-react';
import { format } from 'date-fns';

// Enhanced Input Component
interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const EnhancedInput = forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, containerClassName, className, ...props }, ref) => {
    return (
      <div className={cn("space-y-2", containerClassName)}>
        {label && (
          <Label className="text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          <Input
            ref={ref}
            className={cn(
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-red-500 focus:border-red-500",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);
EnhancedInput.displayName = 'EnhancedInput';

// Password Input Component
interface PasswordInputProps extends Omit<EnhancedInputProps, 'type' | 'rightIcon'> {
  showToggle?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showToggle = true, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <EnhancedInput
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        rightIcon={
          showToggle ? (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          ) : undefined
        }
        {...props}
      />
    );
  }
);
PasswordInput.displayName = 'PasswordInput';

// Enhanced Select Component
interface EnhancedSelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  containerClassName?: string;
}

export const EnhancedSelect: React.FC<EnhancedSelectProps> = ({
  label,
  error,
  helperText,
  placeholder,
  options,
  value,
  onValueChange,
  required,
  disabled,
  containerClassName
}) => {
  return (
    <div className={cn("space-y-2", containerClassName)}>
      {label && (
        <Label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className={cn(error && "border-red-500 focus:border-red-500")}>
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
        <p className="text-sm text-red-500">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

// Date Picker Component
interface DatePickerProps {
  label?: string;
  error?: string;
  helperText?: string;
  value?: Date;
  onValueChange?: (date: Date | undefined) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  containerClassName?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  error,
  helperText,
  value,
  onValueChange,
  placeholder = "Pick a date",
  required,
  disabled,
  containerClassName
}) => {
  return (
    <div className={cn("space-y-2", containerClassName)}>
      {label && (
        <Label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              error && "border-red-500 focus:border-red-500"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onValueChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

// Enhanced Textarea Component
interface EnhancedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export const EnhancedTextarea = forwardRef<HTMLTextAreaElement, EnhancedTextareaProps>(
  ({ label, error, helperText, containerClassName, className, ...props }, ref) => {
    return (
      <div className={cn("space-y-2", containerClassName)}>
        {label && (
          <Label className="text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <Textarea
          ref={ref}
          className={cn(
            error && "border-red-500 focus:border-red-500",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);
EnhancedTextarea.displayName = 'EnhancedTextarea';

// Checkbox Group Component
interface CheckboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CheckboxGroupProps {
  label?: string;
  error?: string;
  helperText?: string;
  options: CheckboxOption[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
  required?: boolean;
  containerClassName?: string;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  label,
  error,
  helperText,
  options,
  value = [],
  onValueChange,
  required,
  containerClassName
}) => {
  const handleChange = (optionValue: string, checked: boolean) => {
    const newValue = checked
      ? [...value, optionValue]
      : value.filter(v => v !== optionValue);
    onValueChange?.(newValue);
  };

  return (
    <div className={cn("space-y-2", containerClassName)}>
      {label && (
        <Label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <Checkbox
              id={option.value}
              checked={value.includes(option.value)}
              onCheckedChange={(checked) => handleChange(option.value, checked as boolean)}
              disabled={option.disabled}
            />
            <Label
              htmlFor={option.value}
              className={cn(
                "text-sm font-normal",
                option.disabled && "text-gray-400"
              )}
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

// Radio Group Component
interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface EnhancedRadioGroupProps {
  label?: string;
  error?: string;
  helperText?: string;
  options: RadioOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  containerClassName?: string;
}

export const EnhancedRadioGroup: React.FC<EnhancedRadioGroupProps> = ({
  label,
  error,
  helperText,
  options,
  value,
  onValueChange,
  required,
  containerClassName
}) => {
  return (
    <div className={cn("space-y-2", containerClassName)}>
      {label && (
        <Label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <RadioGroup value={value} onValueChange={onValueChange}>
        <div className="space-y-2">
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
                  "text-sm font-normal",
                  option.disabled && "text-gray-400"
                )}
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

// Switch Component
interface EnhancedSwitchProps {
  label?: string;
  error?: string;
  helperText?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  containerClassName?: string;
}

export const EnhancedSwitch: React.FC<EnhancedSwitchProps> = ({
  label,
  error,
  helperText,
  checked,
  onCheckedChange,
  disabled,
  containerClassName
}) => {
  return (
    <div className={cn("space-y-2", containerClassName)}>
      <div className="flex items-center space-x-2">
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
        />
        {label && (
          <Label className="text-sm font-medium text-gray-700">
            {label}
          </Label>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

// File Upload Component
interface FileUploadProps {
  label?: string;
  error?: string;
  helperText?: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  onFileSelect?: (files: File[]) => void;
  required?: boolean;
  disabled?: boolean;
  containerClassName?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  error,
  helperText,
  accept,
  multiple = false,
  maxSize,
  onFileSelect,
  required,
  disabled,
  containerClassName
}) => {
  const [dragActive, setDragActive] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      if (maxSize && file.size > maxSize * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is ${maxSize}MB.`);
        return false;
      }
      return true;
    });

    setSelectedFiles(validFiles);
    onFileSelect?.(validFiles);
  };

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
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFileSelect?.(newFiles);
  };

  return (
    <div className={cn("space-y-2", containerClassName)}>
      {label && (
        <Label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-gray-300",
          error && "border-red-500",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
        
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-primary hover:text-primary/80 font-medium"
            disabled={disabled}
          >
            Click to upload
          </button>
          {" "}or drag and drop
        </p>
        {accept && (
          <p className="mt-1 text-xs text-gray-500">
            Accepted formats: {accept}
          </p>
        )}
        {maxSize && (
          <p className="mt-1 text-xs text-gray-500">
            Maximum file size: {maxSize}MB
          </p>
        )}
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700 truncate">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}; 
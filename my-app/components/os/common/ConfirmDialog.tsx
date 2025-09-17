'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LoadingSpinner } from '@/components/os/common/LoadingSpinner';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = 'Continue',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading = false
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={
              variant === 'destructive'
                ? 'bg-red-600 hover:bg-red-700'
                : undefined
            }
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Processing...
              </div>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function useConfirmDialog() {
  const [dialogState, setDialogState] = React.useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText?: string;
    variant?: 'default' | 'destructive';
    onConfirm?: () => void | Promise<void>;
  }>({
    open: false,
    title: '',
    description: ''
  });

  const [isLoading, setIsLoading] = React.useState(false);

  const confirm = React.useCallback((options: {
    title: string;
    description: string;
    confirmText?: string;
    variant?: 'default' | 'destructive';
    onConfirm: () => void | Promise<void>;
  }) => {
    setDialogState({
      open: true,
      ...options
    });
  }, []);

  const handleConfirm = React.useCallback(async () => {
    if (dialogState.onConfirm) {
      setIsLoading(true);
      try {
        await dialogState.onConfirm();
        setDialogState(prev => ({ ...prev, open: false }));
      } catch (error) {
        console.error('Confirm action failed:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [dialogState.onConfirm]);

  const handleOpenChange = React.useCallback((open: boolean) => {
    if (!isLoading) {
      setDialogState(prev => ({ ...prev, open }));
    }
  }, [isLoading]);

  const dialog = (
    <ConfirmDialog
      open={dialogState.open}
      onOpenChange={handleOpenChange}
      onConfirm={handleConfirm}
      title={dialogState.title}
      description={dialogState.description}
      confirmText={dialogState.confirmText}
      variant={dialogState.variant}
      isLoading={isLoading}
    />
  );

  return { confirm, dialog };
}
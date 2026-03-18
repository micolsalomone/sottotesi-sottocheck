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
} from './ui/alert-dialog';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: 'destructive' | 'default';
  itemsList?: string[]; // Per mostrare lista di elementi da eliminare/modificare
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Conferma',
  cancelLabel = 'Annulla',
  onConfirm,
  variant = 'default',
  itemsList
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <span className="block">{description}</span>
            {itemsList && itemsList.length > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
                <p className="font-medium text-[var(--foreground)] mb-2">
                  Elementi interessati:
                </p>
                <ul className="space-y-1 max-h-32 overflow-y-auto">
                  {itemsList.map((item, index) => (
                    <li key={index} className="text-sm text-[var(--muted-foreground)]">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={
              variant === 'destructive'
                ? 'bg-[var(--destructive-foreground)] text-white hover:opacity-90'
                : ''
            }
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
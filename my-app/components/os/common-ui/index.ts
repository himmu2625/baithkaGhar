// Responsive Design Components
export { ResponsiveDataTable } from './responsive-data-table';
export { 
  ResponsiveInput,
  ResponsiveSelect,
  ResponsiveFormLayout,
  ResponsiveFileUpload,
  ResponsiveCheckboxGroup,
  ResponsiveRadioGroup
} from './responsive-forms';

// Mobile Navigation Components
export { 
  MobileNavigation,
  useMobileNavigation,
  MobileGestureNavigation
} from '../navigation/mobile-navigation';

// Re-export core UI components for convenience
export { Button } from '@/components/ui/button';
export { Input } from '@/components/ui/input';
export { Label } from '@/components/ui/label';
export { Badge } from '@/components/ui/badge';
export { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
export { Checkbox } from '@/components/ui/checkbox';
export { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
export { Switch } from '@/components/ui/switch';
export { Textarea } from '@/components/ui/textarea';
export { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
export { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
export { ScrollArea } from '@/components/ui/scroll-area';
export { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
export { Progress } from '@/components/ui/progress';
export { Separator } from '@/components/ui/separator';
export { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
export { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
export { Skeleton } from '@/components/ui/skeleton';
export { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
export { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
export { useToast } from '@/components/ui/use-toast'; 
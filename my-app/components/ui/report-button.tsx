import { Button, ButtonProps } from '@/components/ui/button';
import { Flag } from 'lucide-react';
import { useReport } from '@/hooks/use-report';
import { useSession } from 'next-auth/react';
import { useLoginPrompt } from '@/hooks/use-login-prompt';
import { useToast } from '@/hooks/use-toast';
import { ReportTargetType } from '@/types/report';

interface ReportButtonProps extends Omit<ButtonProps, 'onClick'> {
  targetType: ReportTargetType;
  targetId: string;
  targetName: string;
  className?: string;
  iconOnly?: boolean;
  onSuccess?: () => void;
}

export function ReportButton({
  targetType,
  targetId,
  targetName,
  className,
  variant = 'ghost',
  size = 'sm',
  iconOnly = false,
  onSuccess,
  ...props
}: ReportButtonProps) {
  const { data: session } = useSession();
  const { openReportDialog } = useReport();
  const { promptLogin } = useLoginPrompt();
  const { toast } = useToast();

  const handleClick = () => {
    if (!session?.user) {
      toast({
        title: 'Authentication required',
        description: 'Please login to report this content',
      });
      promptLogin();
      return;
    }

    openReportDialog({
      targetType,
      targetId,
      targetName,
      onSuccess,
    });
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleClick}
      className={className}
      {...props}
    >
      <Flag className="h-4 w-4 mr-2" />
      {!iconOnly && 'Report'}
    </Button>
  );
} 
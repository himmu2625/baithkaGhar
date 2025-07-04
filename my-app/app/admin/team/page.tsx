import { EnhancedTeamManagement } from '@/components/admin/team/EnhancedTeamManagement';

export const metadata = {
  title: 'Enhanced Team Management - Admin | Baithaka Ghar',
  description: 'Comprehensive team member management with social links, skills, and visibility controls',
};

export default function TeamManagementPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <EnhancedTeamManagement />
    </div>
  );
} 
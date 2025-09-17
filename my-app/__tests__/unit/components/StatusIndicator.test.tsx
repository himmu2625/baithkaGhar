import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';
import StatusIndicator from '@/components/os/common/StatusIndicator';

describe('StatusIndicator Component', () => {
  describe('Room Status', () => {
    it('should render available room status correctly', () => {
      render(<StatusIndicator status="available" type="room" />);

      const indicator = screen.getByText('Available');
      expect(indicator).toBeInTheDocument();
      expect(indicator.closest('.badge')).toHaveClass('bg-green-500');
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('should render occupied room status correctly', () => {
      render(<StatusIndicator status="occupied" type="room" />);

      const indicator = screen.getByText('Occupied');
      expect(indicator).toBeInTheDocument();
      expect(indicator.closest('.badge')).toHaveClass('bg-blue-500');
      expect(screen.getByText('👤')).toBeInTheDocument();
    });

    it('should render maintenance room status correctly', () => {
      render(<StatusIndicator status="maintenance" type="room" />);

      const indicator = screen.getByText('Maintenance');
      expect(indicator).toBeInTheDocument();
      expect(indicator.closest('.badge')).toHaveClass('bg-orange-500');
      expect(screen.getByText('🔧')).toBeInTheDocument();
    });

    it('should render out of order room status correctly', () => {
      render(<StatusIndicator status="out_of_order" type="room" />);

      const indicator = screen.getByText('Out of Order');
      expect(indicator).toBeInTheDocument();
      expect(indicator.closest('.badge')).toHaveClass('bg-red-500');
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('should render reserved room status correctly', () => {
      render(<StatusIndicator status="reserved" type="room" />);

      const indicator = screen.getByText('Reserved');
      expect(indicator).toBeInTheDocument();
      expect(indicator.closest('.badge')).toHaveClass('bg-purple-500');
      expect(screen.getByText('📅')).toBeInTheDocument();
    });
  });

  describe('Task Status', () => {
    it('should render scheduled task status correctly', () => {
      render(<StatusIndicator status="scheduled" type="task" />);

      const indicator = screen.getByText('Scheduled');
      expect(indicator).toBeInTheDocument();
      expect(indicator.closest('.badge')).toHaveClass('bg-gray-500');
      expect(screen.getByText('📅')).toBeInTheDocument();
    });

    it('should render in progress task status correctly', () => {
      render(<StatusIndicator status="in_progress" type="task" />);

      const indicator = screen.getByText('In Progress');
      expect(indicator).toBeInTheDocument();
      expect(indicator.closest('.badge')).toHaveClass('bg-yellow-500');
      expect(screen.getByText('⏳')).toBeInTheDocument();
    });

    it('should render completed task status correctly', () => {
      render(<StatusIndicator status="completed" type="task" />);

      const indicator = screen.getByText('Completed');
      expect(indicator).toBeInTheDocument();
      expect(indicator.closest('.badge')).toHaveClass('bg-green-500');
      expect(screen.getByText('✅')).toBeInTheDocument();
    });

    it('should render cancelled task status correctly', () => {
      render(<StatusIndicator status="cancelled" type="task" />);

      const indicator = screen.getByText('Cancelled');
      expect(indicator).toBeInTheDocument();
      expect(indicator.closest('.badge')).toHaveClass('bg-red-500');
      expect(screen.getByText('❌')).toBeInTheDocument();
    });

    it('should render failed task status correctly', () => {
      render(<StatusIndicator status="failed" type="task" />);

      const indicator = screen.getByText('Failed');
      expect(indicator).toBeInTheDocument();
      expect(indicator.closest('.badge')).toHaveClass('bg-red-600');
      expect(screen.getByText('💥')).toBeInTheDocument();
    });
  });

  describe('Priority Status', () => {
    it('should render low priority correctly', () => {
      render(<StatusIndicator status="low" type="priority" />);

      const indicator = screen.getByText('Low');
      expect(indicator).toBeInTheDocument();
      expect(indicator.closest('.badge')).toHaveClass('bg-gray-500');
      expect(screen.getByText('⬇️')).toBeInTheDocument();
    });

    it('should render medium priority correctly', () => {
      render(<StatusIndicator status="medium" type="priority" />);

      const indicator = screen.getByText('Medium');
      expect(indicator).toBeInTheDocument();
      expect(indicator.closest('.badge')).toHaveClass('bg-blue-500');
      expect(screen.getByText('➡️')).toBeInTheDocument();
    });

    it('should render high priority correctly', () => {
      render(<StatusIndicator status="high" type="priority" />);

      const indicator = screen.getByText('High');
      expect(indicator).toBeInTheDocument();
      expect(indicator.closest('.badge')).toHaveClass('bg-orange-500');
      expect(screen.getByText('⬆️')).toBeInTheDocument();
    });

    it('should render urgent priority correctly', () => {
      render(<StatusIndicator status="urgent" type="priority" />);

      const indicator = screen.getByText('Urgent');
      expect(indicator).toBeInTheDocument();
      expect(indicator.closest('.badge')).toHaveClass('bg-red-500');
      expect(screen.getByText('🔥')).toBeInTheDocument();
    });

    it('should render emergency priority correctly', () => {
      render(<StatusIndicator status="emergency" type="priority" />);

      const indicator = screen.getByText('Emergency');
      expect(indicator).toBeInTheDocument();
      expect(indicator.closest('.badge')).toHaveClass('bg-red-600');
      expect(screen.getByText('🚨')).toBeInTheDocument();
    });
  });

  describe('Inventory Status', () => {
    it('should render in stock inventory status correctly', () => {
      render(<StatusIndicator status="in_stock" type="inventory" />);

      const indicator = screen.getByText('In Stock');
      expect(indicator).toBeInTheDocument();
      expect(indicator.closest('.badge')).toHaveClass('bg-green-500');
      expect(screen.getByText('📦')).toBeInTheDocument();
    });

    it('should render low stock inventory status correctly', () => {
      render(<StatusIndicator status="low_stock" type="inventory" />);

      const indicator = screen.getByText('Low Stock');
      expect(indicator).toBeInTheDocument();
      expect(indicator.closest('.badge')).toHaveClass('bg-yellow-500');
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('should render out of stock inventory status correctly', () => {
      render(<StatusIndicator status="out_of_stock" type="inventory" />);

      const indicator = screen.getByText('Out of Stock');
      expect(indicator).toBeInTheDocument();
      expect(indicator.closest('.badge')).toHaveClass('bg-red-500');
      expect(screen.getByText('❌')).toBeInTheDocument();
    });
  });

  describe('Condition Status', () => {
    it('should render excellent condition correctly', () => {
      render(<StatusIndicator status="excellent" type="condition" />);

      const indicator = screen.getByText('Excellent');
      expect(indicator).toBeInTheDocument();
      expect(indicator.closest('.badge')).toHaveClass('bg-green-500');
      expect(screen.getByText('⭐')).toBeInTheDocument();
    });

    it('should render good condition correctly', () => {
      render(<StatusIndicator status="good" type="condition" />);

      const indicator = screen.getByText('Good');
      expect(indicator).toBeInTheDocument();
      expect(indicator.closest('.badge')).toHaveClass('bg-blue-500');
      expect(screen.getByText('👍')).toBeInTheDocument();
    });

    it('should render poor condition correctly', () => {
      render(<StatusIndicator status="poor" type="condition" />);

      const indicator = screen.getByText('Poor');
      expect(indicator).toBeInTheDocument();
      expect(indicator.closest('.badge')).toHaveClass('bg-orange-500');
      expect(screen.getByText('👎')).toBeInTheDocument();
    });

    it('should render critical condition correctly', () => {
      render(<StatusIndicator status="critical" type="condition" />);

      const indicator = screen.getByText('Critical');
      expect(indicator).toBeInTheDocument();
      expect(indicator.closest('.badge')).toHaveClass('bg-red-500');
      expect(screen.getByText('💥')).toBeInTheDocument();
    });
  });

  describe('Component Props', () => {
    it('should hide icon when showIcon is false', () => {
      render(<StatusIndicator status="available" type="room" showIcon={false} />);

      const indicator = screen.getByText('Available');
      expect(indicator).toBeInTheDocument();
      expect(screen.queryByText('✓')).not.toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<StatusIndicator status="available" type="room" className="custom-class" />);

      const indicator = screen.getByText('Available');
      expect(indicator.closest('.badge')).toHaveClass('custom-class');
    });

    it('should handle unknown status gracefully', () => {
      render(<StatusIndicator status="unknown_status" type="room" />);

      const indicator = screen.getByText('unknown_status');
      expect(indicator).toBeInTheDocument();
      expect(indicator.closest('.badge')).toHaveClass('bg-gray-500');
      expect(screen.getByText('•')).toBeInTheDocument();
    });

    it('should handle unknown type gracefully', () => {
      render(<StatusIndicator status="test" type="unknown" as any />);

      const indicator = screen.getByText('test');
      expect(indicator).toBeInTheDocument();
      expect(indicator.closest('.badge')).toHaveClass('bg-gray-500');
      expect(screen.getByText('•')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<StatusIndicator status="available" type="room" />);

      const indicator = screen.getByText('Available');
      expect(indicator.closest('.badge')).toHaveAttribute('role', 'status');
    });

    it('should be keyboard accessible', () => {
      render(<StatusIndicator status="available" type="room" />);

      const indicator = screen.getByText('Available');
      expect(indicator.closest('.badge')).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Status Color Consistency', () => {
    it('should use consistent colors for similar statuses across types', () => {
      const { rerender } = render(<StatusIndicator status="good" type="condition" />);
      const goodCondition = screen.getByText('Good');
      expect(goodCondition.closest('.badge')).toHaveClass('bg-blue-500');

      rerender(<StatusIndicator status="medium" type="priority" />);
      const mediumPriority = screen.getByText('Medium');
      expect(mediumPriority.closest('.badge')).toHaveClass('bg-blue-500');
    });

    it('should use red colors for negative/critical statuses', () => {
      const negativeStatuses = [
        { status: 'out_of_order', type: 'room' },
        { status: 'failed', type: 'task' },
        { status: 'emergency', type: 'priority' },
        { status: 'critical', type: 'condition' }
      ];

      negativeStatuses.forEach(({ status, type }) => {
        const { rerender } = render(<StatusIndicator status={status} type={type as any} />);
        const badge = screen.getByRole('status');
        expect(badge).toHaveClass(/bg-red-\d+/);
        rerender(<div />);
      });
    });

    it('should use green colors for positive/successful statuses', () => {
      const positiveStatuses = [
        { status: 'available', type: 'room' },
        { status: 'completed', type: 'task' },
        { status: 'in_stock', type: 'inventory' },
        { status: 'excellent', type: 'condition' }
      ];

      positiveStatuses.forEach(({ status, type }) => {
        const { rerender } = render(<StatusIndicator status={status} type={type as any} />);
        const badge = screen.getByRole('status');
        expect(badge).toHaveClass('bg-green-500');
        rerender(<div />);
      });
    });
  });
});
export type DashboardDateRange = 'all' | 'today' | 'this_week' | 'this_month' | 'this_quarter' | 'this_year';

export type DashboardRoleView = 'Super Admin' | 'Admin' | 'HR Manager' | 'Sales Manager' | 'Management / Director';

export interface DashboardFilterState {
  dateRange: DashboardDateRange;
  branch: string;
  department: string;
  employeeId: string;
  leadOwner: string;
  searchQuery: string;
}

export interface SmartAlert {
  id: string;
  module: 'lead' | 'hr' | 'document';
  urgency: 'critical' | 'high' | 'medium' | 'info';
  title: string;
  description: string;
  actionLabel?: string;
  targetTab?: string;
  data?: any;
}

export interface UnifiedActivityItem {
  id: string;
  module: 'lead' | 'hr' | 'document';
  timestamp: string;
  user: string;
  action: string;
  title: string;
  details?: string;
  badgeColor?: string;
}

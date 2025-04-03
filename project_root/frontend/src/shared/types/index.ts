// Example shared types - Define based on your actual data structures

export interface User {
  id: string;
  name: string;
  email: string;
  // Add other user properties
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  status: 'Pending' | 'Voting' | 'Passed' | 'Failed' | 'Executed' | 'Cancelled';
  proposer: string; // Address or User ID
  startDate?: string | number | Date;
  endDate?: string | number | Date;
  votes?: {
    yes: number;
    no: number;
    abstain: number;
  };
  // Add other proposal details
}

export interface VoteHistoryEntry {
  proposalId: string;
  proposalTitle: string; // Denormalized for easier display
  vote: 'Yes' | 'No' | 'Abstain';
  date: string | number | Date;
  transactionHash?: string;
}

export interface DashboardStats {
  activeUsers: number;
  totalProposals: number;
  activeProposals: number;
  totalVotesCast: number;
  // Add other relevant stats
}

export interface ChartDataPoint {
    label: string; // e.g., date or category
    value: number;
}

export interface ChartData {
    labels: string[];
    values: number[];
    // Or define a more structured type if needed:
    // dataPoints: ChartDataPoint[];
}

// Generic API response structure (example)
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
}
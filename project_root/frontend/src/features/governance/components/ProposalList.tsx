import React from 'react';
import type { Proposal } from '@/shared/types'; // Assuming Proposal type is defined globally
import { formatDate } from '@/shared/utilities/helpers'; // Import helper

// Helper to get status color (can remain JS or be TS)
const getStatusColor = (status: Proposal['status'] | undefined): string => {
  switch (status?.toLowerCase()) {
    case 'voting': return 'text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900';
    case 'passed': return 'text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900';
    case 'failed': return 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900';
    case 'pending': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900';
    case 'executed': return 'text-purple-600 bg-purple-100 dark:text-purple-300 dark:bg-purple-900';
    case 'cancelled': return 'text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-700';
    default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700';
  }
};

type VoteOption = 'Yes' | 'No' | 'Abstain';

interface ProposalListProps {
  proposals: Proposal[];
  onVote: (proposalId: string, voteOption: VoteOption) => void; // Function to handle voting action
  disabled?: boolean; // To disable voting buttons during submission
}

const ProposalList: React.FC<ProposalListProps> = ({ proposals, onVote, disabled = false }) => {
  if (!proposals || proposals.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">No proposals found.</p>;
  }

  return (
    <div className="space-y-4">
      {proposals.map((proposal) => (
        <div key={proposal.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200 flex flex-col md:flex-row justify-between items-start md:items-center">
          {/* Proposal Info */}
          <div className="flex-1 mb-3 md:mb-0 md:mr-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">{proposal.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Status: <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>{proposal.status}</span>
              {proposal.endDate && ` | Ends: ${formatDate(proposal.endDate)}`} {/* Use helper */}
            </p>
            {/* Add link to proposal details page if available */}
            {/* <Link to={`/governance/proposals/${proposal.id}`} className="text-sm text-blue-600 hover:underline mt-1 inline-block">View Details</Link> */}
          </div>

          {/* Voting Actions (Example) */}
          {proposal.status === 'Voting' && (
            <div className="flex space-x-2">
              {(['Yes', 'No', 'Abstain'] as VoteOption[]).map((option) => (
                 <button
                    key={option}
                    onClick={() => onVote(proposal.id, option)}
                    disabled={disabled}
                    className={`px-3 py-1 text-white rounded text-sm transition-colors
                      ${option === 'Yes' ? 'bg-green-500 hover:bg-green-600 disabled:bg-green-300' : ''}
                      ${option === 'No' ? 'bg-red-500 hover:bg-red-600 disabled:bg-red-300' : ''}
                      ${option === 'Abstain' ? 'bg-gray-400 hover:bg-gray-500 disabled:bg-gray-300' : ''}
                      disabled:cursor-not-allowed disabled:opacity-70
                    `}
                 >
                   Vote {option}
                 </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProposalList;
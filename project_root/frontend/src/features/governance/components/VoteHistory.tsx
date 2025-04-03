import React from 'react';
import type { VoteHistoryEntry } from '@/shared/types'; // Assuming type is defined globally
import { formatDate } from '@/shared/utilities/helpers'; // Import helper

interface VoteHistoryProps {
  history: VoteHistoryEntry[];
}

const VoteHistory: React.FC<VoteHistoryProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">You haven't voted on any proposals yet.</p>;
  }

  const getVoteColor = (vote: VoteHistoryEntry['vote']): string => {
    switch(vote) {
        case 'Yes': return 'text-green-600 dark:text-green-400';
        case 'No': return 'text-red-600 dark:text-red-400';
        case 'Abstain': return 'text-gray-600 dark:text-gray-400';
        default: return 'text-gray-600 dark:text-gray-400';
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Proposal Title
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Your Vote
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Date Voted
            </th>
            {/* Optional: Add link to proposal */}
            {/* <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Link
            </th> */}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {history.map((vote, index) => (
            <tr key={`${vote.proposalId}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{vote.proposalTitle}</td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getVoteColor(vote.vote)}`}>
                {vote.vote}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {formatDate(vote.date)} {/* Use helper */}
              </td>
              {/* Optional: Link */}
              {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400">
                <Link to={`/governance/proposals/${vote.proposalId}`} className="hover:underline">View</Link>
              </td> */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VoteHistory;
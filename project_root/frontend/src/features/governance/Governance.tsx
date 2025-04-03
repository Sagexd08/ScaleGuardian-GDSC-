import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  fetchProposals,
  submitVote,
  selectAllProposals,
  selectGovernanceStatus,
  selectVoteStatus,
  selectGovernanceError,
} from '@/store/slices/governance.slice';
import ProposalList from './components/ProposalList'; // Assuming ProposalList.tsx exists or is refactored
import VoteHistory from './components/VoteHistory'; // Assuming VoteHistory.tsx exists or is refactored
import LoadingSpinner from '@/shared/components/ui/LoadingSpinner'; // Assuming LoadingSpinner exists
import { toast } from 'react-hot-toast'; // For showing notifications

const Governance: React.FC = () => {
  const dispatch = useAppDispatch();
  const proposals = useAppSelector(selectAllProposals);
  const status = useAppSelector(selectGovernanceStatus);
  const voteStatus = useAppSelector(selectVoteStatus);
  const error = useAppSelector(selectGovernanceError);
  // const history = useAppSelector(selectVoteHistory); // Add selector for history if implemented

  // Fetch proposals on component mount
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchProposals());
    }
  }, [status, dispatch]);

  // Handle voting action
  const handleVote = async (proposalId: string, voteOption: 'Yes' | 'No' | 'Abstain') => {
    // Prevent double voting while one is in progress
    if (voteStatus === 'loading') return;

    try {
      // Dispatch the async thunk and wait for it to complete
      const resultAction = await dispatch(submitVote({ proposalId, voteOption }));

      // Check if the thunk fulfilled successfully
      if (submitVote.fulfilled.match(resultAction)) {
         toast.success(`Successfully voted '${voteOption}' on proposal ${proposalId.slice(0, 6)}...`);
        // Optionally refetch proposals to show updated status/counts
         dispatch(fetchProposals());
        // Or update local state optimistically (more complex)
      } else {
        // If the thunk was rejected, show the error
        let errorMessage = 'Failed to submit vote.';
        if (resultAction.payload) {
          errorMessage = `Vote failed: ${resultAction.payload}`;
        }
        toast.error(errorMessage);
      }
    } catch (err: any) {
       // Catch any unexpected errors during dispatch
      toast.error(`An unexpected error occurred: ${err?.message || 'Unknown error'}`);
    }
  };


  // Placeholder history data (replace with Redux state)
  const voteHistoryPlaceholder = [
     { proposalId: 'p2', proposalTitle: 'Fund Community Project X', vote: 'Yes' as const, date: '2024-07-18' },
     { proposalId: 'p3', proposalTitle: 'Update Protocol Parameter Y', vote: 'No' as const, date: '2024-07-05' },
  ];

  let content;
  if (status === 'loading' && proposals.length === 0) {
      content = <div className="flex justify-center items-center p-10"><LoadingSpinner /></div>;
  } else if (status === 'failed') {
      content = <p className="text-red-500 text-center p-4">Error loading proposals: {error}</p>;
  } else {
      content = <ProposalList proposals={proposals} onVote={handleVote} disabled={voteStatus === 'loading'} />;
  }


  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Governance</h1>
         {/* Optional: Button to create new proposal */}
         {/* <Button>Create Proposal</Button> */}
      </div>


      {/* Proposal Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Active & Recent Proposals</h2>
        {content}
        {voteStatus === 'loading' && <p className="text-sm text-blue-600 mt-2">Submitting vote...</p>}
      </section>

      {/* Voting History Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Your Voting History</h2>
        {/* Replace placeholder with actual data from Redux */}
        <VoteHistory history={voteHistoryPlaceholder} />
      </section>
    </div>
  );
};

export default Governance;
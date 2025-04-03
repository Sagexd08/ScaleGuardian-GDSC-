import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import apiClient from '@/shared/utilities/api';
import type { Proposal, VoteHistoryEntry } from '@/shared/types'; // Assuming types are defined globally

interface GovernanceState {
  proposals: Proposal[];
  history: VoteHistoryEntry[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  voteStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: GovernanceState = {
  proposals: [],
  history: [],
  status: 'idle',
  voteStatus: 'idle',
  error: null,
};

// Async Thunk for fetching proposals
export const fetchProposals = createAsyncThunk<
  Proposal[], // Return type
  void,       // Argument type (none needed here)
  { rejectValue: string }
>(
  'governance/fetchProposals',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<Proposal[]>('/governance/proposals'); // Adjust endpoint
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch proposals');
    }
  }
);

// Async Thunk for submitting a vote
export const submitVote = createAsyncThunk<
  { proposalId: string; voteOption: string }, // Return type (adjust as needed)
  { proposalId: string; voteOption: string }, // Argument type
  { rejectValue: string }
>(
  'governance/submitVote',
  async (voteData, { rejectWithValue }) => {
    try {
      // Adjust endpoint and payload as needed
      const response = await apiClient.post<{ success: boolean }>(`/governance/proposals/${voteData.proposalId}/vote`, { vote: voteData.voteOption });
      if (response.success) {
        return voteData; // Return original data on success or updated proposal maybe
      } else {
         return rejectWithValue('Vote submission failed');
      }
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to submit vote');
    }
  }
);

const governanceSlice = createSlice({
  name: 'governance',
  initialState,
  reducers: {
    // Add synchronous reducers if needed
  },
  extraReducers: (builder) => {
    builder
      // Fetch Proposals
      .addCase(fetchProposals.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProposals.fulfilled, (state, action: PayloadAction<Proposal[]>) => {
        state.status = 'succeeded';
        state.proposals = action.payload;
      })
      .addCase(fetchProposals.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Unknown error';
      })
      // Submit Vote
      .addCase(submitVote.pending, (state) => {
        state.voteStatus = 'loading';
        state.error = null; // Clear general error on new action
      })
      .addCase(submitVote.fulfilled, (state, action) => {
        state.voteStatus = 'succeeded';
        // Optionally update the specific proposal's status or user's vote count locally
        // Or trigger a refetch of proposals/history
        console.log('Vote successful:', action.payload);
      })
      .addCase(submitVote.rejected, (state, action) => {
        state.voteStatus = 'failed';
        state.error = action.payload ?? 'Unknown error'; // Set specific vote error maybe
      });
      // Add cases for fetching vote history etc.
  },
});

// Selectors
export const selectAllProposals = (state: RootState) => state.governance.proposals;
export const selectGovernanceStatus = (state: RootState) => state.governance.status;
export const selectVoteStatus = (state: RootState) => state.governance.voteStatus;
export const selectGovernanceError = (state: RootState) => state.governance.error;

// Export actions if needed: export const {} = governanceSlice.actions;
export default governanceSlice.reducer;
/**
 * DAO Interaction Module
 * 
 * This module provides functionality to interact with Decentralized Autonomous
 * Organizations (DAOs). It supports proposal creation, voting, delegation,
 * and querying governance information across different DAO frameworks.
 */

import BlockchainService from './blockchain.js';

class DAOService {
  /**
   * Initialize the DAO service
   * @param {Object} options - Configuration options
   * @param {BlockchainService} options.blockchainService - Blockchain service instance
   * @param {Object} options.daoContracts - Map of DAO contract information
   * @param {string} options.daoType - DAO framework type ('compound', 'aragon', 'openzeppelin', 'moloch', 'custom')
   * @param {Object} options.customInterfaces - Custom ABI interfaces for non-standard DAOs
   */
  constructor(options = {}) {
    this.blockchain = options.blockchainService || new BlockchainService();
    this.daoContracts = options.daoContracts || {};
    this.daoType = options.daoType || 'compound';
    this.customInterfaces = options.customInterfaces || {};
    
    // Framework-specific adapters
    this.adapters = {
      compound: {
        getProposals: this.getCompoundProposals.bind(this),
        createProposal: this.createCompoundProposal.bind(this),
        castVote: this.castCompoundVote.bind(this),
        delegate: this.delegateCompoundVotes.bind(this)
      },
      aragon: {
        getProposals: this.getAragonProposals.bind(this),
        createProposal: this.createAragonProposal.bind(this),
        castVote: this.castAragonVote.bind(this),
        delegate: this.delegateAragonVotes.bind(this)
      },
      openzeppelin: {
        getProposals: this.getOpenZeppelinProposals.bind(this),
        createProposal: this.createOpenZeppelinProposal.bind(this),
        castVote: this.castOpenZeppelinVote.bind(this),
        delegate: this.delegateOpenZeppelinVotes.bind(this)
      },
      moloch: {
        getProposals: this.getMolochProposals.bind(this),
        createProposal: this.createMolochProposal.bind(this),
        castVote: this.castMolochVote.bind(this),
        delegate: this.delegateMolochVotes.bind(this)
      },
      custom: {
        getProposals: this.getCustomProposals.bind(this),
        createProposal: this.createCustomProposal.bind(this),
        castVote: this.castCustomVote.bind(this),
        delegate: this.delegateCustomVotes.bind(this)
      }
    };
    
    console.log(`DAO Service initialized with ${this.daoType} framework`);
  }

  /**
   * Get the current adapter based on DAO type
   * @private
   * @returns {Object} - DAO adapter
   */
  getAdapter() {
    const adapter = this.adapters[this.daoType.toLowerCase()];
    
    if (!adapter) {
      throw new Error(`Unsupported DAO type: ${this.daoType}`);
    }
    
    return adapter;
  }

  /**
   * Get user's voting power
   * @param {string} [account] - Account address (defaults to current account)
   * @returns {Promise<string>} - Voting power
   */
  async getVotingPower(account) {
    try {
      const userAddress = account || this.blockchain.currentAccount;
      
      if (!userAddress) {
        throw new Error('No account specified');
      }
      
      let votingPower = '0';
      
      // Different DAO frameworks store voting power differently
      switch (this.daoType.toLowerCase()) {
        case 'compound':
          votingPower = await this.blockchain.callMethod(
            'token',
            'getCurrentVotes',
            [userAddress]
          );
          break;
          
        case 'openzeppelin':
          votingPower = await this.blockchain.callMethod(
            'token',
            'getVotes',
            [userAddress]
          );
          break;
          
        case 'aragon':
          // Aragon might use token balance as voting power
          votingPower = await this.blockchain.callMethod(
            'token',
            'balanceOf',
            [userAddress]
          );
          break;
          
        case 'moloch':
          // Moloch uses shares
          const member = await this.blockchain.callMethod(
            'moloch',
            'members',
            [userAddress]
          );
          votingPower = member ? member.shares : '0';
          break;
          
        case 'custom':
          // Use custom interface if provided
          if (this.customInterfaces.getVotingPower) {
            const { contractName, method, args } = this.customInterfaces.getVotingPower;
            votingPower = await this.blockchain.callMethod(
              contractName,
              method,
              [...(args || []), userAddress]
            );
          }
          break;
      }
      
      // Convert to human-readable format if needed
      if (typeof votingPower === 'string' && votingPower.length > 10) {
        return this.blockchain.web3.utils.fromWei(votingPower);
      }
      
      return votingPower.toString();
    } catch (error) {
      console.error('Error getting voting power:', error);
      throw error;
    }
  }

  /**
   * Get proposal details by ID
   * @param {string} proposalId - ID of the proposal
   * @returns {Promise<Object>} - Proposal details
   */
  async getProposal(proposalId) {
    try {
      const adapter = this.getAdapter();
      const proposal = await adapter.getProposal(proposalId);
      return this._normalizeProposal(proposal);
    } catch (error) {
      console.error('Error fetching proposal:', error);
      throw new Error(`Failed to get proposal: ${error.message}`);
    }
  }

  /** 
   * Get list of proposals
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of proposals to return
   * @param {number} options.offset - Number of proposals to skip
   * @param {string} options.status - Filter proposals by status ('pending', 'active', 'canceled', 'defeated', 'succeeded', 'queued', 'expired', 'executed')
   * @returns {Promise<Array<Object>>} - Array of proposal objects
   */
  async getProposals(options = {}) {
    try {
      const adapter = this.getAdapter();
      const proposals = await adapter.getProposals(options);
      return this._normalizeProposals(proposals);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      throw new Error(`Failed to get proposals: ${error.message}`);
    }
  }

  /**
   * Create a new proposal
   * @param {Object} proposal - Proposal details
   * @param {string} proposal.title - Proposal title
   * @param {string} proposal.description - Proposal description
   * @param {Array<Object>} proposal.actions - List of on-chain actions to execute
   * @returns {Promise<string>} - Transaction hash of proposal creation
   */
  async createProposal(proposal) {
    try {
      this._validateProposal(proposal);
      const votingPower = await this.getVotingPower();
      
      if (Number(votingPower) <= 0) {
        throw new Error('Insufficient voting power to create proposal');
      }

      const adapter = this.getAdapter();
      const txHash = await adapter.createProposal(proposal);
      return txHash;
    } catch (error) {
      console.error('Error creating proposal:', error);
      throw new Error(`Proposal creation failed: ${error.message}`);
    }
  }

  /**
   * Cast a vote on a proposal
   * @param {string} proposalId - ID of the proposal to vote on
   * @param {number} support - Vote direction (0 = against, 1 = for, 2 = abstain)
   * @param {string} [reason] - Optional voting reason
   * @returns {Promise<string>} - Transaction hash of vote cast
   */
  async castVote(proposalId, support, reason = '') {
    try {
      if (![0, 1, 2].includes(support)) {
        throw new Error('Invalid vote direction');
      }

      const hasVoted = await this.hasVoted(proposalId);
      if (hasVoted) {
        throw new Error('Already voted on this proposal');
      }

      const adapter = this.getAdapter();
      const txHash = await adapter.castVote(proposalId, support, reason);
      return txHash;
    } catch (error) {
      console.error('Error casting vote:', error);
      throw new Error(`Voting failed: ${error.message}`);
    }
  }

  /**
   * Delegate voting power to another address
   * @param {string} delegatee - Address to delegate voting power to
   * @returns {Promise<string>} - Transaction hash of delegation
   */
  async delegateVotes(delegatee) {
    try {
      if (!this.blockchain.web3.utils.isAddress(delegatee)) {
        throw new Error('Invalid delegatee address');
      }

      const adapter = this.getAdapter();
      const txHash = await adapter.delegate(delegatee);
      return txHash;
    } catch (error) {
      console.error('Error delegating votes:', error);
      throw new Error(`Vote delegation failed: ${error.message}`);
    }
  }

  /**
   * Check if an account has voted on a specific proposal
   * @param {string} proposalId - ID of the proposal
   * @param {string} [account] - Account address to check
   * @returns {Promise<boolean>} - Whether the account has voted
   */
  async hasVoted(proposalId, account) {
    try {
      const userAddress = account || this.blockchain.currentAccount;
      const adapter = this.getAdapter();
      
      switch (this.daoType.toLowerCase()) {
        case 'compound':
          return this.blockchain.callMethod(
            'governor',
            'hasVoted',
            [proposalId, userAddress]
          );
          
        case 'openzeppelin':
          const vote = await this.blockchain.callMethod(
            'governor',
            'getVotes',
            [proposalId, userAddress]
          );
          return vote.hasVoted;
          
        default:
          return adapter.hasVoted(proposalId, userAddress);
      }
    } catch (error) {
      console.error('Error checking vote status:', error);
      return false;
    }
  }

  /**
   * Normalize proposals from different DAO frameworks
   * @private
   * @param {Array<Object>} proposals - Raw proposals from adapter
   * @returns {Array<Object>} - Normalized proposals
   */
  _normalizeProposals(proposals) {
    return proposals.map(proposal => ({
      id: proposal.id.toString(),
      title: proposal.title || 'Untitled Proposal',
      description: proposal.description || '',
      status: this._mapStatus(proposal.status),
      startBlock: proposal.startBlock,
      endBlock: proposal.endBlock,
      forVotes: proposal.forVotes?.toString() || '0',
      againstVotes: proposal.againstVotes?.toString() || '0',
      abstainVotes: proposal.abstainVotes?.toString() || '0',
      actions: proposal.actions || []
    }));
  }

  /**
   * Map framework-specific status to normalized status
   * @private
   * @param {number|string} status - Raw status from DAO contract
   * @returns {string} - Normalized status
   */
  _mapStatus(status) {
    const statusMaps = {
      compound: ['pending', 'active', 'canceled', 'defeated', 'succeeded', 'queued', 'expired', 'executed'],
      aragon: ['pending', 'active', 'canceled', 'passed', 'rejected'],
      openzeppelin: ['pending', 'active', 'canceled', 'defeated', 'succeeded', 'queued', 'expired', 'executed'],
      moloch: ['sponsored', 'submitted', 'processed', 'cancelled', 'passed', 'failed']
    };

    const statusMap = statusMaps[this.daoType] || statusMaps.compound;
    return typeof status === 'number' 
      ? statusMap[status] || 'unknown'
      : status.toLowerCase();
  }

  /**
   * Validate proposal structure
   * @private
   * @param {Object} proposal - Proposal to validate
   */
  _validateProposal(proposal) {
    const requiredFields = ['title', 'description', 'actions'];
    const missingFields = requiredFields.filter(field => !proposal[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    if (proposal.actions.length === 0) {
      throw new Error('Proposal must contain at least one action');
    }

    if (proposal.title.length > 256) {
      throw new Error('Proposal title exceeds 256 character limit');
    }
  }

  /**
   * Get proposal details by ID
   * @param {string} proposalId - ID of the proposal
   * @returns {Promise<Object>} - Detailed proposal information
   */
  async getProposalDetails(proposalId) {
    try {
      const adapter = this.getAdapter();
      const proposal = await adapter.getProposalDetails(proposalId);
      return this._normalizeProposals([proposal])[0];
    } catch (error) {
      console.error('Error fetching proposal details:', error);
      throw new Error(`Failed to get proposal details: ${error.message}`);
    }
  }

  /**
   * Execute a succeeded proposal
   * @param {string} proposalId - ID of the proposal to execute
   * @returns {Promise<string>} - Transaction hash of execution
   */
  async executeProposal(proposalId) {
    try {
      const state = await this.getProposalState(proposalId);
      if (state !== 'succeeded') {
        throw new Error(`Proposal must be in succeeded state to execute (current: ${state})`);
      }

      const txHash = await this.blockchain.sendTransaction(
        'governor',
        'execute',
        [proposalId]
      );
      return txHash;
    } catch (error) {
      console.error('Error executing proposal:', error);
      throw new Error(`Proposal execution failed: ${error.message}`);
    }
  }

  /**
   * Get current state of a proposal
   * @param {string} proposalId - ID of the proposal
   * @returns {Promise<string>} - Current state of the proposal
   */
  async getProposalState(proposalId) {
    try {
      const stateCode = await this.blockchain.callMethod(
        'governor',
        'state',
        [proposalId]
      );
      return this._mapStatus(stateCode);
    } catch (error) {
      console.error('Error getting proposal state:', error);
      return 'unknown';
    }
  }

  /**
   * Listen to DAO-related events
   * @param {string} eventType - Type of event to listen for
   * @param {Function} callback - Callback function to handle events
   */
  listenToProposalEvents(eventType, callback) {
    const validEvents = ['ProposalCreated', 'VoteCast', 'ProposalExecuted'];
    
    if (!validEvents.includes(eventType)) {
      throw new Error(`Invalid event type: ${eventType}`);
    }

    this.blockchain.eventSystem.subscribe(
      'Governor',
      eventType,
      (event) => callback(this._normalizeEvent(event))
    );
  }

  /**
   * Normalize blockchain event format
   * @private
   * @param {Object} event - Raw blockchain event
   * @returns {Object} - Normalized event
   */
  _normalizeEvent(event) {
    return {
      event: event.event,
      address: event.address,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      args: event.returnValues
    };
  }
}

export default DAOService;
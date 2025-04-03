// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Governance
 * @dev Contract for handling decentralized governance of the moderation system
 */
contract Governance is AccessControl, Pausable {
    // Role definitions
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Token used for voting
    IERC20 public governanceToken;
    
    // Struct to hold proposal data
    struct Proposal {
        uint256 id;                // Unique identifier
        string title;              // Title of the proposal
        string description;        // Detailed description
        address proposer;          // Address of the proposer
        uint256 startTime;         // When voting begins
        uint256 endTime;           // When voting ends
        uint256 forVotes;          // Votes in favor
        uint256 againstVotes;      // Votes against
        bool executed;             // Whether the proposal was executed
        bool passed;               // Whether the proposal passed
        mapping(address => Vote) votes; // Track individual votes
    }
    
    // Vote structure
    enum Vote { None, For, Against }
    
    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        uint256 startTime,
        uint256 endTime
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        Vote vote,
        uint256 weight
    );
    
    event ProposalExecuted(
        uint256 indexed proposalId,
        bool passed
    );
    
    // Storage
    uint256 private proposalCount;
    mapping(uint256 => Proposal) private proposals;
    
    // Configuration
    uint256 public votingPeriod = 3 days;
    uint256 public executionDelay = 1 days;
    uint256 public quorum = 100 * 10**18; // 100 tokens
    
    /**
     * @dev Constructor to set up the governance contract
     * @param _governanceToken Address of the ERC20 token used for voting
     */
    constructor(address _governanceToken) {
        require(_governanceToken != address(0), "Invalid token address");
        
        governanceToken = IERC20(_governanceToken);
        
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        _setupRole(PROPOSER_ROLE, msg.sender);
    }
    
    /**
     * @dev Creates a new governance proposal
     * @param title Title of the proposal
     * @param description Detailed description of the proposal
     */
    function createProposal(
        string memory title,
        string memory description
    )
        external
        onlyRole(PROPOSER_ROLE)
        whenNotPaused
        returns (uint256)
    {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        
        uint256 proposalId = proposalCount++;
        
        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.title = title;
        newProposal.description = description;
        newProposal.proposer = msg.sender;
        newProposal.startTime = block.timestamp;
        newProposal.endTime = block.timestamp + votingPeriod;
        
        emit ProposalCreated(
            proposalId,
            msg.sender,
            title,
            block.timestamp,
            block.timestamp + votingPeriod
        );
        
        return proposalId;
    }
    
    /**
     * @dev Cast a vote on a proposal
     * @param proposalId ID of the proposal to vote on
     * @param support Whether to vote for or against
     */
    function castVote(uint256 proposalId, bool support)
        external
        whenNotPaused
    {
        require(proposalId < proposalCount, "Proposal does not exist");
        require(block.timestamp <= proposals[proposalId].endTime, "Voting has ended");
        require(proposals[proposalId].votes[msg.sender] == Vote.None, "Already voted");
        
        uint256 weight = governanceToken.balanceOf(msg.sender);
        require(weight > 0, "No voting power");
        
        Vote voteType = support ? Vote.For : Vote.Against;
        proposals[proposalId].votes[msg.sender] = voteType;
        
        if (support) {
            proposals[proposalId].forVotes += weight;
        } else {
            proposals[proposalId].againstVotes += weight;
        }
        
        emit VoteCast(proposalId, msg.sender, voteType, weight);
    }
    
    /**
     * @dev Execute a proposal after voting has ended
     * @param proposalId ID of the proposal to execute
     */
    function executeProposal(uint256 proposalId)
        external
        whenNotPaused
    {
        require(proposalId < proposalCount, "Proposal does not exist");
        require(block.timestamp > proposals[proposalId].endTime, "Voting has not ended");
        require(!proposals[proposalId].executed, "Already executed");
        
        Proposal storage proposal = proposals[proposalId];
        
        // Check quorum
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        require(totalVotes >= quorum, "Quorum not reached");
        
        // Determine if proposal passed
        bool passed = proposal.forVotes > proposal.againstVotes;
        
        // Update proposal status
        proposal.executed = true;
        proposal.passed = passed;
        
        emit ProposalExecuted(proposalId, passed);
        
        // Implementation would go here to enact the proposal if it passed
        // This could involve calling other contracts or updating parameters
    }
    
    /**
     * @dev Get proposal details
     * @param proposalId ID of the proposal to query
     */
    function getProposal(uint256 proposalId)
        external
        view
        returns (
            uint256 id,
            string memory title,
            string memory description,
            address proposer,
            uint256 startTime,
            uint256 endTime,
            uint256 forVotes,
            uint256 againstVotes,
            bool executed,
            bool passed
        )
    {
        require(proposalId < proposalCount, "Proposal does not exist");
        
        Proposal storage proposal = proposals[proposalId];
        
        return (
            proposal.id,
            proposal.title,
            proposal.description,
            proposal.proposer,
            proposal.startTime,
            proposal.endTime,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.executed,
            proposal.passed
        );
    }
    
    /**
     * @dev Check how an address voted on a proposal
     * @param proposalId ID of the proposal
     * @param voter Address to check
     */
    function getVoteStatus(uint256 proposalId, address voter)
        external
        view
        returns (Vote)
    {
        require(proposalId < proposalCount, "Proposal does not exist");
        return proposals[proposalId].votes[voter];
    }
    
    /**
     * @dev Get the total number of proposals
     */
    function getProposalCount()
        external
        view
        returns (uint256)
    {
        return proposalCount;
    }
    
    /**
     * @dev Update the voting period
     * @param newVotingPeriod New period in seconds
     */
    function setVotingPeriod(uint256 newVotingPeriod)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(newVotingPeriod > 0, "Voting period must be positive");
        votingPeriod = newVotingPeriod;
    }
    
    /**
     * @dev Update the execution delay
     * @param newExecutionDelay New delay in seconds
     */
    function setExecutionDelay(uint256 newExecutionDelay)
        external
        onlyRole(ADMIN_ROLE)
    {
        executionDelay = newExecutionDelay;
    }
    
    /**
     * @dev Update the quorum requirement
     * @param newQuorum New quorum amount in tokens
     */
    function setQuorum(uint256 newQuorum)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(newQuorum > 0, "Quorum must be positive");
        quorum = newQuorum;
    }
    
    /**
     * @dev Pauses the contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpauses the contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Adds a new proposer
     * @param account Address to grant role to
     */
    function addProposer(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(PROPOSER_ROLE, account);
    }
    
    /**
     * @dev Removes a proposer
     * @param account Address to revoke role from
     */
    function removeProposer(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(PROPOSER_ROLE, account);
    }
}
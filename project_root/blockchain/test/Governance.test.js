const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Governance", function () {
  let MockToken;
  let mockToken;
  let Governance;
  let governance;
  let owner;
  let proposer;
  let voter1;
  let voter2;
  let nonVoter;
  
  // Constants for tests
  const PROPOSER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("PROPOSER_ROLE"));
  const ADMIN_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN_ROLE"));
  
  beforeEach(async function () {
    // Get signers
    [owner, proposer, voter1, voter2, nonVoter] = await ethers.getSigners();
    
    // Deploy mock token
    MockToken = await ethers.getContractFactory("MockToken");
    mockToken = await MockToken.deploy("Governance Token", "GOV");
    await mockToken.deployed();
    
    // Mint tokens to voters
    await mockToken.mint(voter1.address, ethers.utils.parseEther("100"));
    await mockToken.mint(voter2.address, ethers.utils.parseEther("50"));
    
    // Deploy governance contract
    Governance = await ethers.getContractFactory("Governance");
    governance = await Governance.deploy(mockToken.address);
    await governance.deployed();
    
    // Grant proposer role
    await governance.grantRole(PROPOSER_ROLE, proposer.address);
  });
  
  describe("Deployment", function () {
    it("Should set the right token address", async function () {
      expect(await governance.governanceToken()).to.equal(mockToken.address);
    });
    
    it("Should set the right owner", async function () {
      expect(await governance.hasRole(ethers.constants.HashZero, owner.address)).to.equal(true);
    });
    
    it("Should assign the admin role to the owner", async function () {
      expect(await governance.hasRole(ADMIN_ROLE, owner.address)).to.equal(true);
    });
    
    it("Should assign the proposer role to the owner", async function () {
      expect(await governance.hasRole(PROPOSER_ROLE, owner.address)).to.equal(true);
    });
  });
  
  describe("Proposal Creation", function () {
    it("Should allow a proposer to create a proposal", async function () {
      const title = "Improve moderation policies";
      const description = "Update the content moderation guidelines to be more transparent";
      
      await expect(
        governance.connect(proposer).createProposal(title, description)
      ).to.emit(governance, "ProposalCreated");
      
      const proposalCount = await governance.getProposalCount();
      expect(proposalCount).to.equal(1);
      
      const proposal = await governance.getProposal(0);
      expect(proposal.title).to.equal(title);
      expect(proposal.description).to.equal(description);
      expect(proposal.proposer).to.equal(proposer.address);
      expect(proposal.executed).to.equal(false);
      expect(proposal.passed).to.equal(false);
    });
    
    it("Should not allow non-proposers to create proposals", async function () {
      await expect(
        governance.connect(nonVoter).createProposal(
          "Fake proposal",
          "This should not work"
        )
      ).to.be.reverted;
    });
    
    it("Should validate proposal inputs", async function () {
      await expect(
        governance.connect(proposer).createProposal(
          "",
          "Description without title"
        )
      ).to.be.revertedWith("Title cannot be empty");
      
      await expect(
        governance.connect(proposer).createProposal(
          "Title without description",
          ""
        )
      ).to.be.revertedWith("Description cannot be empty");
    });
  });
  
  describe("Voting", function () {
    beforeEach(async function () {
      // Create a proposal first
      await governance.connect(proposer).createProposal(
        "Test Proposal",
        "This is a test proposal for voting"
      );
    });
    
    it("Should allow token holders to vote", async function () {
      await expect(
        governance.connect(voter1).castVote(0, true)
      ).to.emit(governance, "VoteCast");
      
      const voteStatus = await governance.getVoteStatus(0, voter1.address);
      expect(voteStatus).to.equal(1); // Vote.For
      
      const proposal = await governance.getProposal(0);
      expect(proposal.forVotes).to.equal(ethers.utils.parseEther("100"));
      expect(proposal.againstVotes).to.equal(0);
    });
    
    it("Should not allow voting with no tokens", async function () {
      await expect(
        governance.connect(nonVoter).castVote(0, true)
      ).to.be.revertedWith("No voting power");
    });
    
    it("Should not allow voting on non-existent proposals", async function () {
      await expect(
        governance.connect(voter1).castVote(999, true)
      ).to.be.revertedWith("Proposal does not exist");
    });
    
    it("Should not allow duplicate votes", async function () {
      await governance.connect(voter1).castVote(0, true);
      
      await expect(
        governance.connect(voter1).castVote(0, false)
      ).to.be.revertedWith("Already voted");
    });
    
    it("Should not allow voting after the voting period ends", async function () {
      // Advance time beyond the voting period
      const votingPeriod = await governance.votingPeriod();
      await ethers.provider.send("evm_increaseTime", [votingPeriod.toNumber() + 1]);
      await ethers.provider.send("evm_mine");
      
      await expect(
        governance.connect(voter1).castVote(0, true)
      ).to.be.revertedWith("Voting has ended");
    });
    
    it("Should accurately count votes for and against", async function () {
      // Voter 1 votes for
      await governance.connect(voter1).castVote(0, true);
      
      // Voter 2 votes against
      await governance.connect(voter2).castVote(0, false);
      
      const proposal = await governance.getProposal(0);
      expect(proposal.forVotes).to.equal(ethers.utils.parseEther("100"));
      expect(proposal.againstVotes).to.equal(ethers.utils.parseEther("50"));
    });
  });
  
  describe("Proposal Execution", function () {
    beforeEach(async function () {
      // Create a proposal first
      await governance.connect(proposer).createProposal(
        "Test Proposal",
        "This is a test proposal for execution"
      );
      
      // Set a lower quorum for testing
      await governance.setQuorum(ethers.utils.parseEther("10"));
    });
    
    it("Should not allow execution before voting ends", async function () {
      // Vote to meet quorum
      await governance.connect(voter1).castVote(0, true);
      
      await expect(
        governance.executeProposal(0)
      ).to.be.revertedWith("Voting has not ended");
    });
    
    it("Should not allow execution without meeting quorum", async function () {
      // Advance time beyond the voting period
      const votingPeriod = await governance.votingPeriod();
      await ethers.provider.send("evm_increaseTime", [votingPeriod.toNumber() + 1]);
      await ethers.provider.send("evm_mine");
      
      // No votes cast, so quorum not met
      await expect(
        governance.executeProposal(0)
      ).to.be.revertedWith("Quorum not reached");
    });
    
    it("Should mark a proposal as passed when more votes for than against", async function () {
      // Cast votes
      await governance.connect(voter1).castVote(0, true);
      
      // Advance time
      const votingPeriod = await governance.votingPeriod();
      await ethers.provider.send("evm_increaseTime", [votingPeriod.toNumber() + 1]);
      await ethers.provider.send("evm_mine");
      
      // Execute proposal
      await expect(
        governance.executeProposal(0)
      ).to.emit(governance, "ProposalExecuted");
      
      const proposal = await governance.getProposal(0);
      expect(proposal.executed).to.equal(true);
      expect(proposal.passed).to.equal(true);
    });
    
    it("Should mark a proposal as failed when more votes against than for", async function () {
      // Cast votes
      await governance.connect(voter1).castVote(0, false);
      
      // Advance time
      const votingPeriod = await governance.votingPeriod();
      await ethers.provider.send("evm_increaseTime", [votingPeriod.toNumber() + 1]);
      await ethers.provider.send("evm_mine");
      
      // Execute proposal
      await governance.executeProposal(0);
      
      const proposal = await governance.getProposal(0);
      expect(proposal.executed).to.equal(true);
      expect(proposal.passed).to.equal(false);
    });
    
    it("Should not allow executing a proposal twice", async function () {
      // Cast votes
      await governance.connect(voter1).castVote(0, true);
      
      // Advance time
      const votingPeriod = await governance.votingPeriod();
      await ethers.provider.send("evm_increaseTime", [votingPeriod.toNumber() + 1]);
      await ethers.provider.send("evm_mine");
      
      // Execute proposal
      await governance.executeProposal(0);
      
      // Try to execute again
      await expect(
        governance.executeProposal(0)
      ).to.be.revertedWith("Already executed");
    });
  });
  
  describe("Configuration", function () {
    it("Should allow an admin to update the voting period", async function () {
      const newPeriod = 7 * 24 * 60 * 60; // 1 week
      await governance.setVotingPeriod(newPeriod);
      
      const votingPeriod = await governance.votingPeriod();
      expect(votingPeriod).to.equal(newPeriod);
    });
    
    it("Should allow an admin to update the execution delay", async function () {
      const newDelay = 2 * 24 * 60 * 60; // 2 days
      await governance.setExecutionDelay(newDelay);
      
      const executionDelay = await governance.executionDelay();
      expect(executionDelay).to.equal(newDelay);
    });
    
    it("Should allow an admin to update the quorum", async function () {
      const newQuorum = ethers.utils.parseEther("200");
      await governance.setQuorum(newQuorum);
      
      const quorum = await governance.quorum();
      expect(quorum).to.equal(newQuorum);
    });
    
    it("Should not allow non-admins to update configuration", async function () {
      await expect(
        governance.connect(nonVoter).setVotingPeriod(1000)
      ).to.be.reverted;
      
      await expect(
        governance.connect(nonVoter).setExecutionDelay(1000)
      ).to.be.reverted;
      
      await expect(
        governance.connect(nonVoter).setQuorum(ethers.utils.parseEther("10"))
      ).to.be.reverted;
    });
    
    it("Should validate configuration inputs", async function () {
      await expect(
        governance.setVotingPeriod(0)
      ).to.be.revertedWith("Voting period must be positive");
      
      await expect(
        governance.setQuorum(0)
      ).to.be.revertedWith("Quorum must be positive");
    });
  });
  
  describe("Role Management", function () {
    it("Should allow adding a proposer", async function () {
      await governance.addProposer(nonVoter.address);
      expect(await governance.hasRole(PROPOSER_ROLE, nonVoter.address)).to.equal(true);
    });
    
    it("Should allow removing a proposer", async function () {
      await governance.addProposer(nonVoter.address);
      await governance.removeProposer(nonVoter.address);
      expect(await governance.hasRole(PROPOSER_ROLE, nonVoter.address)).to.equal(false);
    });
    
    it("Should not allow non-admins to add proposers", async function () {
      await expect(
        governance.connect(nonVoter).addProposer(nonVoter.address)
      ).to.be.reverted;
    });
  });
  
  describe("Pausing", function () {
    it("Should allow an admin to pause the contract", async function () {
      await governance.pause();
      expect(await governance.paused()).to.equal(true);
    });
    
    it("Should allow an admin to unpause the contract", async function () {
      await governance.pause();
      await governance.unpause();
      expect(await governance.paused()).to.equal(false);
    });
    
    it("Should prevent proposal creation when paused", async function () {
      await governance.pause();
      
      await expect(
        governance.connect(proposer).createProposal(
          "Test Proposal",
          "This should fail"
        )
      ).to.be.revertedWith("Pausable: paused");
    });
    
    it("Should prevent voting when paused", async function () {
      // Create proposal first
      await governance.connect(proposer).createProposal(
        "Test Proposal",
        "This is a test proposal"
      );
      
      // Pause the contract
      await governance.pause();
      
      // Try to vote
      await expect(
        governance.connect(voter1).castVote(0, true)
      ).to.be.revertedWith("Pausable: paused");
    });
  });
});
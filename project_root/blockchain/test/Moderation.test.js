const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Moderation", function () {
  let Moderation;
  let moderation;
  let owner;
  let moderator;
  let admin;
  let user;
  
  // Constants for tests
  const MODERATOR_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MODERATOR_ROLE"));
  const ADMIN_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN_ROLE"));
  
  beforeEach(async function () {
    // Get signers
    [owner, moderator, admin, user] = await ethers.getSigners();
    
    // Deploy contract
    Moderation = await ethers.getContractFactory("Moderation");
    moderation = await Moderation.deploy();
    await moderation.deployed();
    
    // Grant roles
    await moderation.grantRole(MODERATOR_ROLE, moderator.address);
    await moderation.grantRole(ADMIN_ROLE, admin.address);
  });
  
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await moderation.hasRole(ethers.constants.HashZero, owner.address)).to.equal(true);
    });
    
    it("Should assign the admin role to the owner", async function () {
      expect(await moderation.hasRole(ADMIN_ROLE, owner.address)).to.equal(true);
    });
  });
  
  describe("Role Management", function () {
    it("Should allow adding a moderator", async function () {
      await moderation.addModerator(user.address);
      expect(await moderation.hasRole(MODERATOR_ROLE, user.address)).to.equal(true);
    });
    
    it("Should allow removing a moderator", async function () {
      await moderation.addModerator(user.address);
      await moderation.removeModerator(user.address);
      expect(await moderation.hasRole(MODERATOR_ROLE, user.address)).to.equal(false);
    });
    
    it("Should not allow non-admins to add moderators", async function () {
      await expect(
        moderation.connect(user).addModerator(user.address)
      ).to.be.reverted;
    });
  });
  
  describe("Moderation Records", function () {
    it("Should allow a moderator to add a moderation record", async function () {
      const contentId = "content123";
      const contentHash = "0x1234567890";
      const isFlagged = true;
      const categories = ["hate_speech", "violence"];
      const confidenceScore = 750;
      const reason = "Violates community guidelines";
      
      await expect(
        moderation.connect(moderator).addModerationRecord(
          contentId,
          contentHash,
          isFlagged,
          categories,
          confidenceScore,
          reason
        )
      ).to.emit(moderation, "ContentModerated");
      
      const recordCount = await moderation.getTotalRecords();
      expect(recordCount).to.equal(1);
      
      const record = await moderation.getModerationRecord(0);
      expect(record.contentId).to.equal(contentId);
      expect(record.contentHash).to.equal(contentHash);
      expect(record.isFlagged).to.equal(isFlagged);
      expect(record.categories).to.deep.equal(categories);
      expect(record.confidenceScore).to.equal(confidenceScore);
      expect(record.moderator).to.equal(moderator.address);
      expect(record.isOverruled).to.equal(false);
      expect(record.reason).to.equal(reason);
    });
    
    it("Should not allow non-moderators to add records", async function () {
      await expect(
        moderation.connect(user).addModerationRecord(
          "content123",
          "0x1234567890",
          true,
          ["hate_speech"],
          750,
          "Violates guidelines"
        )
      ).to.be.reverted;
    });
    
    it("Should validate input parameters", async function () {
      await expect(
        moderation.connect(moderator).addModerationRecord(
          "",  // Empty content ID
          "0x1234567890",
          true,
          ["hate_speech"],
          750,
          "Violates guidelines"
        )
      ).to.be.revertedWith("Content ID cannot be empty");
      
      await expect(
        moderation.connect(moderator).addModerationRecord(
          "content123",
          "",  // Empty content hash
          true,
          ["hate_speech"],
          750,
          "Violates guidelines"
        )
      ).to.be.revertedWith("Content hash cannot be empty");
      
      await expect(
        moderation.connect(moderator).addModerationRecord(
          "content123",
          "0x1234567890",
          true,
          ["hate_speech"],
          1001,  // Confidence score > 1000
          "Violates guidelines"
        )
      ).to.be.revertedWith("Confidence score must be between 0-1000");
    });
  });
  
  describe("Overruling", function () {
    beforeEach(async function () {
      // Add a moderation record first
      await moderation.connect(moderator).addModerationRecord(
        "content123",
        "0x1234567890",
        true,
        ["hate_speech"],
        750,
        "Violates guidelines"
      );
    });
    
    it("Should allow an admin to overrule a moderation decision", async function () {
      await expect(
        moderation.connect(admin).overruleModeration(0, "Content is acceptable")
      ).to.emit(moderation, "ModerationOverruled");
      
      const record = await moderation.getModerationRecord(0);
      expect(record.isOverruled).to.equal(true);
      expect(record.reason).to.equal("Content is acceptable");
    });
    
    it("Should not allow non-admins to overrule", async function () {
      await expect(
        moderation.connect(user).overruleModeration(0, "Content is acceptable")
      ).to.be.reverted;
      
      await expect(
        moderation.connect(moderator).overruleModeration(0, "Content is acceptable")
      ).to.be.reverted;
    });
    
    it("Should not allow overruling with empty reason", async function () {
      await expect(
        moderation.connect(admin).overruleModeration(0, "")
      ).to.be.revertedWith("Reason required for overruling");
    });
    
    it("Should not allow overruling non-existent records", async function () {
      await expect(
        moderation.connect(admin).overruleModeration(999, "Content is acceptable")
      ).to.be.revertedWith("Record does not exist");
    });
    
    it("Should not allow overruling already overruled records", async function () {
      await moderation.connect(admin).overruleModeration(0, "Content is acceptable");
      
      await expect(
        moderation.connect(admin).overruleModeration(0, "Another reason")
      ).to.be.revertedWith("Already overruled");
    });
  });
  
  describe("Record Retrieval", function () {
    beforeEach(async function () {
      // Add two moderation records for the same content
      await moderation.connect(moderator).addModerationRecord(
        "content123",
        "0x1234567890",
        true,
        ["hate_speech"],
        750,
        "First violation"
      );
      
      await moderation.connect(moderator).addModerationRecord(
        "content123",
        "0x1234567890",
        true,
        ["violence"],
        800,
        "Second violation"
      );
      
      // Add a record for different content
      await moderation.connect(moderator).addModerationRecord(
        "content456",
        "0x0987654321",
        false,
        [],
        300,
        "No violation"
      );
    });
    
    it("Should retrieve all records for a content ID", async function () {
      const recordIds = await moderation.getRecordsForContent("content123");
      expect(recordIds.length).to.equal(2);
      expect(recordIds[0]).to.equal(0);
      expect(recordIds[1]).to.equal(1);
      
      const otherRecordIds = await moderation.getRecordsForContent("content456");
      expect(otherRecordIds.length).to.equal(1);
      expect(otherRecordIds[0]).to.equal(2);
    });
    
    it("Should return correct total record count", async function () {
      const count = await moderation.getTotalRecords();
      expect(count).to.equal(3);
    });
    
    it("Should fail when requesting a non-existent record", async function () {
      await expect(
        moderation.getModerationRecord(999)
      ).to.be.revertedWith("Record does not exist");
    });
  });
  
  describe("Pausing", function () {
    it("Should allow an admin to pause the contract", async function () {
      await moderation.connect(admin).pause();
      expect(await moderation.paused()).to.equal(true);
    });
    
    it("Should allow an admin to unpause the contract", async function () {
      await moderation.connect(admin).pause();
      await moderation.connect(admin).unpause();
      expect(await moderation.paused()).to.equal(false);
    });
    
    it("Should not allow non-admins to pause", async function () {
      await expect(
        moderation.connect(user).pause()
      ).to.be.reverted;
      
      await expect(
        moderation.connect(moderator).pause()
      ).to.be.reverted;
    });
    
    it("Should prevent adding records when paused", async function () {
      await moderation.connect(admin).pause();
      
      await expect(
        moderation.connect(moderator).addModerationRecord(
          "content123",
          "0x1234567890",
          true,
          ["hate_speech"],
          750,
          "Violates guidelines"
        )
      ).to.be.revertedWith("Pausable: paused");
    });
    
    it("Should prevent overruling when paused", async function () {
      // Add a record first
      await moderation.connect(moderator).addModerationRecord(
        "content123",
        "0x1234567890",
        true,
        ["hate_speech"],
        750,
        "Violates guidelines"
      );
      
      // Pause the contract
      await moderation.connect(admin).pause();
      
      // Try to overrule
      await expect(
        moderation.connect(admin).overruleModeration(0, "Content is acceptable")
      ).to.be.revertedWith("Pausable: paused");
    });
  });
});
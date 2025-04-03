// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title Moderation
 * @dev Contract for handling content moderation with immutable logging
 */
contract Moderation is AccessControl, Pausable {
    // Role definitions
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Struct to hold content moderation data
    struct ModerationRecord {
        string contentId;          // ID of the content being moderated
        string contentHash;        // Hash of the content for verification
        bool isFlagged;            // Whether the content was flagged
        string[] categories;       // Categories the content was flagged for
        uint256 confidenceScore;   // Confidence score of the AI (0-1000)
        address moderator;         // Address of the moderator who confirmed the action
        uint256 timestamp;         // When the moderation occurred
        bool isOverruled;          // If the AI decision was overruled by a moderator
        string reason;             // Reason for moderation or overruling
    }

    // Event emitted when a new moderation record is created
    event ContentModerated(
        uint256 indexed recordId,
        string contentId,
        bool isFlagged,
        uint256 timestamp
    );

    // Event emitted when a moderation decision is overruled
    event ModerationOverruled(
        uint256 indexed recordId,
        address indexed moderator,
        string reason,
        uint256 timestamp
    );

    // Array to store all moderation records
    ModerationRecord[] private moderationRecords;

    // Mapping from content ID to array of record IDs
    mapping(string => uint256[]) private contentToRecords;

    // Constructor sets up roles
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Adds a new moderation record
     * @param contentId ID of the content
     * @param contentHash Hash of the content for verification
     * @param isFlagged Whether the content was flagged
     * @param categories Categories the content was flagged for
     * @param confidenceScore Confidence score (0-1000)
     * @param reason Reason for moderation
     */
    function addModerationRecord(
        string memory contentId,
        string memory contentHash,
        bool isFlagged,
        string[] memory categories,
        uint256 confidenceScore,
        string memory reason
    ) 
        external
        onlyRole(MODERATOR_ROLE)
        whenNotPaused
        returns (uint256)
    {
        require(bytes(contentId).length > 0, "Content ID cannot be empty");
        require(bytes(contentHash).length > 0, "Content hash cannot be empty");
        require(confidenceScore <= 1000, "Confidence score must be between 0-1000");

        uint256 recordId = moderationRecords.length;
        
        ModerationRecord memory record = ModerationRecord({
            contentId: contentId,
            contentHash: contentHash,
            isFlagged: isFlagged,
            categories: categories,
            confidenceScore: confidenceScore,
            moderator: msg.sender,
            timestamp: block.timestamp,
            isOverruled: false,
            reason: reason
        });
        
        moderationRecords.push(record);
        contentToRecords[contentId].push(recordId);
        
        emit ContentModerated(recordId, contentId, isFlagged, block.timestamp);
        
        return recordId;
    }

    /**
     * @dev Overrules a moderation decision
     * @param recordId ID of the record to overrule
     * @param reason Reason for overruling
     */
    function overruleModeration(
        uint256 recordId,
        string memory reason
    )
        external
        onlyRole(ADMIN_ROLE)
        whenNotPaused
    {
        require(recordId < moderationRecords.length, "Record does not exist");
        require(!moderationRecords[recordId].isOverruled, "Already overruled");
        require(bytes(reason).length > 0, "Reason required for overruling");
        
        moderationRecords[recordId].isOverruled = true;
        moderationRecords[recordId].reason = reason;
        
        emit ModerationOverruled(recordId, msg.sender, reason, block.timestamp);
    }

    /**
     * @dev Returns a moderation record
     * @param recordId ID of the record to fetch
     */
    function getModerationRecord(uint256 recordId)
        external
        view
        returns (
            string memory contentId,
            string memory contentHash,
            bool isFlagged,
            string[] memory categories,
            uint256 confidenceScore,
            address moderator,
            uint256 timestamp,
            bool isOverruled,
            string memory reason
        )
    {
        require(recordId < moderationRecords.length, "Record does not exist");
        
        ModerationRecord storage record = moderationRecords[recordId];
        
        return (
            record.contentId,
            record.contentHash,
            record.isFlagged,
            record.categories,
            record.confidenceScore,
            record.moderator,
            record.timestamp,
            record.isOverruled,
            record.reason
        );
    }

    /**
     * @dev Returns record IDs for a content ID
     * @param contentId Content ID to look up
     */
    function getRecordsForContent(string memory contentId)
        external
        view
        returns (uint256[] memory)
    {
        return contentToRecords[contentId];
    }

    /**
     * @dev Returns the total number of moderation records
     */
    function getTotalRecords()
        external
        view
        returns (uint256)
    {
        return moderationRecords.length;
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
     * @dev Adds a new moderator
     * @param account Address to grant role to
     */
    function addModerator(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(MODERATOR_ROLE, account);
    }
    
    /**
     * @dev Removes a moderator
     * @param account Address to revoke role from
     */
    function removeModerator(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(MODERATOR_ROLE, account);
    }
}
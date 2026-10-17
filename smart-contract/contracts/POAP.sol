// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IPOAPNFT {
    function mint(address to) external returns (uint256 tokenId);
}

/// @title POAPDapp
/// @notice Reusable attendance claim controller for sequential event NFT collections.
/// @dev Claim state is scoped by NFT collection so the same attendee may claim once per event.
contract POAPDapp is Ownable {
    address public poapNftContract;
    bytes32 public codeHash;
    uint256 public claimDeadline;

    mapping(address => bool) public admins;
    mapping(address => mapping(address => bool)) public hasClaimed;

    error NotAuthorized();
    error MintingDisabled();
    error InvalidCode();
    error MintingExpired();
    error AlreadyMinted();
    error InvalidDeadline();
    error InvalidCodeHash();
    error InvalidNFTContract();
    error ZeroAddress();

    modifier onlyAdmin() {
        if (msg.sender != owner() && !admins[msg.sender]) revert NotAuthorized();
        _;
    }

    event ClaimConfigured(address indexed nftContract, bytes32 indexed codeHash, uint256 claimDeadline);
    event EventActivated(address indexed nftContract, bytes32 indexed codeHash, uint256 claimDeadline);
    event NFTContractUpdated(address indexed newContract);
    event MintingStopped(address indexed previousContract);
    event AdminUpdated(address indexed admin, bool enabled);
    event AttendanceClaimed(address indexed attendee, address indexed nftContract, uint256 tokenId);

    constructor() {
        admins[msg.sender] = true;
        emit AdminUpdated(msg.sender, true);
    }

    /// @notice Atomically activate a new event collection and its claim settings.
    /// @dev This avoids briefly applying a previous event's code/deadline to a newly selected NFT.
    function activateEvent(
        address newContract,
        bytes32 newCodeHash,
        uint256 newClaimDeadline
    ) external onlyAdmin {
        _validateNFTContract(newContract);
        _validateClaim(newCodeHash, newClaimDeadline);

        poapNftContract = newContract;
        codeHash = newCodeHash;
        claimDeadline = newClaimDeadline;

        emit EventActivated(newContract, newCodeHash, newClaimDeadline);
        emit NFTContractUpdated(newContract);
        emit ClaimConfigured(newContract, newCodeHash, newClaimDeadline);
    }

    /// @notice Replace the code/deadline for the currently active event.
    /// @dev Existing claim state is preserved; already-claimed wallets remain claimed for this NFT.
    function configureClaim(bytes32 newCodeHash, uint256 newClaimDeadline) external onlyAdmin {
        address nft = poapNftContract;
        if (nft == address(0)) revert MintingDisabled();
        _validateClaim(newCodeHash, newClaimDeadline);

        codeHash = newCodeHash;
        claimDeadline = newClaimDeadline;
        emit ClaimConfigured(nft, newCodeHash, newClaimDeadline);
    }

    /// @notice Select an NFT collection but intentionally disable claims until configureClaim is called.
    /// @dev Prefer activateEvent for normal organizer workflows.
    function updateNFTContract(address newContract) external onlyAdmin {
        _validateNFTContract(newContract);
        poapNftContract = newContract;
        codeHash = bytes32(0);
        claimDeadline = 0;
        emit NFTContractUpdated(newContract);
    }

    function stopMinting() external onlyAdmin {
        address previous = poapNftContract;
        poapNftContract = address(0);
        codeHash = bytes32(0);
        claimDeadline = 0;
        emit MintingStopped(previous);
    }

    function mint(string calldata code) external {
        address nft = poapNftContract;
        if (nft == address(0)) revert MintingDisabled();
        if (block.timestamp > claimDeadline) revert MintingExpired();
        if (keccak256(abi.encodePacked(code)) != codeHash) revert InvalidCode();
        if (hasClaimed[nft][msg.sender]) revert AlreadyMinted();

        // Checks-effects-interactions: mark this attendee for this event before external mint.
        hasClaimed[nft][msg.sender] = true;
        uint256 tokenId = IPOAPNFT(nft).mint(msg.sender);
        emit AttendanceClaimed(msg.sender, nft, tokenId);
    }

    function addAdmin(address admin) external onlyOwner {
        if (admin == address(0)) revert ZeroAddress();
        admins[admin] = true;
        emit AdminUpdated(admin, true);
    }

    function removeAdmin(address admin) external onlyOwner {
        admins[admin] = false;
        emit AdminUpdated(admin, false);
    }

    function _validateNFTContract(address newContract) internal view {
        if (newContract == address(0) || newContract.code.length == 0) revert InvalidNFTContract();
    }

    function _validateClaim(bytes32 newCodeHash, uint256 newClaimDeadline) internal view {
        if (newCodeHash == bytes32(0)) revert InvalidCodeHash();
        if (newClaimDeadline <= block.timestamp) revert InvalidDeadline();
    }
}

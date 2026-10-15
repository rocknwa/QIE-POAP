// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IPOAPNFT {
    function mint(address to) external returns (uint256 tokenId);
}

/// @title POAPDapp
/// @notice Single-event attendance claim controller.
contract POAPDapp is Ownable {
    address public poapNftContract;
    bytes32 public codeHash;
    uint256 public claimDeadline;

    mapping(address => bool) public admins;
    mapping(address => bool) public hasClaimed;

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
        if (!admins[msg.sender]) revert NotAuthorized();
        _;
    }

    event ClaimConfigured(bytes32 indexed codeHash, uint256 claimDeadline);
    event NFTContractUpdated(address indexed newContract);
    event MintingStopped();
    event AdminUpdated(address indexed admin, bool enabled);
    event AttendanceClaimed(address indexed attendee, address indexed nftContract, uint256 tokenId);

    constructor() {
        admins[msg.sender] = true;
        emit AdminUpdated(msg.sender, true);
    }

    /// @notice Configure a claim without exposing the plaintext code in contract storage/events.
    /// @dev Frontends should compute keccak256(abi.encodePacked(code)) off-chain.
    function configureClaim(bytes32 newCodeHash, uint256 newClaimDeadline) external onlyAdmin {
        if (newCodeHash == bytes32(0)) revert InvalidCodeHash();
        if (newClaimDeadline <= block.timestamp) revert InvalidDeadline();
        codeHash = newCodeHash;
        claimDeadline = newClaimDeadline;
        emit ClaimConfigured(newCodeHash, newClaimDeadline);
    }

    function updateNFTContract(address newContract) external onlyAdmin {
        if (newContract == address(0) || newContract.code.length == 0) revert InvalidNFTContract();
        poapNftContract = newContract;
        emit NFTContractUpdated(newContract);
    }

    function stopMinting() external onlyAdmin {
        poapNftContract = address(0);
        emit MintingStopped();
    }

    function mint(string calldata code) external {
        address nft = poapNftContract;
        if (nft == address(0)) revert MintingDisabled();
        if (block.timestamp > claimDeadline) revert MintingExpired();
        if (keccak256(abi.encodePacked(code)) != codeHash) revert InvalidCode();
        if (hasClaimed[msg.sender]) revert AlreadyMinted();

        // Checks-effects-interactions: record the claim before calling the NFT contract.
        hasClaimed[msg.sender] = true;
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
}

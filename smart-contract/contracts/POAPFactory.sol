// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./EventPOAP.sol";

/// @title POAPFactory
/// @notice Deploys event-specific soulbound attendance NFT collections for PEOPLE.
/// @dev Only the owner or explicitly approved admins may create collections.
contract POAPFactory is Ownable {
    mapping(address => bool) public admins;

    event EventPOAPCreated(
        address indexed creator,
        address indexed poap,
        address indexed minter,
        string name,
        string symbol,
        string metadataURI
    );
    event AdminUpdated(address indexed admin, bool enabled);

    error NotAuthorized();
    error EmptyName();
    error EmptySymbol();
    error EmptyMetadataURI();
    error ZeroMinter();
    error ZeroAddress();

    modifier onlyAdmin() {
        if (!admins[msg.sender]) revert NotAuthorized();
        _;
    }

    constructor() {
        admins[msg.sender] = true;
        emit AdminUpdated(msg.sender, true);
    }

    function createEventPOAP(
        string calldata name_,
        string calldata symbol_,
        string calldata metadataURI_,
        address minter_
    ) external onlyAdmin returns (address poap) {
        if (bytes(name_).length == 0) revert EmptyName();
        if (bytes(symbol_).length == 0) revert EmptySymbol();
        if (bytes(metadataURI_).length == 0) revert EmptyMetadataURI();
        if (minter_ == address(0)) revert ZeroMinter();

        EventPOAP collection = new EventPOAP(name_, symbol_, metadataURI_, minter_);
        poap = address(collection);

        emit EventPOAPCreated(msg.sender, poap, minter_, name_, symbol_, metadataURI_);
    }

    /// @notice Owner-only factory administration. Admins can create collections but cannot grant privileges.
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

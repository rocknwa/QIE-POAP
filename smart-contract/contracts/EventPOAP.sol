// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title EventPOAP
/// @notice Non-transferable ERC-721 attendance credential for one event.
contract EventPOAP is ERC721 {
    address public immutable minter;
    string private _eventMetadataURI;
    uint256 public nextTokenId;

    error NotMinter();
    error ZeroAddress();
    error Soulbound();
    error ApprovalsDisabled();

    constructor(
        string memory name_,
        string memory symbol_,
        string memory metadataURI_,
        address minter_
    ) ERC721(name_, symbol_) {
        if (minter_ == address(0)) revert ZeroAddress();
        minter = minter_;
        _eventMetadataURI = metadataURI_;
    }

    function mint(address to) external returns (uint256 tokenId) {
        if (msg.sender != minter) revert NotMinter();
        if (to == address(0)) revert ZeroAddress();

        tokenId = nextTokenId++;
        _safeMint(to, tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721: invalid token ID");
        return _eventMetadataURI;
    }

    function approve(address, uint256) public pure override {
        revert ApprovalsDisabled();
    }

    function setApprovalForAll(address, bool) public pure override {
        revert ApprovalsDisabled();
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal override {
        if (from != address(0) && to != address(0)) revert Soulbound();
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }
}

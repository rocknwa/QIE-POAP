/*

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract POAPNFT is ERC721Enumerable, Ownable {
    uint256 public nextTokenId;

    constructor() ERC721("POAPNFT", "POAP") {}

    function mint(address to) external onlyOwner {
        _safeMint(to, nextTokenId);
        nextTokenId++;
    }

    // Override the transfer functionality of ERC721 to make it soulbound
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);

        require(from == address(0) || to == address(0), "Soulbound: Transfers are disabled");
    }
}*/
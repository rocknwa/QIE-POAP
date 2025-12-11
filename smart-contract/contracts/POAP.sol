// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IPOAPNFT {
    function mint(address to) external;
}

contract POAPDapp is Ownable {
    address public poapNftContract;
    string private validCode;
    uint256 private codeUpdateTime; // Timestamp of the last code update

    mapping(address => bool) private admins;

    // Custom errors for gas savings
    error NotAuthorized();
    error MintingDisabled();
    error InvalidCode();
    error MintingExpired();
    error AlreadyMinted();

    modifier onlyAdmin() {
        if (!admins[msg.sender]) revert NotAuthorized();
        _;
    }

    event CodeUpdated(string newCode);
    event NFTContractUpdated(address newContract);
    event MintingStopped();

    constructor() {
        admins[msg.sender] = true;
    }

    function updateCode(string calldata newCode) external onlyAdmin {
        validCode = newCode;
        codeUpdateTime = block.timestamp;
        emit CodeUpdated(newCode);
    }

    function updateNFTContract(address newContract) external onlyAdmin {
        poapNftContract = newContract;
        emit NFTContractUpdated(newContract);
    }

    function stopMinting() external onlyAdmin {
        poapNftContract = address(0);
        emit MintingStopped();
    }

    function mint(string calldata code) external {
        if (poapNftContract == address(0)) revert MintingDisabled();
        if (keccak256(abi.encodePacked(code)) != keccak256(abi.encodePacked(validCode))) revert InvalidCode();
        if (block.timestamp > codeUpdateTime + 24 days) revert MintingExpired();
        if (_hasMinted(msg.sender)) revert AlreadyMinted();

        IPOAPNFT(poapNftContract).mint(msg.sender);
    }

    function addAdmin(address _admin) external onlyOwner {
        admins[_admin] = true;
    }

    function removeAdmin(address _admin) external onlyOwner {
        admins[_admin] = false;
    }

    // Only admins can view the code
    function getCode() external view onlyAdmin returns (string memory) {
        return validCode;
    }

    // Mark as private and pure/view for gas saving
    function _hasMinted(address user) private view returns (bool) {
        IERC721 poapNft = IERC721(poapNftContract);
        return poapNft.balanceOf(user) > 0;
    }
}
 
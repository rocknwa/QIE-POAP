# POAP Smart Contract

This project implements a **Proof of Attendance Protocol (POAP)** system on Ethereum using Solidity smart contracts. It consists of two main contracts: `POAPDapp` and `POAPNFT`. The `POAPDapp` contract manages the issuance of soulbound NFTs, ensuring that only users with a valid, time-limited code can mint an NFT. The `POAPNFT` contract is an ERC721 token contract with soulbound properties, preventing token transfers after minting.

## Features

- **Admin-Controlled Minting**: Admins can update a valid code and NFT contract address, and stop minting when necessary.
- **Code-Based Access**: Users must provide a valid code to mint an NFT, with a 24-hour expiration period for each code.
- **Single Minting**: Each user can mint only one NFT to prevent duplicates.
- **Soulbound NFTs**: NFTs are non-transferable, ensuring they remain with the original recipient.
- **Comprehensive Testing**: Includes a full test suite covering deployment, admin management, code updates, minting, and soulbound restrictions.

## Prerequisites

To run this project, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Hardhat](https://hardhat.org/) (for development and testing)
- [OpenZeppelin Contracts](https://www.openzeppelin.com/contracts) (for ERC721 and Ownable implementations)
- [Git](https://git-scm.com/) (for version control)

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/rocknwa/PEOPLE.git
   cd PEOPLE
   cd smart-contract
   ```

2. **Install Dependencies**:
   Install the required npm packages:
   ```bash
   npm install
   ```

   Ensure the following dependencies are included in your `package.json`:
   ```json
   {
     "devDependencies": {
       "@nomicfoundation/hardhat-toolbox": "^5.0.0",
       "hardhat": "^2.22.10"
     },
     "dependencies": {
       "@openzeppelin/contracts": "^5.0.2"
     }
   }
   ```

3. **Set Up Hardhat Configuration**:
   Ensure your `hardhat.config.js` is configured. A sample configuration is:
 ```javascript
require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
   networks: {
  'qie-testnet': {
      url: 'https://rpc-testnet.qie.io/',
      accounts: [process.env.WALLET_KEY],
      gasPrice: 1000000000,
    },
  },

etherscan: {
    apiKey: {
      'qie-testnet': 'empty'
    },
    customChains: [
      {
        network: "qie-testnet",
        chainId: 12345,
        urls: {
          apiURL: "https://explorer-testnet.qie.io/api",
          browserURL: "https://explorer-testnet.qie.io"
        }
      }
    ]
  },
  sourcify: {
    enabled: false
  },
};
 
 
 ```

## Project Structure

```
poap-smart-contract/
├── contracts/
│   ├── POAPDapp.sol         # Main contract for managing POAP minting
│   ├── POAPNFT.sol         # ERC721 soulbound NFT contract
├── test/
│   ├── POAPDapp.js         # Test suite for POAPDapp and POAPNFT
├── hardhat.config.js       # Hardhat configuration
├── package.json            # Project dependencies
└── README.md               # Project documentation
```

## Contracts Overview

### POAPDapp
- **Purpose**: Manages the issuance of POAP NFTs with code-based access control.
- **Key Functions**:
  - `updateCode(string)`: Allows admins to set a new valid code (24-hour validity).
  - `updateNFTContract(address)`: Allows admins to update the NFT contract address.
  - `stopMinting()`: Disables minting by setting the NFT contract address to zero.
  - `mint(string)`: Mints an NFT to the caller if they provide a valid code, the code hasn't expired, and they haven't minted before.
  - `addAdmin(address)` / `removeAdmin(address)`: Manages admin permissions.
  - `getCode()`: Allows admins to view the current valid code.

### POAPNFT
- **Purpose**: Implements an ERC721 token with soulbound properties (non-transferable).
- **Key Features**:
  - Uses `ERC721Enumerable` for token enumeration.
  - Overrides `_beforeTokenTransfer` to prevent transfers, allowing only minting (from `address(0)`) and burning (to `address(0)`).
  - `mint(address)`: Mints a new NFT (currently public, see [Security Considerations](#security-considerations)).

## Usage

### Compiling Contracts
Compile the smart contracts using Hardhat:
```bash
npx hardhat compile
```

### Running Tests
Run the comprehensive test suite to verify contract functionality:
```bash
npx hardhat test
```

The test suite (`test/POAPDapp.js`) covers:
- Deployment and ownership setup
- Admin management (adding/removing admins)
- Code management (updating valid codes)
- NFT contract management (updating/stopping minting)
- Minting functionality (valid/invalid codes, expiration, double minting prevention)
- Soulbound restrictions (preventing NFT transfers)

 
- **Code Expiration**: Codes expire after 24 hours, but ensure admins update codes regularly to maintain security.
- **Admin Privileges**: Only trusted addresses should be added as admins to prevent unauthorized code or contract changes.

## Testing
The test suite (`test/POAPDapp.js`) includes 18 tests covering all major functionalities. To run:
```bash
npx hardhat test
```

Example test output:
```
  POAPDapp
    Deployment
      ✔ Should set the owner correctly
      ✔ Should set deployer as admin
    Admin Management
      ✔ Should allow owner to add admin
      ✔ Should allow owner to remove admin
      ✔ Should prevent non-owners from adding admins
    Code Management
      ✔ Should allow admin to update code
      ✔ Should prevent non-admins from updating code
    NFTConst Management
      ✔ Should allow admin to update NFT contract
      ✔ Should allow admin to stop minting
      ✔ Should prevent non-admins from updating NFT contract
    Minting
      ✔ Should allow minting with valid code
      ✔ Should prevent minting with invalid code
      ✔ Should prevent minting if contract is stopped
      ✔ Should prevent minting if code is expired
      ✔ Should prevent double minting
    Soulbound Restrictions
      ✔ Should allow minting (initial transfer from address(0))
      ✔ Should prevent transferring NFT to another address
      ✔ Should prevent safe transferring NFT to another address

  18 passing (4s)
```

Successfully verified contract "contracts/POAP.sol:POAPDapp" for network qie-testnet:
  - https://explorer-testnet.qie.io/address/0x807F3634e23ea6D91E7c683eFb86C3fB279eD3e3#code

  Successfully verified contract "contracts/POAPnfts.sol:POAPNFT" for network qie-testnet:
  - https://explorer-testnet.qie.io/address/0x3639dFd3A2a46a59dF535739341236a8B28CBE4C#code

## Contributing
Contributions are welcome! To contribute:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Make your changes and commit (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

Please ensure all tests pass and add new tests for any new functionality.


## Contact
For questions or support, contact anitherock44@gmail.com or open an issue on GitHub.
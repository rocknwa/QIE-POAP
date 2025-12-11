# Project Documentation: PEOPLE - Decentralized Proof of Attendance Token System

## Overview
PEOPLE is a decentralized application designed to automate the distribution of Proof of Attendance Tokens (NFTs) for event organizers, eliminating the manual stress of airdropping NFTs. It also serves as an educational platform, offering newbies a hands-on experience with dApps during onboarding programs. Built on QIE Blockchain, the DApp leverages smart contracts, a user-friendly frontend, and Web3 libraries to ensure accessibility and scalability.

### Problem Statement
- **Event Organizers**: Manually airdropping NFTs is time-consuming, error-prone, and costly.
- **New Users**: Lack of intuitive platforms to learn dApp interactions during Web3 onboarding.
PEOPLE solves these by automating NFT minting and providing a mobile-optimized, beginner-friendly interface.

### Solution
The DApp features a smart contract that handles code-based NFT minting, admin management, and ownership controls. The frontend, built with Next.js, Wagmi, and RainbowKit, offers a seamless experience for users to mint POAPs and for admins to manage the system. Future enhancements will scale the contract and introduce gasless minting.

## Current Development Stage
 

- **Smart Contract**: A functional POAP contract (`0xdF6A1Da673B623D9e1c6c538f4653d4429284429`) is deployed, supporting minting, code updates, NFT contract address management, and admin/owner roles. Features like code validation (e.g., `InvalidCode`, `MintingExpired`) and uniqueness are implemented.
- **Frontend**:
  - **Home Page (`HomeContent.tsx`)**: Users can connect wallets, enter codes, and mint POAP NFTs with real-time feedback (e.g., toast notifications, transaction confirmation).
  - **Admin Dashboard (`Dashboard.tsx`)**: Admins and owners can update codes, NFT contracts, stop minting, and manage admin roles. Clickable refresh for code and NFT contract displays is functional, with automatic refreshes post-transaction.
  - **Navigation (`RootLayout.tsx`)**: Includes a dropdown menu with a "Dashboard" link, styled for visibility (currently white background, black text).
- **Wallet Integration**: Wagmi and RainbowKit enable wallet connectivity, with mobile optimization for small screens (e.g., avatar-based account status).
- **Issues Addressed**: Resolved hydration errors, 404 static file errors (pending proper deployment), and TypeScript/ESLint issues (e.g., `any` type removal).
 

## User, Admin, and Owner Flows

### User Flow
1. **Access the DApp**:
   - Users visit the home page and see a call-to-action to collect POAPs.
2. **Wallet Connection**:
   - Click the ConnectButton (RainbowKit) to link a wallet (e.g., MetaMask). If disconnected, a message prompts connection.
3. **Minting Process**:
   - Enter a code provided by an event organizer in the input field.
   - Click "Claim POAP" to initiate minting.
   - **Validation**:
     - If no code or no wallet, displays an error (e.g., "Please connect your wallet" or "Please enter a valid code") via toast.
     - If valid, sends a transaction using `writeContractAsync` from Wagmi.
   - **Feedback**:
     - Shows a spinner during pending/confirming states.
     - On success, displays "Minting successful!" with the transaction hash.
4. **NFT Ownership**:
   - The minted POAP NFT is transferred to the user's wallet, verifiable on the blockchain.

### Admin Flow
1. **Access the Dashboard**:
   - Navigate to `/dashboard` via the "Explore" dropdown.
   - Only accessible if the connected wallet is an admin (determined by successful `getCode` call) or owner.
2. **View Current State**:
   - See "Current NFT Contract" and "Current Code" with clickable refresh buttons to update data from the contract.
3. **Manage Settings**:
   - **Update Code**: Enter a new code, click "Update Code" to submit a transaction, and refresh automatically on success.
   - **Update NFT Contract**: Input a new NFT contract address, submit, and refresh on success.
   - **Stop Minting**: Click "Stop Minting" to disable further minting (owner-only).
4. **Feedback**:
   - Toast notifications confirm actions (e.g., "Code updated successfully").
   - Spinners indicate pending/confirming states.

### Owner Flow
1. **Extended Access**:
   - In addition to admin privileges, owners (determined by the `owner` contract variable) can manage admin roles.
2. **Admin Management**:
   - **Add Admin**: Enter an address, click "Add Admin" to grant admin rights.
   - **Remove Admin**: Enter an address, click "Remove Admin" to revoke rights.
3. **Oversight**:
   - Monitor all admin actions and contract state via the dashboard.

## Technology Stack
- **Blockchain**: QIE Blockchain.
- **Smart Contract**: Solidity.
- **Frontend**: Next.js, TypeScript, Tailwind CSS.
- **Wallet Integration**: Wagmi (e.g., `useReadContract`, `useWriteContract`), RainbowKit (mobile-optimized UI).
- **Libraries**: React, react-toastify.

## Benefits and Problem Solving
- **Event Organizers**: Automates airdrops, reducing manual effort and errors.
- **Newbies**: Offers a guided minting experience, enhancing Web3 onboarding.

## Mobile Compatibility with Wagmi and RainbowKit
- **Wagmi**: Provides hooks for contract interaction, ensuring real-time updates on mobile devices. Its reactive nature adapts to wallet changes seamlessly.
- **RainbowKit**: Offers a compact wallet UI with avatar-based status on small screens, enhancing mobile usability.

## Future Enhancements

1. **Scalable Smart Contract**:
   - **NFT Contract Factory**: The POAP contract will evolve into a factory, enabling admins to deploy new NFT contracts effortlessly. The POAP contract will serve as the default owner, ensuring consistency and compatibility across all deployed NFT contracts.
   - **Multi-Admin Management**: Multiple admins can manage the smart contract and deploy NFT contracts simultaneously without interference. Each admin can create unique POAPs for different events, leveraging the same POAP contract infrastructure.

2. **Enhanced Admin Dashboard**:
   - **Simplified NFT Deployment**: Admins will upload images and metadata descriptions via an IPFS gateway to create and deploy NFT contracts. The interface will guide admins through the process, requiring no deep technical knowledge.
   - **Event Posting with Timestamp Categorization**: Admins will post event details (e.g., name, description, date) to the smart contract. The contract will use timestamps to categorize events into:
     - **Future Events**: Upcoming events (date > current timestamp).
     - **Past Events**: Completed events (date < current timestamp).
     - **Present Events**: Ongoing events (date within a configurable window, e.g., ±24 hours).
     This categorization will be reflected in the frontend, simplifying event discovery for users.

3. **User-Focused Features**:
   - **My POAPs Section**: A dedicated dashboard section will display all POAP NFTs claimed by the connected user. This will query the user's wallet address against the POAP contract to fetch minted NFTs, including metadata (e.g., event name, date) and IPFS-linked images. The section will support pagination for large collections and provide links to view NFTs on blockchain explorers.
   - **Web3 Community Links**: A new section on the home page will include curated links to join Web3 communities (e.g., Discord servers, Telegram groups, forums) related to events or POAPs. These links will be maintained by admins and updated to foster user engagement and networking.

4. **Gasless Minting**:
   - Implement gasless NFT minting for users. Tight security restrictions, such as rate limiting, code expiration, and allowlist integration, will prevent abuse and ensure gas savings are not exploited by malicious actors.

5. **Multiple POAP Support**:
   - Different admins can deploy their own NFT contracts compatible with the POAP contract, allowing multiple events to utilize the system without conflicts. Users can mint unique, verifiable POAP NFTs corresponding to their codes, with the system ensuring distinctiveness across all events.
  
   - If you want to test the project, send a message to anitherock44@gmail.com to add your wallet address as admin. Or clone the repo and re-deploy the smart contracts to play around with the Dapp

## Project Team Members
- **Therock Ani (CTO)**:
  - A seasoned blockchain developer with expertise in DeFi and DApp development, passionate about user-friendly solutions.
 

## Conclusion
PEOPLE is in alpha, with a functional core for minting and admin management. Future enhancements will scale the system, enhance accessibility, and optimize costs, making it a versatile platform for event organizers and Web3 newcomers.
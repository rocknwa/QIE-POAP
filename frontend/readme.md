# DApp Frontend

Welcome to the frontend repository of the PEOPLE (Proof of Attendance Protocol) DApp! This project provides a user-friendly interface for minting Proof of Attendance Tokens (NFTs) and managing event-related smart contract interactions. It aims to automate NFT airdrops for event organizers while offering newbies an accessible onboarding experience with decentralized applications (dApps).

## Project Overview

The PEOPLE frontend is built with Next.js, integrating Wagmi and RainbowKit for seamless Web3 interactions. It supports:
- **User Minting**: Claim POAP NFTs using event-specific codes.
- **Admin Dashboard**: Manage codes, NFT contracts, and minting status.
- **Mobile Compatibility**: Optimized for mobile devices using Wagmi and RainbowKit.

Future enhancements include gasless minting, an NFT contract factory, and user-focused features like event categorization and personal POAP galleries.

## Features

### Current Features
- **Home Page**: Users can connect their wallets, enter codes, and mint POAP NFTs with real-time feedback (toasts, spinners).
- **Admin Dashboard**: Admins and owners can update codes, NFT contracts, stop minting, and manage admin roles with clickable refresh options.
- **Navigation**: Dropdown menu with styled links (e.g., "Dashboard" with white background, black text).
- **Wallet Integration**: Supports MetaMask and other wallets via RainbowKit, with mobile-optimized UI.
 

### Future Enhancements
- **Enhanced Admin Dashboard**: Simplified NFT deployment via IPFS uploads and event posting with timestamp-based categorization (future, past, present events).
- **User Features**: "My POAPs" section to view claimed NFTs and links to join Web3 communities.
- **Gasless Minting**: Meta-transactions to eliminate gas fees, with security restrictions to prevent abuse.

## Getting Started

### Prerequisites
- Node.js (v18.x or later)
- npm or yarn
- MetaMask or another Ethereum wallet
- Access to QIE Blockchain testnet with the POAP contract deployed (address: `0x807F3634e23ea6D91E7c683eFb86C3fB279eD3e3`)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/rocknwa/PEOPLE.git
   cd PEOPLE
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Configure environment variables:
   - Create a `.env.local` file in the root directory.
   - Add the following (replace with your values):
     ```env
     NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_id
     ```
   - Obtain this from  [WalletConnect](https://cloud.walletconnect.com/).

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the app.

 

## Usage

### User Flow
1. Visit the home page and connect your wallet using the ConnectButton.
2. Enter an event code provided by an organizer.
3. Click "Claim POAP" to mint your NFT, receiving feedback via toasts.
4. View your NFT in your wallet or on a blockchain explorer.

### Admin/Owner Flow
1. Navigate to `/dashboard` via the "Explore" dropdown.
2. View current code and NFT contract with refresh options.
3. Update code or NFT contract, stop minting, or manage admins (owner-only) with real-time updates.
4. Receive toast notifications for all actions.
 

## Technologies
- **Framework**: Next.js (TypeScript)
- **Styling**: Tailwind CSS
- **Wallet**: Wagmi, RainbowKit
- **Notifications**: react-toastify
- **Icons**: react-icons
- **Deployment**: GitHub Pages (temporary), Vercel (recommended)

## Mobile Compatibility
- **Wagmi**: Provides reactive hooks (e.g., `useAccount`, `useWriteContract`) for real-time contract interactions on mobile.
- **RainbowKit**: Offers a compact wallet UI with avatar-based status on small screens, ensuring a seamless mobile experience.

## Contributing
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/new-feature`).
3. Commit changes (`git commit -m 'Add new feature'`).
4. Push to the branch (`git push origin feature/new-feature`).
5. Open a pull request with a clear description of changes.

### Guidelines
- Follow TypeScript and ESLint rules (e.g., no-explicit-any).
- Test on multiple devices/networks.
- Document new features in code comments.
 

## Project Team
- **Therock Ani (CTO)**: Seasoned blockchain developer.

## Acknowledgments
- Thanks to the open-source communities of Next.js, Wagmi, and RainbowKit for their tools.
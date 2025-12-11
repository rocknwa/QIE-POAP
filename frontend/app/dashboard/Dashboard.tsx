"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CgSpinner } from "react-icons/cg";
import { poapDappAbi } from "../constants"; // Adjusted path

export default function Dashboard() {
  const { address: accountAddress, isConnected, isConnecting } = useAccount();
  const contractAddress = "0x807F3634e23ea6D91E7c683eFb86C3fB279eD3e3"; // Ensure this matches the deployed contract

  const [newCode, setNewCode] = useState("");
  const [newNftContract, setNewNftContract] = useState("");
  const [adminToAdd, setAdminToAdd] = useState("");
  const [adminToRemove, setAdminToRemove] = useState("");

  // Read owner from contract
  const { data: ownerAddress, isLoading: isLoadingOwner, refetch: refetchOwner } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: poapDappAbi,
    functionName: "owner",
    // Only query when connected
  });

  // Read current code (only admins)
  const { data: currentCode, isLoading: isLoadingCode, isError: isCodeError, refetch: refetchCode } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: poapDappAbi,
    functionName: "getCode",
    account: accountAddress, // Pass account to enforce access control
  });

  // Read NFT contract address
  const { data: currentNftContract, isLoading: isLoadingNftContract, refetch: refetchNftContract } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: poapDappAbi,
    functionName: "poapNftContract",
  });

  // Infer admin status based on successful getCode call
  const isAdmin = !isLoadingCode && !isCodeError && currentCode !== undefined && currentCode !== null;

  // Check if the connected address is the owner
  const isOwner = !isLoadingOwner && ownerAddress === accountAddress;

  // Write contracts
  const { writeContract: updateCodeWrite, isPending: isPendingUpdateCode, data: updateCodeHash } = useWriteContract();
  const { isLoading: isConfirmingUpdateCode, isSuccess: isUpdateCodeSuccess } = useWaitForTransactionReceipt({ hash: updateCodeHash });

  const { writeContract: updateNftWrite, isPending: isPendingUpdateNft, data: updateNftHash } = useWriteContract();
  const { isLoading: isConfirmingUpdateNft, isSuccess: isUpdateNftSuccess } = useWaitForTransactionReceipt({ hash: updateNftHash });

  const { writeContract: stopMintingWrite, isPending: isPendingStopMinting, data: stopMintingHash } = useWriteContract();
  const { isLoading: isConfirmingStopMinting, isSuccess: isStopMintingSuccess } = useWaitForTransactionReceipt({ hash: stopMintingHash });

  const { writeContract: addAdminWrite, isPending: isPendingAddAdmin, data: addAdminHash } = useWriteContract();
  const { isLoading: isConfirmingAddAdmin, isSuccess: isAddAdminSuccess } = useWaitForTransactionReceipt({ hash: addAdminHash });

  const { writeContract: removeAdminWrite, isPending: isPendingRemoveAdmin, data: removeAdminHash } = useWriteContract();
  const { isLoading: isConfirmingRemoveAdmin, isSuccess: isRemoveAdminSuccess } = useWaitForTransactionReceipt({ hash: removeAdminHash });

  // Handlers with success feedback
  const handleUpdateCode = () => {
    if (!newCode.trim()) {
      toast.error("Please enter a valid code.", { position: "top-center", autoClose: 5000 });
      return;
    }
    updateCodeWrite({
      address: contractAddress as `0x${string}`,
      abi: poapDappAbi,
      functionName: "updateCode",
      args: [newCode],
    });
  };

  const handleUpdateNftContract = () => {
    if (!newNftContract.trim() || !/^0x[a-fA-F0-9]{40}$/.test(newNftContract)) {
      toast.error("Please enter a valid NFT contract address.", { position: "top-center", autoClose: 5000 });
      return;
    }
    updateNftWrite({
      address: contractAddress as `0x${string}`,
      abi: poapDappAbi,
      functionName: "updateNFTContract",
      args: [newNftContract as `0x${string}`],
    });
  };

  const handleStopMinting = () => {
    stopMintingWrite({
      address: contractAddress as `0x${string}`,
      abi: poapDappAbi,
      functionName: "stopMinting",
    });
  };

  const handleAddAdmin = () => {
    if (!adminToAdd.trim() || !/^0x[a-fA-F0-9]{40}$/.test(adminToAdd)) {
      toast.error("Please enter a valid admin address.", { position: "top-center", autoClose: 5000 });
      return;
    }
    addAdminWrite({
      address: contractAddress as `0x${string}`,
      abi: poapDappAbi,
      functionName: "addAdmin",
      args: [adminToAdd as `0x${string}`],
    });
  };

  const handleRemoveAdmin = () => {
    if (!adminToRemove.trim() || !/^0x[a-fA-F0-9]{40}$/.test(adminToRemove)) {
      toast.error("Please enter a valid admin address.", { position: "top-center", autoClose: 5000 });
      return;
    }
    removeAdminWrite({
      address: contractAddress as `0x${string}`,
      abi: poapDappAbi,
      functionName: "removeAdmin",
      args: [adminToRemove as `0x${string}`],
    });
  };

  // Effect for success notifications and initial refresh
  useEffect(() => {
    if (isConnected && !isConnecting) {
      refetchOwner();
      refetchCode();
      refetchNftContract();
    }
    if (isUpdateCodeSuccess && updateCodeHash) {
      toast.success("Code updated successfully!", { position: "top-center", autoClose: 5000 });
      setNewCode("");
      refetchCode();
    }
    if (isUpdateNftSuccess && updateNftHash) {
      toast.success("NFT contract updated successfully!", { position: "top-center", autoClose: 5000 });
      setNewNftContract("");
      refetchNftContract();
    }
    if (isStopMintingSuccess && stopMintingHash) {
      toast.success("Minting stopped successfully!", { position: "top-center", autoClose: 5000 });
    }
    if (isAddAdminSuccess && addAdminHash) {
      toast.success("Admin added successfully!", { position: "top-center", autoClose: 5000 });
      setAdminToAdd("");
    }
    if (isRemoveAdminSuccess && removeAdminHash) {
      toast.success("Admin removed successfully!", { position: "top-center", autoClose: 5000 });
      setAdminToRemove("");
    }
  }, [
    isConnected,
    isConnecting,
    isUpdateCodeSuccess,
    isUpdateNftSuccess,
    isStopMintingSuccess,
    isAddAdminSuccess,
    isRemoveAdminSuccess,
    updateCodeHash,
    updateNftHash,
    stopMintingHash,
    addAdminHash,
    removeAdminHash,
    refetchOwner,
    refetchCode,
    refetchNftContract,
  ]);

  // Handlers for refreshing
  const handleRefreshCode = () => {
    refetchCode();
  };

  const handleRefreshNftContract = () => {
    refetchNftContract();
  };

  return (
    <div id="webcrumbs">
      <div className="w-full max-w-[1440px] mx-auto bg-gradient-to-b from-purple-900 to-purple-700 min-h-screen px-4 sm:px-6 lg:px-8">
        <header className="p-4 sm:p-6 lg:p-8">
          <nav className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-purple-300">person</span>
              </div>
              <div>
                <h2 className="text-white font-semibold">
                  {accountAddress ? `${accountAddress.slice(0, 6)}...${accountAddress.slice(-4)}` : "Not Connected"}
                </h2>
                <p className="text-purple-200 text-sm">
                  {(isLoadingOwner || isLoadingCode) && isConnected ? "Loading..." : isOwner ? "Owner" : isAdmin ? "Admin" : "User"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all">
                <span className="material-symbols-outlined text-white">notifications</span>
              </button>
              <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all">
                <span className="material-symbols-outlined text-white">settings</span>
              </button>
            </div>
          </nav>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 space-y-6">
            <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>

            {/* Current State with Refresh */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white">Current NFT Contract</h3>
                <button
                  onClick={handleRefreshNftContract}
                  className="text-purple-200 hover:text-purple-100 transition-colors w-full text-left"
                  disabled={isLoadingNftContract}
                >
                  {isLoadingNftContract ? <CgSpinner className="animate-spin inline" /> : currentNftContract ? String(currentNftContract) : "Not set"}
                </button>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white">Current Code</h3>
                <button
                  onClick={handleRefreshCode}
                  className="text-purple-200 hover:text-purple-100 transition-colors w-full text-left"
                  disabled={isLoadingCode}
                >
                  {isLoadingCode ? <CgSpinner className="animate-spin inline" /> : currentCode ? String(currentCode) : "Not set"}
                </button>
              </div>
            </div>

            {/* Admin Actions */}
            {(isAdmin || isOwner) && (
              <div className="space-y-4">
                <div>
                  <label className="block text-purple-200 mb-1">Update Code</label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full p-2 rounded-lg bg-white/10 text-white"
                    placeholder="Enter new code"
                  />
                  <button
                    onClick={handleUpdateCode}
                    disabled={isPendingUpdateCode || isConfirmingUpdateCode}
                    className="mt-2 w-full p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50"
                  >
                    {isPendingUpdateCode || isConfirmingUpdateCode ? <CgSpinner className="animate-spin mx-auto" /> : "Update Code"}
                  </button>
                </div>

                <div>
                  <label className="block text-purple-200 mb-1">Update NFT Contract</label>
                  <input
                    type="text"
                    value={newNftContract}
                    onChange={(e) => setNewNftContract(e.target.value)}
                    className="w-full p-2 rounded-lg bg-white/10 text-white"
                    placeholder="0x..."
                  />
                  <button
                    onClick={handleUpdateNftContract}
                    disabled={isPendingUpdateNft || isConfirmingUpdateNft}
                    className="mt-2 w-full p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50"
                  >
                    {isPendingUpdateNft || isConfirmingUpdateNft ? <CgSpinner className="animate-spin mx-auto" /> : "Update NFT Contract"}
                  </button>
                </div>

                <button
                  onClick={handleStopMinting}
                  disabled={isPendingStopMinting || isConfirmingStopMinting}
                  className="w-full p-2 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50"
                >
                  {isPendingStopMinting || isConfirmingStopMinting ? <CgSpinner className="animate-spin mx-auto" /> : "Stop Minting"}
                </button>
              </div>
            )}

            {/* Owner Actions */}
            {isOwner && (
              <div className="space-y-4">
                <div>
                  <label className="block text-purple-200 mb-1">Add Admin</label>
                  <input
                    type="text"
                    value={adminToAdd}
                    onChange={(e) => setAdminToAdd(e.target.value)}
                    className="w-full p-2 rounded-lg bg-white/10 text-white"
                    placeholder="0x..."
                  />
                  <button
                    onClick={handleAddAdmin}
                    disabled={isPendingAddAdmin || isConfirmingAddAdmin}
                    className="mt-2 w-full p-2 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50"
                  >
                    {isPendingAddAdmin || isConfirmingAddAdmin ? <CgSpinner className="animate-spin mx-auto" /> : "Add Admin"}
                  </button>
                </div>

                <div>
                  <label className="block text-purple-200 mb-1">Remove Admin</label>
                  <input
                    type="text"
                    value={adminToRemove}
                    onChange={(e) => setAdminToRemove(e.target.value)}
                    className="w-full p-2 rounded-lg bg-white/10 text-white"
                    placeholder="0x..."
                  />
                  <button
                    onClick={handleRemoveAdmin}
                    disabled={isPendingRemoveAdmin || isConfirmingRemoveAdmin}
                    className="mt-2 w-full p-2 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50"
                  >
                    {isPendingRemoveAdmin || isConfirmingRemoveAdmin ? <CgSpinner className="animate-spin mx-auto" /> : "Remove Admin"}
                  </button>
                </div>
              </div>
            )}

            {!isConnected && (
              <div className="text-center text-purple-200">Please connect your wallet to access the dashboard.</div>
            )}
          </div>
        </header>
      </div>
      <ToastContainer />
    </div>
  );
}

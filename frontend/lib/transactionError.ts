export function transactionErrorMessage(
  error: unknown,
  fallback = "The transaction could not be completed. Please try again."
): string {
  const raw =
    error instanceof Error
      ? `${error.name} ${error.message} ${(error as Error & { shortMessage?: string }).shortMessage || ""}`
      : String(error ?? "");

  const message = raw.toLowerCase();

  if (
    message.includes("insufficient funds") ||
    message.includes("insufficient balance") ||
    message.includes("funds for gas") ||
    message.includes("exceeds balance") ||
    message.includes("intrinsic transaction cost") ||
    message.includes("insufficient funds for intrinsic transaction cost") ||
    message.includes("insufficient funds for gas * price + value")
  ) {
    return "Insufficient BOT balance to pay network gas.";
  }

  if (
    message.includes("user rejected") ||
    message.includes("user denied") ||
    message.includes("rejected the request") ||
    message.includes("request rejected")
  ) {
    return "Transaction cancelled.";
  }

  if (message.includes("invalidcode") || message.includes("invalid code")) {
    return "That event code is not valid. Check the code and try again.";
  }

  if (
    message.includes("alreadyminted") ||
    message.includes("already minted") ||
    message.includes("already claimed")
  ) {
    return "This wallet has already claimed this event.";
  }

  if (
    message.includes("mintingexpired") ||
    message.includes("claimexpired") ||
    message.includes("claim expired")
  ) {
    return "The claim period for this event has ended.";
  }

  if (
    message.includes("mintingdisabled") ||
    message.includes("minting disabled")
  ) {
    return "Claims are currently disabled for this event.";
  }

  if (
    message.includes("notauthorized") ||
    message.includes("not authorized") ||
    message.includes("ownable: caller is not the owner")
  ) {
    return "This wallet is not authorized to perform that action.";
  }

  if (
    message.includes("invaliddeadline") ||
    message.includes("invalid deadline")
  ) {
    return "The claim deadline must be in the future.";
  }

  if (
    message.includes("invalidnftcontract") ||
    message.includes("invalid nft contract")
  ) {
    return "The selected NFT contract is not valid.";
  }

  if (
    message.includes("execution reverted") ||
    message.includes("transaction reverted") ||
    message.includes("reverted without a reason")
  ) {
    return fallback;
  }

  if (
    message.includes("network") ||
    message.includes("rpc") ||
    message.includes("timeout") ||
    message.includes("failed to fetch")
  ) {
    return "The Bohr network could not be reached. Please try again.";
  }

  return fallback;
}

 function collectErrorText(error: unknown): string {
  const seen = new Set<unknown>();
  const parts: string[] = [];

  function walk(value: unknown, depth = 0) {
    if (value == null || depth > 5 || seen.has(value)) return;

    if (typeof value === "string") {
      parts.push(value);
      return;
    }

    if (typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") {
      parts.push(String(value));
      return;
    }

    if (typeof value !== "object") return;

    seen.add(value);

    const obj = value as Record<string, unknown>;

    for (const key of [
      "name",
      "message",
      "shortMessage",
      "details",
      "reason",
      "code",
      "data",
      "metaMessages",
      "cause",
    ]) {
      if (key in obj) {
        walk(obj[key], depth + 1);
      }
    }
  }

  walk(error);

  return parts.join(" ").toLowerCase();
}

export function transactionErrorMessage(
  error: unknown,
  fallback = "The transaction could not be completed. Please try again."
): string {
  const message = collectErrorText(error);

  if (
    message.includes("insufficient funds") ||
    message.includes("insufficient balance") ||
    message.includes("funds for gas") ||
    message.includes("exceeds balance") ||
    message.includes("intrinsic transaction cost") ||
    message.includes("gas * price + value") ||
    message.includes("max fee per gas less than block base fee") ||
    message.includes("cannot afford tx gas")
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
    message.includes("invalidcode") ||
    message.includes("invalid code")
  ) {
    return "The event claim code changed before this transaction completed. Refresh and try again.";
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
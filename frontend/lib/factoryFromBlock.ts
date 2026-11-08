import { POAP_FACTORY_DEPLOY_BLOCK } from "../app/botchain";

/** First block to scan for POAPFactory logs. */
export function factoryFromBlock(): bigint {
  return BigInt(POAP_FACTORY_DEPLOY_BLOCK);
}

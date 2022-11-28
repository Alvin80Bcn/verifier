import { Cell, Address, toNano } from "ton";
import { useSubmitSources } from "./useSubmitSources";
import { hasOnchainProof } from "./useLoadContractProof";
import { useLoadContractInfo } from "./useLoadContractInfo";
import { useSendTXN } from "./useSendTxn";
import { AnalyticsAction, sendAnalyticsEvent } from "./googleAnalytics";
import { useEffect } from "react";

export function usePublishProof() {
  const { data: submitSourcesData } = useSubmitSources();
  const { data: contractInfo } = useLoadContractInfo();

  const { sendTXN, data, clearTXN } = useSendTXN("publishProof", async (count: number) => {
    const hasIpfsLink = await hasOnchainProof(contractInfo!.hash);

    if (count > 20) {
      return "error";
    }

    return hasIpfsLink ? "success" : "issued";
  });

  useEffect(() => {
    switch (data.status) {
      case "pending":
        sendAnalyticsEvent(AnalyticsAction.PUBLISH_CLICK);
        break;
      case "issued":
        sendAnalyticsEvent(AnalyticsAction.TRANSACTION_ISSUED);
        break;
      case "rejected":
        sendAnalyticsEvent(AnalyticsAction.TRANSACTION_REJECTED);
        break;
      case "error":
        sendAnalyticsEvent(AnalyticsAction.TRANSACTION_ERROR);
        break;
      case "expired":
        sendAnalyticsEvent(AnalyticsAction.TRANSACTION_EXPIRED);
        break;
      case "success":
        sendAnalyticsEvent(AnalyticsAction.CONTRACT_DEPLOYED);
        break;
    }
  }, [data.status]);

  return {
    sendTXN: () => {
      sendTXN(
        Address.parse(import.meta.env.VITE_VERIFIER_REGISTRY),
        toNano(0.1),
        Cell.fromBoc(Buffer.from(submitSourcesData!.result.msgCell!))[0],
      );
    },
    status: data.status,
    clearTXN,
  };
}

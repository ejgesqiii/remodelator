import { useState } from "react";

import { DEFAULT_BILLING_FORM, DEFAULT_STATUS_TARGET, DEFAULT_STRIPE_SIM_FORM } from "./defaults";
import { BillingMutationResult, BillingPolicy, BillingProviderStatus, BillingSubscriptionState } from "../types";

export function useOutputState() {
  const [proposalPdfPath, setProposalPdfPath] = useState("");
  const [proposalPdfResult, setProposalPdfResult] = useState("");
  const [estimateExportPath, setEstimateExportPath] = useState("");
  const [estimateExportResult, setEstimateExportResult] = useState("");

  const [billingAmount, setBillingAmount] = useState(DEFAULT_BILLING_FORM.amount);
  const [billingDetails, setBillingDetails] = useState(DEFAULT_BILLING_FORM.details);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [stripeCustomerEmail, setStripeCustomerEmail] = useState(DEFAULT_STRIPE_SIM_FORM.customerEmail);
  const [stripeCardLast4, setStripeCardLast4] = useState(DEFAULT_STRIPE_SIM_FORM.cardLast4);
  const [stripeSubscriptionId, setStripeSubscriptionId] = useState("sub_demo_001");
  const [stripeCancelReason, setStripeCancelReason] = useState("customer_requested");
  const [statusTarget, setStatusTarget] = useState(DEFAULT_STATUS_TARGET);

  const [proposalPreview, setProposalPreview] = useState("");
  const [billingResponse, setBillingResponse] = useState<BillingMutationResult | null>(null);
  const [billingPolicy, setBillingPolicy] = useState<BillingPolicy | null>(null);
  const [billingProviderStatus, setBillingProviderStatus] = useState<BillingProviderStatus | null>(null);
  const [subscriptionState, setSubscriptionState] = useState<BillingSubscriptionState | null>(null);

  return {
    proposalPdfPath,
    setProposalPdfPath,
    proposalPdfResult,
    setProposalPdfResult,
    estimateExportPath,
    setEstimateExportPath,
    estimateExportResult,
    setEstimateExportResult,
    billingAmount,
    setBillingAmount,
    billingDetails,
    setBillingDetails,
    idempotencyKey,
    setIdempotencyKey,
    stripeCustomerEmail,
    setStripeCustomerEmail,
    stripeCardLast4,
    setStripeCardLast4,
    stripeSubscriptionId,
    setStripeSubscriptionId,
    stripeCancelReason,
    setStripeCancelReason,
    statusTarget,
    setStatusTarget,
    proposalPreview,
    setProposalPreview,
    billingResponse,
    setBillingResponse,
    billingPolicy,
    setBillingPolicy,
    billingProviderStatus,
    setBillingProviderStatus,
    subscriptionState,
    setSubscriptionState,
  };
}

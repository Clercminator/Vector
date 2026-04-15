export const BILLING_RETURN_SYNC_STORAGE_KEY = "vector.billing.return_sync";

const PAYMENT_SYNC_MAX_AGE_MS = 45 * 60 * 1000;
const PAYMENT_TIMESTAMP_SKEW_MS = 5 * 60 * 1000;

interface PaymentReturnRouteOptions {
  purchaseType?: string | null;
  provider?: string | null;
  tier?: string | null;
  creditPackId?: string | null;
  creditsAmount?: number | null;
  currentTier?: string | null;
  currentCredits?: number | null;
  currentExtraCredits?: number | null;
  startedAt?: number;
  paymentStatus?: "started" | "returned";
}

export interface PendingPaymentSyncRecord {
  token: string;
  provider: string | null;
  purchaseType: string | null;
  tier: string | null;
  creditPackId: string | null;
  creditsAmount: number | null;
  currentTier: string | null;
  currentCredits: number | null;
  currentExtraCredits: number | null;
  startedAt: number;
  paymentStatus: "started" | "returned";
}

export interface PaymentSyncProfileSnapshot {
  tier?: string | null;
  credits?: number | null;
  extraCredits?: number | null;
}

export interface PaymentSyncSubscriptionSnapshot {
  provider?: string | null;
  tier?: string | null;
  status?: string | null;
}

export interface PaymentSyncPaymentSnapshot {
  provider?: string | null;
  tier?: string | null;
  paymentType?: string | null;
  status?: string | null;
  createdAt?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface PendingPaymentSyncSnapshot {
  profile?: PaymentSyncProfileSnapshot | null;
  subscription?: PaymentSyncSubscriptionSnapshot | null;
  payments?: PaymentSyncPaymentSnapshot[] | null;
}

function normalizeString(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function getTierRank(tier: string | null | undefined): number {
  const normalized = normalizeString(tier)?.toLowerCase();

  switch (normalized) {
    case "enterprise":
      return 3;
    case "max":
      return 2;
    case "builder":
      return 1;
    default:
      return 0;
  }
}

function getBrowserStorage(kind: "local" | "session"): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function getSyncStorages(): Storage[] {
  return [getBrowserStorage("local"), getBrowserStorage("session")].filter(
    (storage): storage is Storage => Boolean(storage),
  );
}

function parsePendingPaymentSyncRecord(
  rawValue: string | null,
): PendingPaymentSyncRecord | null {
  const normalized = rawValue?.trim();
  if (!normalized) {
    return null;
  }

  if (normalized.startsWith("{")) {
    try {
      const parsed = JSON.parse(
        normalized,
      ) as Partial<PendingPaymentSyncRecord>;
      const token = normalizeString(parsed.token);
      const provider = normalizeString(parsed.provider);
      const purchaseType = normalizeString(parsed.purchaseType);
      const startedAt =
        typeof parsed.startedAt === "number" &&
        Number.isFinite(parsed.startedAt)
          ? parsed.startedAt
          : Date.now();

      if (!token || !provider || !purchaseType) {
        return null;
      }

      return {
        token,
        provider,
        purchaseType,
        tier: normalizeString(parsed.tier),
        creditPackId: normalizeString(parsed.creditPackId),
        creditsAmount:
          typeof parsed.creditsAmount === "number" &&
          Number.isFinite(parsed.creditsAmount)
            ? parsed.creditsAmount
            : null,
        currentTier: normalizeString(parsed.currentTier),
        currentCredits:
          typeof parsed.currentCredits === "number" &&
          Number.isFinite(parsed.currentCredits)
            ? parsed.currentCredits
            : null,
        currentExtraCredits:
          typeof parsed.currentExtraCredits === "number" &&
          Number.isFinite(parsed.currentExtraCredits)
            ? parsed.currentExtraCredits
            : null,
        startedAt,
        paymentStatus:
          parsed.paymentStatus === "returned" ? "returned" : "started",
      };
    } catch {
      return null;
    }
  }

  const [provider, purchaseType, tier] = normalized.split(":");
  if (!provider || !purchaseType) {
    return null;
  }

  return {
    token: normalized,
    provider,
    purchaseType,
    tier: tier ?? null,
    creditPackId: null,
    creditsAmount: null,
    currentTier: null,
    currentCredits: null,
    currentExtraCredits: null,
    startedAt: Date.now(),
    paymentStatus: "returned",
  };
}

function isSuccessfulPaymentStatus(status: string | null | undefined): boolean {
  const normalized = normalizeString(status)?.toLowerCase();
  return normalized
    ? ["approved", "authorized", "processed", "paid", "active"].includes(
        normalized,
      )
    : false;
}

function isRecentPaymentRecord(
  payment: PaymentSyncPaymentSnapshot,
  startedAt: number,
): boolean {
  const createdAt = normalizeString(payment.createdAt);
  if (!createdAt) {
    return false;
  }

  const createdAtTimestamp = Date.parse(createdAt);
  if (Number.isNaN(createdAtTimestamp)) {
    return false;
  }

  return createdAtTimestamp + PAYMENT_TIMESTAMP_SKEW_MS >= startedAt;
}

function matchesExtraCreditPayment(
  record: PendingPaymentSyncRecord,
  payment: PaymentSyncPaymentSnapshot,
): boolean {
  if (normalizeString(payment.paymentType)?.toLowerCase() !== "one_time") {
    return false;
  }

  const metadata = payment.metadata ?? {};
  const purchaseType = normalizeString(
    typeof metadata === "object" && metadata !== null
      ? String(
          (metadata as Record<string, unknown>).purchase_type ??
            "extra_credits",
        )
      : null,
  )?.toLowerCase();

  if (purchaseType && purchaseType !== "extra_credits") {
    return false;
  }

  const creditPackId = normalizeString(
    typeof metadata === "object" && metadata !== null
      ? String((metadata as Record<string, unknown>).credit_pack_id ?? "")
      : null,
  );
  if (
    record.creditPackId &&
    creditPackId &&
    record.creditPackId !== creditPackId
  ) {
    return false;
  }

  const creditsAmountRaw =
    typeof metadata === "object" && metadata !== null
      ? (metadata as Record<string, unknown>).credits_amount
      : null;
  const creditsAmount =
    typeof creditsAmountRaw === "number" && Number.isFinite(creditsAmountRaw)
      ? creditsAmountRaw
      : typeof creditsAmountRaw === "string"
        ? Number(creditsAmountRaw)
        : null;

  if (
    typeof record.creditsAmount === "number" &&
    Number.isFinite(record.creditsAmount) &&
    typeof creditsAmount === "number" &&
    Number.isFinite(creditsAmount) &&
    creditsAmount !== record.creditsAmount
  ) {
    return false;
  }

  return true;
}

export function shouldReturnPurchaseToProfile(
  options: PaymentReturnRouteOptions,
): boolean {
  return (
    options.purchaseType === "tier" || options.purchaseType === "extra_credits"
  );
}

export function shouldReturnTierPurchaseToProfile(
  options: PaymentReturnRouteOptions,
): boolean {
  return options.purchaseType === "tier";
}

export function resolvePaymentReturnPaths(options: PaymentReturnRouteOptions) {
  const returnPurchaseToProfile = shouldReturnPurchaseToProfile(options);
  const successPath = returnPurchaseToProfile ? "/profile" : "/dashboard";
  const failurePath =
    options.purchaseType === "extra_credits" ? "/profile" : "/pricing";

  return {
    successPath,
    failurePath,
    pendingPath: successPath,
  };
}

export function buildBillingReturnSyncToken(
  options: PaymentReturnRouteOptions,
): string | null {
  const provider = normalizeString(options.provider);
  const purchaseType = normalizeString(options.purchaseType);

  if (!provider || !purchaseType) {
    return null;
  }

  const tier = normalizeString(options.tier);
  return tier
    ? `${provider}:${purchaseType}:${tier}`
    : `${provider}:${purchaseType}`;
}

export function createPendingPaymentSyncRecord(
  options: PaymentReturnRouteOptions,
): PendingPaymentSyncRecord | null {
  const token = buildBillingReturnSyncToken(options);
  if (!token) {
    return null;
  }

  return {
    token,
    provider: normalizeString(options.provider),
    purchaseType: normalizeString(options.purchaseType),
    tier: normalizeString(options.tier),
    creditPackId: normalizeString(options.creditPackId),
    creditsAmount:
      typeof options.creditsAmount === "number" &&
      Number.isFinite(options.creditsAmount)
        ? options.creditsAmount
        : null,
    currentTier: normalizeString(options.currentTier),
    currentCredits:
      typeof options.currentCredits === "number" &&
      Number.isFinite(options.currentCredits)
        ? options.currentCredits
        : null,
    currentExtraCredits:
      typeof options.currentExtraCredits === "number" &&
      Number.isFinite(options.currentExtraCredits)
        ? options.currentExtraCredits
        : null,
    startedAt:
      typeof options.startedAt === "number" &&
      Number.isFinite(options.startedAt)
        ? options.startedAt
        : Date.now(),
    paymentStatus:
      options.paymentStatus === "returned" ? "returned" : "started",
  };
}

export function readPendingPaymentSyncRecord(): PendingPaymentSyncRecord | null {
  for (const storage of getSyncStorages()) {
    const parsed = parsePendingPaymentSyncRecord(
      storage.getItem(BILLING_RETURN_SYNC_STORAGE_KEY),
    );
    if (parsed) {
      return parsed;
    }
  }

  return null;
}

export function writePendingPaymentSyncRecord(
  record: PendingPaymentSyncRecord,
) {
  const serialized = JSON.stringify(record);

  for (const storage of getSyncStorages()) {
    storage.setItem(BILLING_RETURN_SYNC_STORAGE_KEY, serialized);
  }
}

export function clearPendingPaymentSyncRecord() {
  for (const storage of getSyncStorages()) {
    storage.removeItem(BILLING_RETURN_SYNC_STORAGE_KEY);
  }
}

export function markPendingPaymentReturned(
  options: PaymentReturnRouteOptions,
): PendingPaymentSyncRecord | null {
  const current = readPendingPaymentSyncRecord();
  const next = createPendingPaymentSyncRecord({
    provider: normalizeString(options.provider) ?? current?.provider ?? null,
    purchaseType:
      normalizeString(options.purchaseType) ?? current?.purchaseType ?? null,
    tier: normalizeString(options.tier) ?? current?.tier ?? null,
    creditPackId:
      normalizeString(options.creditPackId) ?? current?.creditPackId ?? null,
    creditsAmount:
      typeof options.creditsAmount === "number" &&
      Number.isFinite(options.creditsAmount)
        ? options.creditsAmount
        : (current?.creditsAmount ?? null),
    currentTier:
      normalizeString(options.currentTier) ?? current?.currentTier ?? null,
    currentCredits:
      typeof options.currentCredits === "number" &&
      Number.isFinite(options.currentCredits)
        ? options.currentCredits
        : (current?.currentCredits ?? null),
    currentExtraCredits:
      typeof options.currentExtraCredits === "number" &&
      Number.isFinite(options.currentExtraCredits)
        ? options.currentExtraCredits
        : (current?.currentExtraCredits ?? null),
    startedAt: current?.startedAt ?? options.startedAt ?? Date.now(),
    paymentStatus: "returned",
  });

  if (next) {
    writePendingPaymentSyncRecord(next);
  }

  return next;
}

export function isPendingPaymentSyncExpired(
  record: PendingPaymentSyncRecord,
  now = Date.now(),
): boolean {
  return now - record.startedAt > PAYMENT_SYNC_MAX_AGE_MS;
}

export function isPendingPaymentSyncResolved(
  record: PendingPaymentSyncRecord,
  snapshot: PendingPaymentSyncSnapshot,
): boolean {
  if (isPendingPaymentSyncExpired(record)) {
    return false;
  }

  const payments = (snapshot.payments ?? []).filter((payment) => {
    const paymentProvider = normalizeString(payment.provider);
    if (
      record.provider &&
      paymentProvider &&
      paymentProvider !== record.provider
    ) {
      return false;
    }

    return (
      isSuccessfulPaymentStatus(payment.status) &&
      isRecentPaymentRecord(payment, record.startedAt)
    );
  });

  if (record.purchaseType === "extra_credits") {
    const extraCredits = snapshot.profile?.extraCredits ?? null;
    const profileUpdated =
      typeof extraCredits === "number" &&
      (typeof record.currentExtraCredits === "number"
        ? extraCredits > record.currentExtraCredits
        : typeof record.creditsAmount === "number"
          ? extraCredits >= record.creditsAmount
          : false);

    const paymentRecorded = payments.some((payment) =>
      matchesExtraCreditPayment(record, payment),
    );

    return profileUpdated || paymentRecorded;
  }

  const expectedTierRank = getTierRank(record.tier);
  const profileUpdated =
    getTierRank(snapshot.profile?.tier) >= expectedTierRank;
  const subscriptionStatus = normalizeString(
    snapshot.subscription?.status,
  )?.toLowerCase();
  const subscriptionUpdated = Boolean(
    snapshot.subscription &&
    (!record.provider ||
      normalizeString(snapshot.subscription.provider) === record.provider) &&
    getTierRank(snapshot.subscription.tier) >= expectedTierRank &&
    subscriptionStatus &&
    [
      "active",
      "past_due",
      "on_trial",
      "paused",
      "cancelled",
      "authorized",
      "approved",
      "processed",
    ].includes(subscriptionStatus),
  );
  const paymentRecorded = payments.some(
    (payment) =>
      normalizeString(payment.paymentType)?.toLowerCase() ===
        "subscription_invoice" && getTierRank(payment.tier) >= expectedTierRank,
  );

  return profileUpdated && (subscriptionUpdated || paymentRecorded);
}

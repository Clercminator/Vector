import React from "react";
import { Loader2, ShieldCheck } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import {
  ensureMercadoPagoSecurityLoaded,
  getMercadoPagoDeviceId,
  getMercadoPagoPublicKey,
  isMercadoPagoSubscriptionConfigured,
} from "@/lib/mercadoPago";

declare global {
  interface Window {
    MercadoPago?: new (
      publicKey: string,
      options?: { locale?: string },
    ) => MercadoPagoBrowserInstance;
  }
}

interface MercadoPagoCardFormData {
  token?: string;
  cardholderEmail?: string;
}

interface MercadoPagoCardFormInstance {
  getCardFormData(): MercadoPagoCardFormData;
  unmount?: () => void;
}

interface MercadoPagoBrowserInstance {
  cardForm(config: {
    amount: string;
    iframe: boolean;
    form: Record<string, unknown>;
    callbacks: {
      onFormMounted?: (error?: unknown) => void;
      onSubmit?: (event: Event) => void;
    };
  }): MercadoPagoCardFormInstance;
}

export interface MercadoPagoSubscriptionSubmitData {
  cardTokenId: string;
  payerEmail: string;
  deviceId?: string;
}

interface MercadoPagoSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tierId: "builder" | "max";
  tierName: string;
  amountUsd: number;
  billingInterval?: "month" | "year";
  userEmail?: string | null;
  onConfirm: (payload: MercadoPagoSubscriptionSubmitData) => Promise<void>;
}

const MERCADOPAGO_SDK_SCRIPT_ID = "mercadopago-js-v2";
const MERCADOPAGO_SDK_URL = "https://sdk.mercadopago.com/js/v2";

function getLocale(language: string): string {
  switch (language) {
    case "es":
      return "es-AR";
    case "pt":
      return "pt-BR";
    case "fr":
      return "fr-FR";
    case "de":
      return "de-DE";
    default:
      return "en-US";
  }
}

async function ensureMercadoPagoSdkLoaded(): Promise<void> {
  if (typeof document === "undefined") {
    return;
  }

  const existing = document.getElementById(
    MERCADOPAGO_SDK_SCRIPT_ID,
  ) as HTMLScriptElement | null;

  if (existing?.dataset.loaded === "true") {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load MercadoPago SDK")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = MERCADOPAGO_SDK_SCRIPT_ID;
    script.src = MERCADOPAGO_SDK_URL;
    script.async = true;
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true },
    );
    script.addEventListener(
      "error",
      () => reject(new Error("Failed to load MercadoPago SDK")),
      { once: true },
    );
    document.head.appendChild(script);
  });
}

export const MercadoPagoSubscriptionDialog: React.FC<
  MercadoPagoSubscriptionDialogProps
> = ({
  open,
  onOpenChange,
  tierId,
  tierName,
  amountUsd,
  billingInterval = "month",
  userEmail,
  onConfirm,
}) => {
  const [isLoadingSdk, setIsLoadingSdk] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isFormReady, setIsFormReady] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const cardFormRef = React.useRef<MercadoPagoCardFormInstance | null>(null);
  const idsRef = React.useRef({
    formId: `mp-subscription-form-${Math.random().toString(36).slice(2)}`,
    cardNumberId: `mp-card-number-${Math.random().toString(36).slice(2)}`,
    expirationDateId: `mp-expiration-date-${Math.random().toString(36).slice(2)}`,
    securityCodeId: `mp-security-code-${Math.random().toString(36).slice(2)}`,
    cardholderNameId: `mp-cardholder-name-${Math.random().toString(36).slice(2)}`,
    issuerId: `mp-issuer-${Math.random().toString(36).slice(2)}`,
    installmentsId: `mp-installments-${Math.random().toString(36).slice(2)}`,
    identificationTypeId: `mp-identification-type-${Math.random().toString(36).slice(2)}`,
    identificationNumberId: `mp-identification-number-${Math.random().toString(36).slice(2)}`,
    emailId: `mp-email-${Math.random().toString(36).slice(2)}`,
  });

  React.useEffect(() => {
    if (!open) {
      cardFormRef.current?.unmount?.();
      cardFormRef.current = null;
      setIsSubmitting(false);
      setIsFormReady(false);
      setFormError(null);
      return;
    }

    if (!isMercadoPagoSubscriptionConfigured()) {
      setFormError(
        "MercadoPago subscriptions are not fully configured. Add the public key and Supabase URL.",
      );
      return;
    }

    let cancelled = false;

    const mountCardForm = async () => {
      setIsLoadingSdk(true);
      setFormError(null);

      try {
        await Promise.all([
          ensureMercadoPagoSdkLoaded(),
          ensureMercadoPagoSecurityLoaded(),
        ]);

        if (cancelled) {
          return;
        }

        const MercadoPagoCtor = window.MercadoPago;
        const publicKey = getMercadoPagoPublicKey();

        if (!MercadoPagoCtor || !publicKey) {
          throw new Error("MercadoPago SDK is unavailable.");
        }

        cardFormRef.current?.unmount?.();

        const mp = new MercadoPagoCtor(publicKey, {
          locale: getLocale(document.documentElement.lang || "en"),
        });
        const ids = idsRef.current;

        cardFormRef.current = mp.cardForm({
          amount: amountUsd.toFixed(2),
          iframe: true,
          form: {
            id: ids.formId,
            cardNumber: {
              id: ids.cardNumberId,
              placeholder: "1234 5678 9012 3456",
            },
            expirationDate: {
              id: ids.expirationDateId,
              placeholder: "MM/YY",
            },
            securityCode: {
              id: ids.securityCodeId,
              placeholder: "123",
            },
            cardholderName: {
              id: ids.cardholderNameId,
              placeholder: "Cardholder name",
            },
            issuer: {
              id: ids.issuerId,
              placeholder: "Issuer",
            },
            installments: {
              id: ids.installmentsId,
              placeholder: "Installments",
            },
            identificationType: {
              id: ids.identificationTypeId,
              placeholder: "Document type",
            },
            identificationNumber: {
              id: ids.identificationNumberId,
              placeholder: "Document number",
            },
            cardholderEmail: {
              id: ids.emailId,
              placeholder: "Email",
            },
          },
          callbacks: {
            onFormMounted: (error) => {
              if (cancelled) {
                return;
              }
              if (error) {
                setFormError("Failed to mount the MercadoPago card form.");
                return;
              }
              setIsFormReady(true);
            },
            onSubmit: async (event) => {
              event.preventDefault();

              const cardForm = cardFormRef.current;
              if (!cardForm || cancelled) {
                return;
              }

              const data = cardForm.getCardFormData();
              const cardTokenId = data.token?.trim();
              const payerEmail =
                data.cardholderEmail?.trim() || userEmail?.trim() || "";

              if (!cardTokenId) {
                setFormError("MercadoPago did not return a card token.");
                return;
              }
              if (!payerEmail) {
                setFormError(
                  "An email is required to create the subscription.",
                );
                return;
              }

              setIsSubmitting(true);
              setFormError(null);

              try {
                await onConfirm({
                  cardTokenId,
                  payerEmail,
                  deviceId: getMercadoPagoDeviceId(),
                });
              } catch (error) {
                setFormError(
                  error instanceof Error
                    ? error.message
                    : "Failed to start the subscription.",
                );
              } finally {
                if (!cancelled) {
                  setIsSubmitting(false);
                }
              }
            },
          },
        });
      } catch (error) {
        if (!cancelled) {
          setFormError(
            error instanceof Error
              ? error.message
              : "Failed to load MercadoPago checkout.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSdk(false);
        }
      }
    };

    mountCardForm();

    return () => {
      cancelled = true;
      cardFormRef.current?.unmount?.();
      cardFormRef.current = null;
    };
  }, [amountUsd, onConfirm, open, tierId, userEmail]);

  const ids = idsRef.current;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Secure MercadoPago subscription</DialogTitle>
          <DialogDescription>
            Finish your {tierName} subscription with a card authorized through
            MercadoPago. Your card details are tokenized by MercadoPago and are
            never stored by Vector.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="h-4 w-4" />
            {tierName} · ${amountUsd.toFixed(2)} / {billingInterval}
          </div>
          <p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-200/80">
            This follows MercadoPago&apos;s recurring subscription flow with a
            tokenized card and authorized subscription status.
          </p>
        </div>

        <form id={ids.formId} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium">Card number</label>
              <div
                id={ids.cardNumberId}
                className="min-h-11 rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Expiration date</label>
              <div
                id={ids.expirationDateId}
                className="min-h-11 rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Security code</label>
              <div
                id={ids.securityCodeId}
                className="min-h-11 rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label
                htmlFor={ids.cardholderNameId}
                className="text-sm font-medium"
              >
                Cardholder name
              </label>
              <input
                id={ids.cardholderNameId}
                type="text"
                autoComplete="cc-name"
                className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor={ids.issuerId} className="text-sm font-medium">
                Issuer
              </label>
              <select
                id={ids.issuerId}
                className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950"
                defaultValue=""
              >
                <option value="">Select issuer</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor={ids.installmentsId}
                className="text-sm font-medium"
              >
                Installments
              </label>
              <select
                id={ids.installmentsId}
                className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950"
                defaultValue=""
              >
                <option value="">Select installments</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor={ids.identificationTypeId}
                className="text-sm font-medium"
              >
                Document type
              </label>
              <select
                id={ids.identificationTypeId}
                className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950"
                defaultValue=""
              >
                <option value="">Select document type</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor={ids.identificationNumberId}
                className="text-sm font-medium"
              >
                Document number
              </label>
              <input
                id={ids.identificationNumberId}
                type="text"
                autoComplete="off"
                className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor={ids.emailId} className="text-sm font-medium">
                Email
              </label>
              <input
                id={ids.emailId}
                type="email"
                defaultValue={userEmail ?? ""}
                autoComplete="email"
                className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
          </div>

          {formError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {formError}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoadingSdk || !isFormReady || isSubmitting}
            >
              {isLoadingSdk || isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSubmitting
                    ? "Authorizing subscription..."
                    : "Loading secure form..."}
                </>
              ) : (
                `Start ${tierName}`
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

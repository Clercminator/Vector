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

type SupportedLanguage = "de" | "en" | "es" | "fr" | "pt";

interface MercadoPagoFormIds {
  formId: string;
  cardNumberId: string;
  expirationDateId: string;
  securityCodeId: string;
  cardholderNameId: string;
  issuerId: string;
  installmentsId: string;
  identificationTypeId: string;
  identificationNumberId: string;
  emailId: string;
}

interface MercadoPagoDialogCopy {
  dialogTitle: string;
  dialogDescription: (tierName: string) => string;
  recurringNote: string;
  cardNumber: string;
  expirationDate: string;
  securityCode: string;
  cardholderName: string;
  issuer: string;
  selectIssuer: string;
  installments: string;
  selectInstallments: string;
  documentType: string;
  selectDocumentType: string;
  documentNumber: string;
  email: string;
  cancel: string;
  startTier: (tierName: string) => string;
  authorizing: string;
  loading: string;
  intervals: Record<"month" | "year", string>;
  notConfigured: string;
  sdkUnavailable: string;
  mountError: string;
  tokenError: string;
  emailRequired: string;
  submitError: string;
  loadError: string;
}

const SECURE_FIELD_CLASS_NAME =
  "h-14 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-950 [&_iframe]:h-full [&_iframe]:min-h-0 [&_iframe]:w-full";

function getSupportedLanguage(value?: string): SupportedLanguage {
  const normalized = value?.trim().toLowerCase() ?? "";

  if (normalized.startsWith("es")) {
    return "es";
  }
  if (normalized.startsWith("pt")) {
    return "pt";
  }
  if (normalized.startsWith("fr")) {
    return "fr";
  }
  if (normalized.startsWith("de")) {
    return "de";
  }

  return "en";
}

function getPreferredLanguage(): SupportedLanguage {
  if (typeof window !== "undefined") {
    const [firstSegment] = window.location.pathname.split("/").filter(Boolean);
    if (firstSegment) {
      return getSupportedLanguage(firstSegment);
    }
  }

  if (typeof document !== "undefined") {
    const documentLanguage = document.documentElement.lang;
    if (documentLanguage) {
      return getSupportedLanguage(documentLanguage);
    }
  }

  if (typeof navigator !== "undefined") {
    return getSupportedLanguage(navigator.language);
  }

  return "en";
}

function getMercadoPagoCopy(
  language: SupportedLanguage,
): MercadoPagoDialogCopy {
  switch (language) {
    case "es":
      return {
        dialogTitle: "Suscripcion segura con Mercado Pago",
        dialogDescription: (tierName) =>
          `Finaliza tu suscripcion ${tierName} con una tarjeta autorizada por Mercado Pago. Los datos de tu tarjeta se tokenizan en Mercado Pago y Vector nunca los almacena.`,
        recurringNote:
          "Este flujo sigue el modelo de suscripciones recurrentes de Mercado Pago con una tarjeta tokenizada y una suscripcion autorizada.",
        cardNumber: "Numero de tarjeta",
        expirationDate: "Fecha de vencimiento",
        securityCode: "Codigo de seguridad",
        cardholderName: "Titular de la tarjeta",
        issuer: "Banco emisor",
        selectIssuer: "Selecciona un emisor",
        installments: "Cuotas",
        selectInstallments: "Selecciona cuotas",
        documentType: "Tipo de documento",
        selectDocumentType: "Selecciona un tipo de documento",
        documentNumber: "Numero de documento",
        email: "Correo electronico",
        cancel: "Cancelar",
        startTier: (tierName) => `Activar ${tierName}`,
        authorizing: "Autorizando suscripcion...",
        loading: "Cargando formulario seguro...",
        intervals: { month: "mes", year: "ano" },
        notConfigured:
          "Las suscripciones de Mercado Pago no estan configuradas por completo. Agrega la clave publica y la URL de Supabase.",
        sdkUnavailable: "El SDK de Mercado Pago no esta disponible.",
        mountError:
          "No se pudo montar el formulario de tarjeta de Mercado Pago.",
        tokenError: "Mercado Pago no devolvio un token de tarjeta.",
        emailRequired:
          "Necesitas un correo electronico para crear la suscripcion.",
        submitError: "No se pudo iniciar la suscripcion.",
        loadError: "No se pudo cargar el checkout de Mercado Pago.",
      };
    case "pt":
      return {
        dialogTitle: "Assinatura segura com Mercado Pago",
        dialogDescription: (tierName) =>
          `Conclua sua assinatura ${tierName} com um cartao autorizado pelo Mercado Pago. Os dados do cartao sao tokenizados pelo Mercado Pago e nunca ficam armazenados na Vector.`,
        recurringNote:
          "Este fluxo segue o modelo de assinaturas recorrentes do Mercado Pago com cartao tokenizado e assinatura autorizada.",
        cardNumber: "Numero do cartao",
        expirationDate: "Validade",
        securityCode: "Codigo de seguranca",
        cardholderName: "Nome impresso no cartao",
        issuer: "Banco emissor",
        selectIssuer: "Selecione um emissor",
        installments: "Parcelas",
        selectInstallments: "Selecione as parcelas",
        documentType: "Tipo de documento",
        selectDocumentType: "Selecione um tipo de documento",
        documentNumber: "Numero do documento",
        email: "Email",
        cancel: "Cancelar",
        startTier: (tierName) => `Ativar ${tierName}`,
        authorizing: "Autorizando assinatura...",
        loading: "Carregando formulario seguro...",
        intervals: { month: "mes", year: "ano" },
        notConfigured:
          "As assinaturas do Mercado Pago nao estao totalmente configuradas. Adicione a chave publica e a URL do Supabase.",
        sdkUnavailable: "O SDK do Mercado Pago nao esta disponivel.",
        mountError:
          "Nao foi possivel montar o formulario de cartao do Mercado Pago.",
        tokenError: "O Mercado Pago nao retornou um token de cartao.",
        emailRequired: "Um email e obrigatorio para criar a assinatura.",
        submitError: "Nao foi possivel iniciar a assinatura.",
        loadError: "Nao foi possivel carregar o checkout do Mercado Pago.",
      };
    case "fr":
      return {
        dialogTitle: "Abonnement Mercado Pago securise",
        dialogDescription: (tierName) =>
          `Finalisez votre abonnement ${tierName} avec une carte autorisee par Mercado Pago. Les donnees de carte sont tokenisees par Mercado Pago et ne sont jamais stockees par Vector.`,
        recurringNote:
          "Ce flux suit le modele d'abonnement recurrent de Mercado Pago avec une carte tokenisee et un statut d'abonnement autorise.",
        cardNumber: "Numero de carte",
        expirationDate: "Date d'expiration",
        securityCode: "Code de securite",
        cardholderName: "Nom du titulaire",
        issuer: "Banque emettrice",
        selectIssuer: "Selectionnez une banque",
        installments: "Echeances",
        selectInstallments: "Selectionnez les echeances",
        documentType: "Type de document",
        selectDocumentType: "Selectionnez un type de document",
        documentNumber: "Numero du document",
        email: "Email",
        cancel: "Annuler",
        startTier: (tierName) => `Activer ${tierName}`,
        authorizing: "Autorisation de l'abonnement...",
        loading: "Chargement du formulaire securise...",
        intervals: { month: "mois", year: "an" },
        notConfigured:
          "Les abonnements Mercado Pago ne sont pas completement configures. Ajoutez la cle publique et l'URL Supabase.",
        sdkUnavailable: "Le SDK Mercado Pago est indisponible.",
        mountError: "Impossible de monter le formulaire de carte Mercado Pago.",
        tokenError: "Mercado Pago n'a pas retourne de jeton de carte.",
        emailRequired: "Une adresse email est requise pour creer l'abonnement.",
        submitError: "Impossible de demarrer l'abonnement.",
        loadError: "Impossible de charger le checkout Mercado Pago.",
      };
    case "de":
      return {
        dialogTitle: "Sicheres Mercado-Pago-Abonnement",
        dialogDescription: (tierName) =>
          `Schliesse dein ${tierName}-Abonnement mit einer von Mercado Pago autorisierten Karte ab. Deine Kartendaten werden bei Mercado Pago tokenisiert und nie von Vector gespeichert.`,
        recurringNote:
          "Dieser Ablauf folgt dem wiederkehrenden Abomodell von Mercado Pago mit tokenisierter Karte und autorisiertem Abonnementstatus.",
        cardNumber: "Kartennummer",
        expirationDate: "Ablaufdatum",
        securityCode: "Sicherheitscode",
        cardholderName: "Name auf der Karte",
        issuer: "Kartenaussteller",
        selectIssuer: "Aussteller auswahlen",
        installments: "Raten",
        selectInstallments: "Raten auswahlen",
        documentType: "Dokumenttyp",
        selectDocumentType: "Dokumenttyp auswahlen",
        documentNumber: "Dokumentnummer",
        email: "E-Mail",
        cancel: "Abbrechen",
        startTier: (tierName) => `${tierName} starten`,
        authorizing: "Abonnement wird autorisiert...",
        loading: "Sicheres Formular wird geladen...",
        intervals: { month: "Monat", year: "Jahr" },
        notConfigured:
          "Mercado-Pago-Abonnements sind nicht vollstandig konfiguriert. Fuge den offentlichen Schlussel und die Supabase-URL hinzu.",
        sdkUnavailable: "Das Mercado-Pago-SDK ist nicht verfugbar.",
        mountError:
          "Das Mercado-Pago-Kartenformular konnte nicht eingebunden werden.",
        tokenError: "Mercado Pago hat kein Kartentoken zuruckgegeben.",
        emailRequired:
          "Zum Erstellen des Abonnements ist eine E-Mail-Adresse erforderlich.",
        submitError: "Das Abonnement konnte nicht gestartet werden.",
        loadError: "Der Mercado-Pago-Checkout konnte nicht geladen werden.",
      };
    default:
      return {
        dialogTitle: "Secure MercadoPago subscription",
        dialogDescription: (tierName) =>
          `Finish your ${tierName} subscription with a card authorized through MercadoPago. Your card details are tokenized by MercadoPago and are never stored by Vector.`,
        recurringNote:
          "This follows MercadoPago's recurring subscription flow with a tokenized card and authorized subscription status.",
        cardNumber: "Card number",
        expirationDate: "Expiration date",
        securityCode: "Security code",
        cardholderName: "Cardholder name",
        issuer: "Issuer",
        selectIssuer: "Select issuer",
        installments: "Installments",
        selectInstallments: "Select installments",
        documentType: "Document type",
        selectDocumentType: "Select document type",
        documentNumber: "Document number",
        email: "Email",
        cancel: "Cancel",
        startTier: (tierName) => `Start ${tierName}`,
        authorizing: "Authorizing subscription...",
        loading: "Loading secure form...",
        intervals: { month: "month", year: "year" },
        notConfigured:
          "MercadoPago subscriptions are not fully configured. Add the public key and Supabase URL.",
        sdkUnavailable: "MercadoPago SDK is unavailable.",
        mountError: "Failed to mount the MercadoPago card form.",
        tokenError: "MercadoPago did not return a card token.",
        emailRequired: "An email is required to create the subscription.",
        submitError: "Failed to start the subscription.",
        loadError: "Failed to load MercadoPago checkout.",
      };
  }
}

function resetSelectField(id: string) {
  if (typeof document === "undefined") {
    return;
  }

  const field = document.getElementById(id);
  if (!(field instanceof HTMLSelectElement)) {
    return;
  }

  field.innerHTML = "";
  field.value = "";
}

function resetSecureField(id: string) {
  if (typeof document === "undefined") {
    return;
  }

  const field = document.getElementById(id);
  if (field instanceof HTMLDivElement) {
    field.replaceChildren();
  }
}

function resetMercadoPagoFormFields(
  ids: MercadoPagoFormIds,
  copy: MercadoPagoDialogCopy,
) {
  resetSecureField(ids.cardNumberId);
  resetSecureField(ids.expirationDateId);
  resetSecureField(ids.securityCodeId);
  resetSelectField(ids.issuerId);
  resetSelectField(ids.installmentsId);
  resetSelectField(ids.identificationTypeId);
}

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
  const onConfirmRef = React.useRef(onConfirm);
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
    onConfirmRef.current = onConfirm;
  }, [onConfirm]);

  const language = React.useMemo(() => getPreferredLanguage(), []);
  const copy = React.useMemo(() => getMercadoPagoCopy(language), [language]);

  React.useEffect(() => {
    if (!open) {
      cardFormRef.current?.unmount?.();
      cardFormRef.current = null;
      resetMercadoPagoFormFields(idsRef.current, copy);
      setIsSubmitting(false);
      setIsFormReady(false);
      setFormError(null);
      return;
    }

    if (!isMercadoPagoSubscriptionConfigured()) {
      setFormError(copy.notConfigured);
      return;
    }

    let cancelled = false;

    const mountCardForm = async () => {
      setIsLoadingSdk(true);
      setIsFormReady(false);
      setFormError(null);

      const ids = idsRef.current;
      resetMercadoPagoFormFields(ids, copy);

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
          throw new Error(copy.sdkUnavailable);
        }

        cardFormRef.current?.unmount?.();
        resetMercadoPagoFormFields(ids, copy);

        const mp = new MercadoPagoCtor(publicKey, {
          locale: getLocale(document.documentElement.lang || "en"),
        });

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
              placeholder: copy.cardholderName,
            },
            issuer: {
              id: ids.issuerId,
              placeholder: copy.selectIssuer,
            },
            installments: {
              id: ids.installmentsId,
              placeholder: copy.selectInstallments,
            },
            identificationType: {
              id: ids.identificationTypeId,
              placeholder: copy.selectDocumentType,
            },
            identificationNumber: {
              id: ids.identificationNumberId,
              placeholder: copy.documentNumber,
            },
            cardholderEmail: {
              id: ids.emailId,
              placeholder: copy.email,
            },
          },
          callbacks: {
            onFormMounted: (error) => {
              if (cancelled) {
                return;
              }
              if (error) {
                setFormError(copy.mountError);
                setIsFormReady(false);
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
                setFormError(copy.tokenError);
                return;
              }
              if (!payerEmail) {
                setFormError(copy.emailRequired);
                return;
              }

              setIsSubmitting(true);
              setFormError(null);

              try {
                await onConfirmRef.current({
                  cardTokenId,
                  payerEmail,
                  deviceId: getMercadoPagoDeviceId(),
                });
              } catch (error) {
                setFormError(
                  error instanceof Error ? error.message : copy.submitError,
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
          setFormError(error instanceof Error ? error.message : copy.loadError);
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
      resetMercadoPagoFormFields(idsRef.current, copy);
    };
  }, [amountUsd, copy, open, tierId, userEmail]);

  const ids = idsRef.current;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{copy.dialogTitle}</DialogTitle>
          <DialogDescription>
            {copy.dialogDescription(tierName)}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="h-4 w-4" />
            {tierName} · ${amountUsd.toFixed(2)} /{" "}
            {copy.intervals[billingInterval]}
          </div>
          <p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-200/80">
            {copy.recurringNote}
          </p>
        </div>

        <form id={ids.formId} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium">{copy.cardNumber}</label>
              <div id={ids.cardNumberId} className={SECURE_FIELD_CLASS_NAME} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {copy.expirationDate}
              </label>
              <div
                id={ids.expirationDateId}
                className={SECURE_FIELD_CLASS_NAME}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{copy.securityCode}</label>
              <div
                id={ids.securityCodeId}
                className={SECURE_FIELD_CLASS_NAME}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label
                htmlFor={ids.cardholderNameId}
                className="text-sm font-medium"
              >
                {copy.cardholderName}
              </label>
              <input
                id={ids.cardholderNameId}
                type="text"
                autoComplete="cc-name"
                placeholder={copy.cardholderName}
                className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor={ids.issuerId} className="text-sm font-medium">
                {copy.issuer}
              </label>
              <select
                id={ids.issuerId}
                className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950"
                defaultValue=""
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor={ids.installmentsId}
                className="text-sm font-medium"
              >
                {copy.installments}
              </label>
              <select
                id={ids.installmentsId}
                className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950"
                defaultValue=""
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor={ids.identificationTypeId}
                className="text-sm font-medium"
              >
                {copy.documentType}
              </label>
              <select
                id={ids.identificationTypeId}
                className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950"
                defaultValue=""
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor={ids.identificationNumberId}
                className="text-sm font-medium"
              >
                {copy.documentNumber}
              </label>
              <input
                id={ids.identificationNumberId}
                type="text"
                autoComplete="off"
                placeholder={copy.documentNumber}
                className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor={ids.emailId} className="text-sm font-medium">
                {copy.email}
              </label>
              <input
                id={ids.emailId}
                type="email"
                defaultValue={userEmail ?? ""}
                autoComplete="email"
                placeholder={copy.email}
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
              {copy.cancel}
            </Button>
            <Button
              type="submit"
              disabled={isLoadingSdk || !isFormReady || isSubmitting}
            >
              {isLoadingSdk || isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSubmitting ? copy.authorizing : copy.loading}
                </>
              ) : (
                copy.startTier(tierName)
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

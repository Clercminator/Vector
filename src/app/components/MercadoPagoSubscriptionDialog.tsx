import React from "react";
import { CheckCircle2, Loader2, Lock, ShieldCheck } from "lucide-react";

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
} from "@/lib/mercadoPagoSecurity";
import {
  getMercadoPagoPublicKey,
  isMercadoPagoSubscriptionConfigured,
  shouldUseMercadoPagoTestEnvironment,
} from "@/lib/paymentProviderConfig";
import { useLanguage } from "@/app/components/language-provider";

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

interface MercadoPagoCardTokenResult {
  id?: string;
}

interface MercadoPagoCardFormInstance {
  createCardToken(): Promise<MercadoPagoCardTokenResult | string>;
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
  cardPaymentTitle: string;
  cardPaymentDescription: string;
  summaryTitle: string;
  securityCaption: string;
  submitCaption: string;
  testModeBadge: string;
  testModeHint: string;
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
  cvvValidationError: string;
  emailRequired: string;
  submitError: string;
  loadError: string;
}

const SECURE_FIELD_CLASS_NAME =
  "flex h-12 min-h-12 items-center overflow-hidden rounded-xl border border-zinc-300 bg-white px-4 shadow-sm [&_iframe]:block [&_iframe]:h-full [&_iframe]:min-h-0 [&_iframe]:w-full";

const FORM_FIELD_CLASS_NAME =
  "flex h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-[15px] text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10";

const SUMMARY_PANEL_CLASS_NAME =
  "bg-[radial-gradient(circle_at_top,_rgba(23,104,99,0.85),_rgba(10,22,24,1)_62%)] px-6 py-7 text-white sm:px-8 sm:py-9";

function dedupeSelectOptions(field: HTMLSelectElement) {
  const seen = new Set<string>();
  const uniqueOptions = Array.from(field.options).filter((option) => {
    const key = `${option.value}::${option.textContent?.trim() ?? ""}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  if (uniqueOptions.length === field.options.length) {
    return;
  }

  const selectedValue = field.value;
  field.replaceChildren(...uniqueOptions);

  if (selectedValue) {
    field.value = selectedValue;
  }
}

function selectFirstAvailableOption(field: HTMLSelectElement) {
  if (field.value) {
    return;
  }

  const firstAvailableOption = Array.from(field.options).find((option) => {
    const value = option.value.trim();
    return value.length > 0 && !option.disabled;
  });

  if (firstAvailableOption) {
    field.value = firstAvailableOption.value;
  }
}

function observeUniqueSelectOptions(ids: string[]) {
  if (typeof document === "undefined") {
    return () => undefined;
  }

  const observers: MutationObserver[] = [];

  ids.forEach((id) => {
    const field = document.getElementById(id);
    if (!(field instanceof HTMLSelectElement)) {
      return;
    }

    const normalize = () => dedupeSelectOptions(field);
    normalize();

    const observer = new MutationObserver(() => {
      normalize();
    });

    observer.observe(field, { childList: true, subtree: true });
    observers.push(observer);
  });

  return () => {
    observers.forEach((observer) => observer.disconnect());
  };
}

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
        cardPaymentTitle: "Pago con tarjeta",
        cardPaymentDescription:
          "Completa los datos exactamente como aparecen en tu tarjeta. Mercado Pago tokeniza el medio de pago y Vector no guarda esos datos.",
        summaryTitle: "Resumen del plan",
        securityCaption:
          "Cobro recurrente seguro con tokenizacion nativa de Mercado Pago.",
        submitCaption:
          "Al activar la suscripcion, autorizas cobros recurrentes segun la periodicidad elegida.",
        testModeBadge: "Modo prueba de Mercado Pago",
        testModeHint:
          "Estas usando credenciales de prueba. Valida el flujo con cuentas y tarjetas de prueba de Mercado Pago antes de volver al modo live.",
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
        cvvValidationError:
          "Mercado Pago no pudo validar el codigo de seguridad. Vuelve a escribir el CVV y espera un segundo antes de confirmar. Si estas probando con tarjetas de prueba, recuerda que vectorplan.xyz usa credenciales live y para pruebas necesitas un ambiente test con el email test@testuser.com.",
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
        cardPaymentTitle: "Pagamento com cartao",
        cardPaymentDescription:
          "Preencha os dados exatamente como aparecem no cartao. O Mercado Pago tokeniza o meio de pagamento e a Vector nao armazena esses dados.",
        summaryTitle: "Resumo do plano",
        securityCaption:
          "Cobranca recorrente segura com tokenizacao nativa do Mercado Pago.",
        submitCaption:
          "Ao ativar a assinatura, voce autoriza cobrancas recorrentes conforme a periodicidade escolhida.",
        testModeBadge: "Modo de teste do Mercado Pago",
        testModeHint:
          "Voce esta usando credenciais de teste. Valide o fluxo com contas e cartoes de teste do Mercado Pago antes de voltar ao modo live.",
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
        cvvValidationError:
          "O Mercado Pago nao conseguiu validar o codigo de seguranca. Digite o CVV novamente e espere um segundo antes de confirmar. Se voce estiver usando cartoes de teste, lembre que vectorplan.xyz usa credenciais live e os testes exigem ambiente test com o email test@testuser.com.",
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
        cardPaymentTitle: "Paiement par carte",
        cardPaymentDescription:
          "Renseignez les informations exactement comme elles apparaissent sur votre carte. Mercado Pago tokenise le moyen de paiement et Vector ne stocke jamais ces donnees.",
        summaryTitle: "Resume du plan",
        securityCaption:
          "Facturation recurrente securisee avec la tokenisation native de Mercado Pago.",
        submitCaption:
          "En activant l'abonnement, vous autorisez des paiements recurrents selon la periodicite choisie.",
        testModeBadge: "Mode test Mercado Pago",
        testModeHint:
          "Vous utilisez des identifiants de test. Validez le flux avec des comptes et cartes de test Mercado Pago avant de revenir en mode live.",
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
        cvvValidationError:
          "Mercado Pago n'a pas pu valider le code de securite. Saisissez a nouveau le CVV et attendez une seconde avant de confirmer. Si vous testez avec des cartes de test, notez que vectorplan.xyz utilise des identifiants live et qu'il faut un environnement de test avec l'email test@testuser.com.",
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
        cardPaymentTitle: "Kartenzahlung",
        cardPaymentDescription:
          "Trage die Daten genau so ein, wie sie auf deiner Karte stehen. Mercado Pago tokenisiert das Zahlungsmittel und Vector speichert diese Daten nie.",
        summaryTitle: "Tarifubersicht",
        securityCaption:
          "Sichere wiederkehrende Abbuchung mit nativer Mercado-Pago-Tokenisierung.",
        submitCaption:
          "Mit dem Start des Abonnements autorisierst du wiederkehrende Abbuchungen gemaess dem gewahlten Intervall.",
        testModeBadge: "Mercado-Pago-Testmodus",
        testModeHint:
          "Du verwendest Testzugangsdaten. Prufe den Ablauf mit Mercado-Pago-Testkonten und Testkarten, bevor du wieder in den Live-Modus wechselst.",
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
        cvvValidationError:
          "Mercado Pago konnte den Sicherheitscode nicht validieren. Gib den CVV erneut ein und warte eine Sekunde vor dem Bestatigen. Wenn du mit Testkarten pruefst, beachte bitte, dass vectorplan.xyz Live-Zugangsdaten nutzt und Tests eine Testumgebung mit der E-Mail test@testuser.com brauchen.",
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
        cardPaymentTitle: "Pay by card",
        cardPaymentDescription:
          "Enter the details exactly as they appear on the card. MercadoPago tokenizes the payment method and Vector never stores that data.",
        summaryTitle: "Plan summary",
        securityCaption:
          "Secure recurring billing with MercadoPago's native tokenization flow.",
        submitCaption:
          "By starting the subscription, you authorize recurring charges based on the selected billing interval.",
        testModeBadge: "MercadoPago test mode",
        testModeHint:
          "You are using test credentials. Validate the flow with MercadoPago test accounts and cards before switching back to live mode.",
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
        cvvValidationError:
          "MercadoPago could not validate the security code. Re-enter the CVV and wait a second before confirming. If you are using test cards, note that vectorplan.xyz runs with live credentials and test purchases require a test environment with the email test@testuser.com.",
        emailRequired: "An email is required to create the subscription.",
        submitError: "Failed to start the subscription.",
        loadError: "Failed to load MercadoPago checkout.",
      };
  }
}

function isCvvValidationError(message: string): boolean {
  return /card token was generated without cvv validation/i.test(message);
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

function resetMercadoPagoFormFields(ids: MercadoPagoFormIds) {
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
  const { language, t } = useLanguage();
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

  const copy = React.useMemo(
    () => getMercadoPagoCopy(getSupportedLanguage(language)),
    [language],
  );
  const isTestEnvironment = shouldUseMercadoPagoTestEnvironment();

  const tierDescription =
    tierId === "builder"
      ? t("pricing.tier.builder.desc")
      : t("pricing.tier.max.desc");

  const summaryFeatures = React.useMemo(() => {
    if (tierId === "builder") {
      return [
        t("pricing.feature.builder.plans").replace("{0}", "5"),
        t("pricing.feature.builder.ai"),
        t("pricing.feature.builder.tracker"),
        t("pricing.feature.builder.support"),
      ];
    }

    return [
      t("pricing.feature.max.plans").replace("{0}", "20"),
      t("pricing.feature.max.calendar"),
      t("pricing.feature.max.priority"),
      t("pricing.feature.max.leyendo"),
    ];
  }, [t, tierId]);

  React.useEffect(() => {
    if (!open) {
      cardFormRef.current?.unmount?.();
      cardFormRef.current = null;
      resetMercadoPagoFormFields(idsRef.current);
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
    const ids = idsRef.current;
    const stopObservingSelects = observeUniqueSelectOptions([
      ids.issuerId,
      ids.installmentsId,
      ids.identificationTypeId,
    ]);
    const normalizeSelects = () => {
      const issuerField = document.getElementById(ids.issuerId);
      const installmentsField = document.getElementById(ids.installmentsId);
      const identificationField = document.getElementById(
        ids.identificationTypeId,
      );

      if (issuerField instanceof HTMLSelectElement) {
        dedupeSelectOptions(issuerField);
        selectFirstAvailableOption(issuerField);
      }
      if (installmentsField instanceof HTMLSelectElement) {
        dedupeSelectOptions(installmentsField);
        selectFirstAvailableOption(installmentsField);
      }
      if (identificationField instanceof HTMLSelectElement) {
        dedupeSelectOptions(identificationField);
      }
    };
    const selectNormalizationTimer = window.setInterval(normalizeSelects, 250);

    const mountCardForm = async () => {
      setIsLoadingSdk(true);
      setIsFormReady(false);
      setFormError(null);

      resetMercadoPagoFormFields(ids);

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
        resetMercadoPagoFormFields(ids);

        const mp = new MercadoPagoCtor(publicKey, {
          locale: getLocale(language),
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
            onFetching: (resource) => {
              if (
                /issuers|installments|payment_methods|identification/i.test(
                  resource,
                )
              ) {
                window.requestAnimationFrame(() => {
                  normalizeSelects();
                });
              }

              return () => {
                normalizeSelects();
              };
            },
            onSubmit: async (event) => {
              event.preventDefault();

              const cardForm = cardFormRef.current;
              if (!cardForm || cancelled) {
                return;
              }

              if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
              }

              setIsSubmitting(true);
              setFormError(null);

              try {
                await new Promise((resolve) => window.setTimeout(resolve, 150));

                const tokenResult = await cardForm.createCardToken();
                const data = cardForm.getCardFormData();
                const cardTokenId =
                  (typeof tokenResult === "string"
                    ? tokenResult
                    : tokenResult?.id) ?? data.token;
                const payerEmail =
                  data.cardholderEmail?.trim() || userEmail?.trim() || "";

                if (!cardTokenId?.trim()) {
                  setFormError(copy.tokenError);
                  return;
                }
                if (!payerEmail) {
                  setFormError(copy.emailRequired);
                  return;
                }

                await onConfirmRef.current({
                  cardTokenId: cardTokenId.trim(),
                  payerEmail,
                  deviceId: getMercadoPagoDeviceId(),
                });
              } catch (error) {
                if (
                  error instanceof Error &&
                  isCvvValidationError(error.message)
                ) {
                  setFormError(copy.cvvValidationError);
                  return;
                }

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
      window.clearInterval(selectNormalizationTimer);
      stopObservingSelects();
      cardFormRef.current?.unmount?.();
      cardFormRef.current = null;
      resetMercadoPagoFormFields(idsRef.current);
    };
  }, [amountUsd, copy, language, open, tierId, userEmail]);

  const ids = idsRef.current;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto overflow-x-hidden border-zinc-900 bg-zinc-950 p-0 text-white sm:max-w-5xl [&>button]:!top-5 [&>button]:!right-5 [&>button]:!rounded-full [&>button]:!border [&>button]:!border-zinc-200 [&>button]:!bg-white/95 [&>button]:!p-2 [&>button]:!text-zinc-700 [&>button]:!opacity-100 [&>button]:!shadow-sm [&>button:hover]:!bg-white [&>button:hover]:!text-zinc-950">
        <div className="grid min-h-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className={SUMMARY_PANEL_CLASS_NAME}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
              {copy.summaryTitle}
            </p>
            <div className="mt-4">
              <h2 className="text-3xl font-semibold tracking-tight">
                {tierName}
              </h2>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-4xl font-semibold">
                  ${amountUsd.toFixed(2)}
                </span>
                <span className="pb-1 text-sm text-white/70">
                  / {copy.intervals[billingInterval]}
                </span>
              </div>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/72">
                {tierDescription}
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-100">
                <ShieldCheck className="h-4 w-4" />
                {copy.securityCaption}
              </div>
              <p className="mt-2 text-xs leading-5 text-emerald-50/75">
                {copy.recurringNote}
              </p>
            </div>

            {isTestEnvironment && (
              <div className="mt-4 rounded-2xl border border-amber-300/25 bg-amber-300/12 p-4 text-amber-50">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/90">
                  {copy.testModeBadge}
                </p>
                <p className="mt-2 text-sm leading-6 text-amber-50/80">
                  {copy.testModeHint}
                </p>
              </div>
            )}

            <div className="mt-7 space-y-3">
              {summaryFeatures.map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-3 text-sm text-white/84"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-300" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#f5f1e8] px-6 py-7 text-zinc-900 sm:px-8 sm:py-9">
            <DialogHeader className="space-y-3 text-left">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm">
                <Lock className="h-3.5 w-3.5" />
                {copy.dialogTitle}
              </div>
              <DialogTitle className="text-2xl font-semibold tracking-tight text-zinc-950">
                {copy.cardPaymentTitle}
              </DialogTitle>
              <DialogDescription className="max-w-2xl text-sm leading-6 text-zinc-600">
                {copy.cardPaymentDescription}
              </DialogDescription>
            </DialogHeader>

            <form id={ids.formId} className="mt-7 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-semibold text-zinc-800">
                    {copy.cardNumber}
                  </label>
                  <div
                    id={ids.cardNumberId}
                    className={SECURE_FIELD_CLASS_NAME}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-800">
                    {copy.expirationDate}
                  </label>
                  <div
                    id={ids.expirationDateId}
                    className={SECURE_FIELD_CLASS_NAME}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-800">
                    {copy.securityCode}
                  </label>
                  <div
                    id={ids.securityCodeId}
                    className={SECURE_FIELD_CLASS_NAME}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label
                    htmlFor={ids.cardholderNameId}
                    className="text-sm font-semibold text-zinc-800"
                  >
                    {copy.cardholderName}
                  </label>
                  <input
                    id={ids.cardholderNameId}
                    type="text"
                    autoComplete="cc-name"
                    placeholder={copy.cardholderName}
                    className={FORM_FIELD_CLASS_NAME}
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor={ids.identificationTypeId}
                    className="text-sm font-semibold text-zinc-800"
                  >
                    {copy.documentType}
                  </label>
                  <select
                    id={ids.identificationTypeId}
                    className={FORM_FIELD_CLASS_NAME}
                    defaultValue=""
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor={ids.identificationNumberId}
                    className="text-sm font-semibold text-zinc-800"
                  >
                    {copy.documentNumber}
                  </label>
                  <input
                    id={ids.identificationNumberId}
                    type="text"
                    autoComplete="off"
                    placeholder={copy.documentNumber}
                    className={FORM_FIELD_CLASS_NAME}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label
                    htmlFor={ids.emailId}
                    className="text-sm font-semibold text-zinc-800"
                  >
                    {copy.email}
                  </label>
                  <input
                    id={ids.emailId}
                    type="email"
                    defaultValue={userEmail ?? ""}
                    autoComplete="email"
                    placeholder={copy.email}
                    className={FORM_FIELD_CLASS_NAME}
                  />
                </div>
                <div className="hidden" aria-hidden="true">
                  <select id={ids.issuerId} defaultValue="" tabIndex={-1} />
                  <select
                    id={ids.installmentsId}
                    defaultValue=""
                    tabIndex={-1}
                  />
                </div>
              </div>

              {formError && (
                <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <p className="text-sm leading-6 text-zinc-600">
                {copy.submitCaption}
              </p>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                  className="h-12 rounded-xl border-zinc-300 bg-white px-5 text-zinc-800 hover:bg-zinc-50"
                >
                  {copy.cancel}
                </Button>
                <Button
                  type="submit"
                  disabled={isLoadingSdk || !isFormReady || isSubmitting}
                  className="h-12 rounded-xl bg-zinc-950 px-5 text-white hover:bg-zinc-800 disabled:bg-zinc-300 disabled:text-zinc-500"
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Coins, MessageCircle } from "lucide-react";
import { useLanguage } from "@/app/components/language-provider";

interface BinancePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tierName: string;
  tierId: string;
  amountUsd: number;
  onOpenChat?: () => void;
}

export function BinancePaymentModal({
  open,
  onOpenChange,
  tierName,
  tierId,
  amountUsd,
  onOpenChat,
}: BinancePaymentModalProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            {t("pricing.binance.title") || "Pay with Binance (Crypto)"}
          </DialogTitle>
          <DialogDescription>
            {t("pricing.binance.subtitle") || "Manual payment — we'll process your upgrade as soon as we confirm it."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
              {t("pricing.binance.tier") || "Plan"}: {tierName}
            </p>
            <p className="text-2xl font-bold text-amber-800 dark:text-amber-200">
              ${amountUsd.toFixed(2)} USD
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              {t("pricing.binance.amountNote") || "Convert to USDT at checkout. Send the exact equivalent."}
            </p>
          </div>

          <div className="flex justify-center">
            <img
              src="/BinanceQR.png"
              alt="Binance Pay QR Code"
              className="w-48 h-48 object-contain rounded-lg border border-gray-200 dark:border-zinc-700"
            />
          </div>

          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {t("pricing.binance.steps") || "Steps:"}
            </p>
            <ol className="list-decimal list-inside space-y-1">
              <li>{t("pricing.binance.step1") || "Scan the QR code with your Binance app"}</li>
              <li>{t("pricing.binance.step2") || "Send the exact amount shown above (in USDT or equivalent)"}</li>
              <li>
                {t("pricing.binance.step3") || "Message us via the chat widget to confirm your payment"}
              </li>
            </ol>
          </div>

          <div className="rounded-lg bg-amber-50/80 dark:bg-amber-900/15 border border-amber-200/60 dark:border-amber-800/50 p-4">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              {t("pricing.binance.manualNote") || "Manual processing"}
            </p>
            <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
              {t("pricing.binance.manualDesc") ||
                "We process crypto payments manually. Please be patient — it may take some time. Make sure to notify us via chat after sending, or we won't know to upgrade your account."}
            </p>
          </div>

          {onOpenChat && (
            <Button
              onClick={() => {
                onOpenChat();
                onOpenChange(false);
              }}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {t("pricing.binance.openChat") || "Open chat to notify us"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

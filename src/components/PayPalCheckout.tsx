"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Loader2, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";

interface Props {
  orderId: string;        // our Supabase order UUID
  totalUsd: number;       // display total
  orderNumber: string;    // e.g. "KM-20260612-1234"
  onSuccess: (transactionId: string) => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: Record<string, unknown>) => {
        render: (container: string | HTMLElement) => Promise<void>;
        isEligible: () => boolean;
      };
    };
  }
}

export default function PayPalCheckout({
  orderId,
  totalUsd,
  orderNumber,
  onSuccess,
  onError,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const buttonsRendered = useRef(false);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  // Render PayPal buttons once SDK is loaded
  useEffect(() => {
    if (!sdkReady || !window.paypal || buttonsRendered.current || !containerRef.current) return;
    buttonsRendered.current = true;
    setRendering(true);

    try {
      const buttons = window.paypal.Buttons({
        style: {
          layout: "vertical",
          color: "gold",
          shape: "rect",
          label: "pay",
          height: 48,
        },

        // Step 1: Create PayPal order via our API
        createOrder: async () => {
          try {
            const res = await fetch("/api/paypal/create-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed to create PayPal order");
            return data.paypalOrderId;
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Payment error";
            setError(msg);
            onError?.(msg);
            throw err;
          }
        },

        // Step 2: Capture payment after user approves
        onApprove: async (data: { orderID: string }) => {
          setProcessing(true);
          setError(null);
          try {
            const res = await fetch("/api/paypal/capture-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                paypalOrderId: data.orderID,
                orderId,
              }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error ?? "Capture failed");
            onSuccess(result.transactionId);
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Payment capture failed";
            setError(msg);
            onError?.(msg);
          } finally {
            setProcessing(false);
          }
        },

        onCancel: () => {
          setError(null); // User cancelled — not an error
        },

        onError: (err: Error) => {
          console.error("PayPal button error:", err);
          setError("Payment system error. Please try again.");
          onError?.(err.message);
        },
      });

      if (buttons.isEligible()) {
        buttons.render(containerRef.current!).then(() => {
          setRendering(false);
        });
      } else {
        setError("PayPal is not available for this transaction");
        setRendering(false);
      }
    } catch (err) {
      console.error("PayPal render error:", err);
      setError("Failed to load payment buttons");
      setRendering(false);
    }
  }, [sdkReady, orderId, onSuccess, onError]);

  if (!clientId) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
        PayPal is not configured. Please contact support.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Order summary before payment */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold">
            Order #{orderNumber} — ${totalUsd.toFixed(2)}
          </p>
          <p className="text-blue-600 mt-0.5">
            Secure payment via PayPal. You can pay with your PayPal account or credit/debit card.
          </p>
        </div>
      </div>

      {/* Processing overlay */}
      {processing && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-sm text-amber-800">
          <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
          Processing payment...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Payment error</p>
            <p className="text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* PayPal buttons container */}
      <div
        ref={containerRef}
        className={processing ? "opacity-50 pointer-events-none" : ""}
      />

      {/* Loading state while SDK loads or buttons render */}
      {(!sdkReady || rendering) && (
        <div className="flex items-center justify-center gap-2 py-6 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading payment buttons...</span>
        </div>
      )}

      {/* Load PayPal JS SDK */}
      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`}
        strategy="lazyOnload"
        onReady={() => setSdkReady(true)}
        onError={() => {
          setError("Failed to load PayPal SDK");
          setRendering(false);
        }}
      />
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js/pure';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';

let stripePromise: ReturnType<typeof loadStripe> | null = null;
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hasSavedCard?: boolean;
}

interface SavedCard {
  brand: string;
  last4: string;
}

// Form for new card entry — uses Stripe Payment Element
function CheckoutForm({
  onClose,
  paymentIntentId,
}: {
  onClose: () => void;
  paymentIntentId: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [elementReady, setElementReady] = useState(false);
  const [saveMethod, setSaveMethod] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    if (saveMethod) {
      await fetch('/api/payments/update-intent-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId, saveMethod: true }),
      }).catch(() => {});
    }

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? 'Validation error');
      setLoading(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/payment-status` },
    });

    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement onReady={() => setElementReady(true)} options={{ wallets: { link: 'never' } }} />

      {!elementReady && (
        <p className="text-slate-500 text-xs text-center">Loading payment form...</p>
      )}

      {elementReady && (
        <div className="flex flex-col gap-1.5 mt-[10px]">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={saveMethod}
              onChange={(e) => setSaveMethod(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-500"
            />
            <span className="text-sm text-slate-300">Save card for future payments</span>
          </label>
          <p className="text-xs text-slate-500 pl-6">
            Your card details are stored securely by Stripe and never touch our servers.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-3 py-2 text-sm text-red-400">
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-2 underline hover:no-underline">
            Try again
          </button>
        </div>
      )}

      <div className="flex gap-2 justify-end mt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !stripe || !elements || !elementReady}
          className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Pay $100'}
        </button>
      </div>
    </form>
  );
}

// UI for saved card — no Payment Element, creates PI only on Pay click
function SavedCardForm({
  onClose,
  savedCard,
  onNewCard,
}: {
  onClose: () => void;
  savedCard: SavedCard;
  onNewCard: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [removingCard, setRemovingCard] = useState(false);

  const handleNewCard = async () => {
    setRemovingCard(true);
    try {
      await fetch('/api/payments/remove-payment-method', { method: 'POST' });
    } catch {
      // ignore
    }
    setRemovingCard(false);
    onNewCard();
  };

  const handlePay = async () => {
    setLoading(true);
    setError(null);

    // Create PI only now — deferred from modal open
    let clientSecret: string;
    try {
      const res = await fetch('/api/payments/create-intent', { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Failed to initialize payment');
      }
      const data = await res.json();
      clientSecret = data.clientSecret;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize payment');
      setLoading(false);
      return;
    }

    const stripe = await getStripe();
    if (!stripe) {
      setError('Stripe failed to load');
      setLoading(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      clientSecret,
      confirmParams: { return_url: `${window.location.origin}/payment-status` },
    });

    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed');
      setLoading(false);
    }
  };

  const brandLabel = savedCard.brand.charAt(0).toUpperCase() + savedCard.brand.slice(1);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-3">
        <div className="flex-1">
          <p className="text-white text-sm font-medium">{brandLabel} •••• {savedCard.last4}</p>
          <p className="text-slate-400 text-xs mt-0.5">Saved card</p>
        </div>
        <button
          type="button"
          onClick={handleNewCard}
          disabled={removingCard || loading}
          className="text-xs text-slate-400 hover:text-white underline hover:no-underline transition-colors disabled:opacity-50 shrink-0"
        >
          {removingCard ? 'Removing...' : 'New Payment Method'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-3 py-2 text-sm text-red-400">
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-2 underline hover:no-underline">
            Try again
          </button>
        </div>
      )}

      <div className="flex gap-2 justify-end mt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handlePay}
          disabled={loading || removingCard}
          className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Pay $100'}
        </button>
      </div>
    </div>
  );
}

export default function PaymentModal({ open, onClose, onSuccess, hasSavedCard = false }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [savedCardInfo, setSavedCardInfo] = useState<SavedCard | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  // On open: check saved card first — no PI/transaction created yet.
  // If no saved card, create PI immediately so Payment Element can render.
  const initialize = useCallback(async () => {
    setFetching(true);
    setFetchError(null);
    setClientSecret(null);
    setPaymentIntentId(null);
    setSavedCardInfo(null);
    try {
      const cardRes = await fetch('/api/payments/saved-card');
      if (!cardRes.ok) throw new Error('Failed to load payment info');
      const cardData = await cardRes.json();
      if (cardData?.brand) {
        setSavedCardInfo(cardData);
        return;
      }
      // No saved card — create PI so Payment Element can render
      const intentRes = await fetch('/api/payments/create-intent', { method: 'POST' });
      if (!intentRes.ok) {
        const body = await intentRes.json().catch(() => ({}));
        throw new Error(body.message ?? 'Failed to initialize payment');
      }
      const intentData = await intentRes.json();
      setClientSecret(intentData.clientSecret);
      setPaymentIntentId(intentData.paymentIntentId);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setFetching(false);
    }
  }, []);

  const createIntent = useCallback(async () => {
    setFetching(true);
    setFetchError(null);
    setClientSecret(null);
    setPaymentIntentId(null);
    setSavedCardInfo(null);
    try {
      const res = await fetch('/api/payments/create-intent', { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Failed to initialize payment');
      }
      const data = await res.json();
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (open) initialize();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleNewCard = useCallback(async () => {
    await createIntent();
  }, [createIntent]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[#0f2239] border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold text-lg">Top up balance — $100</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {fetching && (
          <div className="py-8 flex justify-center">
            <p className="text-slate-400 text-sm">Loading payment form...</p>
          </div>
        )}

        {fetchError && (
          <div className="flex flex-col gap-3">
            <div className="bg-red-900/30 border border-red-700 rounded-lg px-3 py-2 text-sm text-red-400">
              {fetchError}
            </div>
            <button
              onClick={initialize}
              className="w-full py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {savedCardInfo && (
          <SavedCardForm
            onClose={onClose}
            savedCard={savedCardInfo}
            onNewCard={handleNewCard}
          />
        )}

        {clientSecret && paymentIntentId && !savedCardInfo && (
          <Elements
            stripe={getStripe()}
            options={{
              clientSecret,
              appearance: {
                theme: 'night',
                variables: { colorPrimary: '#3b82f6', borderRadius: '8px' },
              },
            }}
          >
            <CheckoutForm
              onClose={onClose}
              paymentIntentId={paymentIntentId}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}

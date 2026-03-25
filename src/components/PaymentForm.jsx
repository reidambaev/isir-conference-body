import React, { useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { formatCurrency } from "../utils/currency";

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#32325d",
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": {
        color: "#aab7c4",
      },
    },
    invalid: {
      color: "#fa755a",
      iconColor: "#fa755a",
    },
  },
};

const PaymentForm = ({
  clientSecret,
  amount,
  currency,
  onSuccess,
  onError,
  isProcessing,
  setIsProcessing,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        setIsProcessing(false);
        if (onError) onError(stripeError);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        if (onSuccess) onSuccess(paymentIntent);
      }
    } catch (err) {
      setError(err.message || "An error occurred processing your payment");
      setIsProcessing(false);
      if (onError) onError(err);
    }
  };

  const handleCardChange = (event) => {
    setError(event.error ? event.error.message : null);
    setCardComplete(event.complete);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Card Information <span className="text-red-500">*</span>
        </label>
        <div className="border-2 border-gray-200 p-3 rounded-xl bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
          <CardElement
            options={CARD_ELEMENT_OPTIONS}
            onChange={handleCardChange}
          />
        </div>
        {error && (
          <div className="mt-2 text-sm text-red-600 flex items-center">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        )}
      </div>

      <div className="mt-8 bg-green-50 border-2 border-green-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div>
            <p className="font-bold text-gray-800">Secure Payment</p>
            <p className="text-sm text-gray-600 mt-1">
              Your payment information is encrypted and secure. We accept Visa,
              MasterCard, American Express, and Discover. Processing{" "}
              {formatCurrency(amount / (currency === "KRW" ? 1 : 100), currency)}.
            </p>
            <a
              href="/commercial-disclosure"
              className="inline-block mt-2 text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline"
            >
              View Commercial Disclosure (特定商取引法に基づく表記)
            </a>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || !cardComplete || isProcessing}
        className="w-full px-10 py-3 text-white rounded-xl shadow-lg hover:shadow-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base"
        style={{
          background: isProcessing || !cardComplete
            ? "#9ca3af"
            : "linear-gradient(135deg, #1a3a6c 0%, #2d5a9e 100%)",
        }}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing Payment...
          </span>
        ) : (
          `Complete Payment →`
        )}
      </button>
    </form>
  );
};

export default PaymentForm;

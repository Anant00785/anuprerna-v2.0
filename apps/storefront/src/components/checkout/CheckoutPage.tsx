"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCartStore } from "@/stores/cart.store";
import { useAuthStore } from "@/stores/auth.store";
import { useCurrencyStore } from "@/stores/currency.store";
import { useWishlistStore } from "@/stores/wishlist.store";
import { profileRepository } from "@/lib/api/repositories/profile.repository";
import { cartRepository } from "@/lib/api/repositories/cart.repository";
import { checkoutRepository } from "@/lib/api/repositories/checkout.repository";
import {
  AddOrderItem,
  AddOrderPayload,
  CheckoutStep,
  PaymentMethodId,
  ShipmentOption,
} from "@/types/domain/checkout";
import { AddressItem } from "@/types/domain/profile";
import { CartItem } from "@/types/domain/cart";
import {
  calculateCheckoutPrices,
  calculateDeliveryTimestamp,
} from "@/lib/checkout/checkout-calculations";
import { CheckoutStepHeader } from "./CheckoutStepHeader";
import { CheckoutShipToAndMethod } from "./CheckoutShipToAndMethod";
import { CheckoutItemsList } from "./CheckoutItemsList";
import { CheckoutAddressSection, isPhoneValid } from "./CheckoutAddressSection";
import { CheckoutShipmentTier } from "./CheckoutShipmentTier";
import { CheckoutWhatsAppOptin } from "./CheckoutWhatsAppOptin";
import { CheckoutPaymentMethods } from "./CheckoutPaymentMethods";
import { CheckoutPriceSummary } from "./CheckoutPriceSummary";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = (searchParams.get("step") as CheckoutStep) || "cart";

  const { cart, isLoading: isCartLoading, refresh: refreshCart } = useCartStore();
  const { isLoggedIn, jwt, user } = useAuthStore();
  const { selectedCurrency, convertPrice } = useCurrencyStore();
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);

  const [currentStep, setCurrentStep] = useState<CheckoutStep>(stepParam);
  const [countryName, setCountryName] = useState<string>("India");
  const [shipments, setShipments] = useState<ShipmentOption[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentOption | undefined>();
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [billingAddress, setBillingAddress] = useState<Partial<AddressItem> | null>(null);
  const [shippingAddress, setShippingAddress] = useState<Partial<AddressItem> | null>(null);
  const [sameAsShipping, setSameAsShipping] = useState<boolean>(true);

  const [couponCode, setCouponCode] = useState<string | undefined>();
  const [couponPercentage, setCouponPercentage] = useState<number>(0);
  const [wholesaleDiscount, setWholesaleDiscount] = useState<number>(0);
  const [orderNote, setOrderNote] = useState<string>("");
  const [whatsappDismissed, setWhatsappDismissed] = useState<boolean>(false);
  const [whatsappOptedIn, setWhatsappOptedIn] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("rp");

  const [busyId, setBusyId] = useState<string | null>(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasValidationErrors, setHasValidationErrors] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const currencyCode = selectedCurrency.toUpperCase();
  const items = cart?.items ?? [];

  const money = (value: number) =>
    convertPrice(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Sync step with URL
  const setStep = (step: CheckoutStep) => {
    setCurrentStep(step);
    setErrorMessage(null);
    setHasValidationErrors(false);
    startTransition(() => {
      router.push(`/checkout?step=${step}`, { scroll: true });
    });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Initial load for shipments, addresses, loyalty info
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [shipmentList, addressList, loyalty] = await Promise.allSettled([
          checkoutRepository.getShipmentList(),
          profileRepository.getAddressList(jwt || undefined),
          profileRepository.getWholesaleInfo(),
        ]);

        if (isMounted) {
          if (shipmentList.status === "fulfilled") {
            const list = shipmentList.value;
            setShipments(list);
            const defaultShipment = list.find((s) => s.locationType === "DOMESTIC") || list[0];
            setSelectedShipment(defaultShipment);
          }

          if (addressList.status === "fulfilled" && addressList.value.length > 0) {
            const addrs = addressList.value;
            setAddresses(addrs as any);
            const defaultBilling = addrs.find((a) => a.primaryBillingAddress) || addrs[0];
            const defaultShipping = addrs.find((a) => a.primaryShippingAddress) || addrs[0];
            setBillingAddress(defaultBilling as any);
            setShippingAddress(defaultShipping as any);
            if (defaultBilling.country) setCountryName(defaultBilling.country);
          }

          if (loyalty.status === "fulfilled" && loyalty.value) {
            setWholesaleDiscount(loyalty.value.discountPercentage || 0);
          }
        }
      } catch (err) {
        console.error("Failed to load checkout data:", err);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter shipments when country changes
  useEffect(() => {
    const isDomestic = countryName.toLowerCase() === "india";
    const filtered = shipments.filter((s) =>
      isDomestic ? s.locationType === "DOMESTIC" : s.locationType === "INTERNATIONAL"
    );
    if (filtered.length > 0) {
      setSelectedShipment(filtered[0]);
    }
  }, [countryName, shipments]);

  // Adjust payment gateway based on currency: INR => Razorpay, Non-INR => default to Stripe (with Razorpay option)
  useEffect(() => {
    if (currencyCode === "INR") {
      setPaymentMethod("rp");
    } else {
      setPaymentMethod((prev) => (prev === "rp" ? "st" : prev));
    }
  }, [currencyCode]);

  // Pricing calculations
  const priceBreakdown = calculateCheckoutPrices(
    items,
    selectedShipment,
    countryName,
    couponPercentage,
    couponCode,
    wholesaleDiscount
  );

  const estDeliveryFrom = selectedShipment
    ? calculateDeliveryTimestamp(selectedShipment.estimatedFromDay)
    : undefined;
  const estDeliveryTo = selectedShipment
    ? calculateDeliveryTimestamp(selectedShipment.estimatedToDay)
    : undefined;

  // Cart item mutations
  const handleUpdateQuantity = async (item: CartItem, next: number) => {
    if (next < 1 && item.orderType !== "PRE_ORDER") return handleRemoveItem(item);
    const isPreOrder =
      (item.orderType ?? "").toUpperCase() === "PRE_ORDER" ||
      (item.orderType ?? "").toUpperCase().includes("PRE") ||
      item.productGroup === "bulk";
    const minQty = isPreOrder ? (item.minOrderQuantity && item.minOrderQuantity > 1 ? item.minOrderQuantity : 25) : 1;
    if (isPreOrder && next < minQty) {
      setErrorMessage(`Minimum order quantity for bulk / pre-order is ${minQty} ${item.unit ? item.unit.toLowerCase() : "meter"}(s).`);
      return;
    }
    const availableStock = item.availableStock ?? item.product.availableQuantity;
    if (!isPreOrder && availableStock !== undefined && availableStock > 0 && next > availableStock) {
      setErrorMessage(`Only ${availableStock} quantity is left.`);
      return;
    }
    setBusyId(item.id);
    setErrorMessage(null);
    try {
      await cartRepository.updateQuantity(item, next);
      await refreshCart();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update item quantity.");
    } finally {
      setBusyId(null);
    }
  };

  const handleRemoveItem = async (item: CartItem) => {
    setBusyId(item.id);
    try {
      await cartRepository.removeCartItem(item.id);
      await refreshCart();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to remove item.");
    } finally {
      setBusyId(null);
    }
  };

  const handleMoveToWishlist = async (item: CartItem) => {
    setBusyId(item.id);
    try {
      if (item.product.sku) {
        toggleWishlist(item.product.name, item.product.sku);
      }
      await cartRepository.removeCartItem(item.id);
      await refreshCart();
      setSuccessMessage(`Moved "${item.product.name}" to wishlist.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to move item to wishlist.");
    } finally {
      setBusyId(null);
    }
  };

  // Voucher application
  const handleApplyVoucher = async (code: string) => {
    setErrorMessage(null);
    try {
      const res = await checkoutRepository.applyCoupon(code);
      if (res.success) {
        setCouponCode(code);
        setCouponPercentage(res.discountPercentage || 10);
        setSuccessMessage(`Voucher "${code}" applied successfully!`);
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(res.message || "Invalid or expired voucher code.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to apply voucher code.");
    }
  };

  const handleCancelVoucher = () => {
    setCouponCode(undefined);
    setCouponPercentage(0);
  };

  // Save or update address from modal
  const handleSaveNewAddress = async (newAddr: Partial<AddressItem>) => {
    try {
      let saved: any;
      const addrId = newAddr.id ? Number(newAddr.id) : undefined;
      const isExisting = addrId && addresses.some((a) => Number(a.id) === addrId);

      if (isExisting) {
        const res: any = await profileRepository.updateAddress({ ...newAddr, id: addrId } as any, jwt || undefined);
        saved = res?.data?.[0] || res?.payload || res?.entity || res || newAddr;
      } else {
        const res: any = await profileRepository.addAddress(newAddr as any, jwt || undefined);
        saved = res?.data?.[0] || res?.payload || res?.entity || res || newAddr;
      }

      const normalized: AddressItem = {
        ...newAddr,
        ...(typeof saved === "object" && !saved?.error ? saved : {}),
        id: saved?.id && !saved?.error ? Number(saved.id) : (addrId || Date.now()),
        name: (saved?.name && !saved?.error ? saved.name : "") || newAddr.name || user?.name || "My Address",
        companyName: saved?.companyName || newAddr.companyName || "",
        addressLineOne: saved?.addressLineOne || saved?.addressLine1 || newAddr.addressLineOne || (newAddr as any)?.addressLine1 || "",
        addressLine1: saved?.addressLineOne || saved?.addressLine1 || newAddr.addressLineOne || (newAddr as any)?.addressLine1 || "",
        addressLineTwo: saved?.addressLineTwo || saved?.addressLine2 || newAddr.addressLineTwo || (newAddr as any)?.addressLine2 || "",
        addressLine2: saved?.addressLineTwo || saved?.addressLine2 || newAddr.addressLineTwo || (newAddr as any)?.addressLine2 || "",
        city: saved?.city || newAddr.city || "",
        state: saved?.state || newAddr.state || "",
        postalCode: saved?.postalCode || newAddr.postalCode || "",
        country: saved?.country || newAddr.country || countryName || "India",
        primaryPhone: saved?.primaryPhone || newAddr.primaryPhone || "",
        contactEmail: saved?.contactEmail || newAddr.contactEmail || "",
        addressType: (saved?.addressType || newAddr.addressType || "SHIPPING") as "SHIPPING" | "BILLING",
        primaryBillingAddress: Boolean(saved?.primaryBillingAddress ?? newAddr.primaryBillingAddress),
        primaryShippingAddress: Boolean(saved?.primaryShippingAddress ?? newAddr.primaryShippingAddress ?? true),
      };

      setAddresses((prev) => {
        const exists = prev.some((a) => Number(a.id) === Number(normalized.id));
        if (exists) {
          return prev.map((a) => (Number(a.id) === Number(normalized.id) ? normalized : a));
        }
        return [normalized, ...prev];
      });

      setShippingAddress(normalized);
      if (sameAsShipping) {
        setBillingAddress(normalized);
      }
      setHasValidationErrors(false);
      setErrorMessage(null);
      setSuccessMessage("Address saved successfully.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save address.");
    }
  };

  // Step transitions & validation
  const handleContinueAction = () => {
    setErrorMessage(null);

    if (currentStep === "cart") {
      if (items.length === 0) {
        setErrorMessage("Your cart is empty. Please add items to proceed.");
        return;
      }
      setStep("shipping");
    } else if (currentStep === "shipping") {
      const activeShipping = shippingAddress || billingAddress || (addresses.length > 0 ? addresses[0] : null);
      const activeBilling = sameAsShipping
        ? activeShipping
        : (billingAddress || shippingAddress || (addresses.length > 0 ? addresses[0] : null));

      const isShippingValid = Boolean(
        activeShipping &&
        activeShipping.name?.trim() &&
        activeShipping.addressLineOne?.trim() &&
        isPhoneValid(activeShipping.primaryPhone)
      );

      const isBillingValid = Boolean(
        activeBilling &&
        activeBilling.name?.trim() &&
        activeBilling.addressLineOne?.trim() &&
        isPhoneValid(activeBilling.primaryPhone)
      );

      if (!isShippingValid || !isBillingValid) {
        setHasValidationErrors(true);
        setErrorMessage("Please check the highlighted details before continuing.");
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }
      setHasValidationErrors(false);
      setErrorMessage(null);
      setStep("payment");
    } else if (currentStep === "payment") {
      handlePlaceOrder();
    }
  };

  // Place Order & Trigger Payment
  const handlePlaceOrder = async () => {
    if (isProcessingOrder) return;
    setIsProcessingOrder(true);
    setErrorMessage(null);

    try {
      const activeBilling = billingAddress || shippingAddress;
      const activeShipping = shippingAddress || billingAddress;

      if (!activeBilling || !activeShipping) {
        throw new Error("Missing shipping or billing address.");
      }

      // Build AddOrderPayload
      const orderItems: AddOrderItem[] = items.map((item) => {
        const source = (item.source ?? {}) as any;
        return {
          orderType: item.orderType || "IN_STOCK",
          productGroup: item.productGroup || "finished",
          quantity: item.quantity,
          unit: item.unit || "UNIT",
          price: item.discountedUnitPrice ?? item.unitPrice,
          currency: currencyCode,
          estimatedDeliveryFrom: estDeliveryFrom || Date.now(),
          estimatedDeliveryTo: estDeliveryTo || Date.now(),
          customization: {
            finishProductId: source.finishedProductPreview?.id,
            finishedProductId: source.finishedProductPreview?.id,
            fabricProductId: source.fabricProductPreview?.id,
            selectedFabricId: source.selectedFabric?.id,
            selectedSizeOptionId: source.selectedSizeOption?.id,
            selectedFinishId: source.selectedFinishId,
            selectedFinishItem: source.selectedFinishList || [],
            customSize: source.customSize,
            sizeDisplayName: item.sizeDisplayName || "Size",
            finishDisplayName: item.finishDisplayName || "Finish",
          },
          loyaltyOrder: wholesaleDiscount > 0,
          loyaltyDiscountAmount: priceBreakdown.wholesaleDiscountAmount,
        };
      });

      const payload: AddOrderPayload = {
        orderItems,
        subTotal: priceBreakdown.subtotal,
        shippingMode: selectedShipment || {},
        shippingCost: priceBreakdown.shippingCost,
        total: priceBreakdown.total,
        currency: currencyCode,
        advancePay: priceBreakdown.advancePay,
        remainingPay: priceBreakdown.remainingBalance,
        autoDiscount: 0,
        couponApplied: Boolean(couponCode),
        couponCode,
        couponDiscount: priceBreakdown.couponDiscountAmount,
        address: {
          billingAddress: activeBilling,
          shippingAddress: activeShipping,
        },
        note: orderNote,
        gift: false,
        paymentMode: paymentMethod === "rp" ? "RAZORPAY" : "STRIPE",
        loyaltyOrder: wholesaleDiscount > 0,
        loyaltyDiscount: wholesaleDiscount,
        loyaltyDiscountAmount: priceBreakdown.wholesaleDiscountAmount,
      };

      const { orderId } = await checkoutRepository.createOrder(payload);

      if (!orderId) {
        throw new Error("Failed to obtain order id from server.");
      }

      if (paymentMethod === "rp") {
        const session = await checkoutRepository.createRazorpaySession(orderId);

        const isScriptLoaded = await loadRazorpayScript();
        if (!isScriptLoaded || !(window as any).Razorpay) {
          throw new Error("Failed to load Razorpay payment gateway.");
        }

        const rzpKey = session.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY || "rzp_test_TPvtsOM52j6QKA";
        const rzpAmount = session.amount || Math.round(priceBreakdown.advancePay * 100);

        const rzpOptions: any = {
          key: rzpKey,
          amount: rzpAmount,
          currency: session.currency || currencyCode || "INR",
          name: "Anuprerna",
          description: `Order #${orderId}`,
          image: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/static-data/Anuprerna+A-10.svg",
          prefill: {
            name: activeBilling.name || "",
            email: activeBilling.contactEmail || "",
            contact: activeBilling.primaryPhone || "",
          },
          theme: { color: "#ca9b6d" },
          handler: async function (response: any) {
            try {
              await checkoutRepository.verifyPaymentSuccess({
                loomOrderId: Number(orderId),
                paymentType: "advance",
                razorpayOrderId: response.razorpay_order_id || session.razorpayOrderId || `order_${orderId}`,
                transactionId: response.razorpay_payment_id || `pay_${Date.now()}`,
                transactionSignature: response.razorpay_signature || `sig_${Date.now()}`,
              });

              // Clear items and redirect to Thank You page
              await Promise.allSettled(items.map((i) => cartRepository.removeCartItem(i.id)));
              await refreshCart();
              router.push(`/profile/thank-you/${orderId}`);
            } catch (verErr) {
              console.error("Payment verification error:", verErr);
              router.push(`/profile/thank-you/${orderId}`);
            }
          },
          modal: {
            ondismiss: async function () {
              setIsProcessingOrder(false);
              await checkoutRepository.reportPaymentFailure({
                loomOrderId: Number(orderId),
                razorpayOrderId: session.razorpayOrderId,
                error: { reason: "Payment dismissed by user" },
              });
            },
          },
        };

        // Only attach order_id if it is a real Razorpay order ID (starts with order_)
        if (session.razorpayOrderId && session.razorpayOrderId.startsWith("order_") && !session.razorpayOrderId.startsWith("order_mock_")) {
          rzpOptions.order_id = session.razorpayOrderId;
        }

        const rzp = new (window as any).Razorpay(rzpOptions);
        rzp.on("payment.failed", function (resp: any) {
          console.error("Razorpay payment failed:", resp.error);
          setErrorMessage(resp.error?.description || "Payment failed. Please try again.");
          setIsProcessingOrder(false);
        });
        rzp.open();
        setIsProcessingOrder(false);
      } else if (paymentMethod === "st") {
        const stripeRes = await checkoutRepository.createStripeSession({
          loomOrderId: Number(orderId),
          paymentType: "advance",
          currency: currencyCode,
          totalAmount: priceBreakdown.advancePay,
          customerEmail: activeBilling.contactEmail,
          customerName: activeBilling.name,
          customerPhone: activeBilling.primaryPhone,
          customerCountryCode: countryName || "IN",
          customerShippingCountryCode: countryName || "IN",
        });

        // Clear cart items before redirecting
        try {
          await Promise.allSettled(items.map((i) => cartRepository.removeCartItem(i.id)));
          await refreshCart();
        } catch {}

        if (stripeRes?.checkoutUrl) {
          if (stripeRes.checkoutUrl.startsWith("http://") || stripeRes.checkoutUrl.startsWith("https://")) {
            window.location.href = stripeRes.checkoutUrl;
          } else {
            router.push(stripeRes.checkoutUrl);
          }
        } else {
          router.push(`/profile/thank-you/${orderId}?gateway=stripe`);
        }
      }
    } catch (err: any) {
      console.error("Order submission failed:", err);
      setErrorMessage(err.message || "Failed to process your order. Please try again.");
      setIsProcessingOrder(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-[65vh] bg-[#f8f9fa] flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-xl border border-gray-200/90 shadow-sm p-8 sm:p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-[#fbf7f1] text-[#ca9b6d] flex items-center justify-center mx-auto mb-4 border border-[#ca9b6d]/30">
            <span className="material-symbols-outlined text-2xl">lock</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to Checkout</h2>
          <p className="text-xs sm:text-sm text-gray-500 mb-6 leading-relaxed">
            Please log in or create an account to securely complete your artisan order.
          </p>
          <Link
            href="/auth?redirect=/checkout"
            className="block w-full bg-[#ca9b6d] hover:bg-[#b8895b] text-white py-3 rounded-lg font-bold uppercase tracking-wider text-xs shadow-sm transition-colors text-center cursor-pointer"
          >
            Sign In to Continue
          </Link>
        </div>
      </div>
    );
  }

  if (isCartLoading && items.length === 0) {
    return (
      <div className="min-h-[60vh] bg-[#f8f9fa] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#ca9b6d] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[65vh] bg-[#f8f9fa] flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-xl border border-gray-200/90 shadow-sm p-8 sm:p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-2xl">shopping_cart</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
          <p className="text-xs sm:text-sm text-gray-500 mb-6 leading-relaxed">
            Add handmade fabrics, garments, or artisanal pieces to begin checkout.
          </p>
          <Link
            href="/products/fabric"
            className="block w-full bg-[#ca9b6d] hover:bg-[#b8895b] text-white py-3 rounded-lg font-bold uppercase tracking-wider text-xs shadow-sm transition-colors text-center cursor-pointer"
          >
            Explore Fabric Collection
          </Link>
        </div>
      </div>
    );
  }

  const activeShipmentList = shipments.filter((s) =>
    countryName.toLowerCase() === "india"
      ? s.locationType === "DOMESTIC"
      : s.locationType === "INTERNATIONAL"
  );

  return (
    <div className="bg-[#f8f9fa] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
        {/* Top Back Navigation Sub-header */}
        <div className="mb-5">
          {currentStep === "cart" ? (
            <Link
              href="/products/fabric"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-900 hover:text-[#ca9b6d] transition-colors"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Back to Shopping</span>
            </Link>
          ) : currentStep === "shipping" ? (
            <button
              type="button"
              onClick={() => setStep("cart")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-900 hover:text-[#ca9b6d] cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Back to Your Order</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep("shipping")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-900 hover:text-[#ca9b6d] cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Back to Delivery Details</span>
            </button>
          )}
        </div>

        {/* Stepper Card */}
        <CheckoutStepHeader currentStep={currentStep} onSelectStep={setStep} />

        {/* Highlighted Alert Banner (Matching Screenshot 1) */}
        {errorMessage && (
          <div className="bg-[#ffebee] border border-[#f5c6cb] text-[#c62828] text-xs sm:text-sm font-medium p-3.5 rounded-xl mb-6 flex items-center justify-between gap-3 shadow-xs">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-[#c62828] hover:opacity-75 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-xs sm:text-sm p-4 rounded-xl mb-6 flex items-start justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-green-600">check_circle</span>
              <span>{successMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-green-500 hover:text-green-800 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* 2-Column Checkout Layout */}
        <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
          {/* Left Column (58% on Desktop) */}
          <div className="w-full lg:w-[58%] flex flex-col">
            {/* Step 1: Your Order */}
            {currentStep === "cart" && (
              <>
                <CheckoutShipToAndMethod
                  countryName={countryName}
                  onCountryChange={setCountryName}
                  shipments={activeShipmentList}
                  selectedShipmentId={selectedShipment?.id}
                  onSelectShipment={setSelectedShipment}
                  currencyCode={currencyCode}
                  money={money}
                  isShippingFree={priceBreakdown.isShippingFree}
                  items={items}
                  subtotal={priceBreakdown.subtotal}
                />

                <CheckoutItemsList
                  items={items}
                  currencyCode={currencyCode}
                  money={money}
                  shipmentFromDay={selectedShipment?.estimatedFromDay || 3}
                  shipmentToDay={selectedShipment?.estimatedToDay || 6}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onMoveToWishlist={handleMoveToWishlist}
                  busyId={busyId}
                />
              </>
            )}

            {/* Step 2: Delivery Details (Matching Screenshot 2) */}
            {currentStep === "shipping" && (
              <>
                {!whatsappDismissed && (
                  <CheckoutWhatsAppOptin
                    onOptIn={() => {
                      setWhatsappOptedIn(true);
                      setSuccessMessage("WhatsApp notifications enabled!");
                      setTimeout(() => setSuccessMessage(null), 4000);
                    }}
                    onDismiss={() => setWhatsappDismissed(true)}
                    isOptedIn={whatsappOptedIn}
                  />
                )}

                <CheckoutAddressSection
                  addresses={addresses}
                  selectedBillingAddress={billingAddress}
                  selectedShippingAddress={shippingAddress}
                  onSelectBillingAddress={setBillingAddress}
                  onSelectShippingAddress={setShippingAddress}
                  onSaveNewAddress={handleSaveNewAddress}
                  countryName={countryName}
                  hasValidationErrors={hasValidationErrors}
                  sameAsShipping={sameAsShipping}
                  onToggleSameAsShipping={setSameAsShipping}
                />

                <CheckoutShipmentTier
                  shipments={activeShipmentList}
                  selectedShipmentId={selectedShipment?.id}
                  onSelectShipment={setSelectedShipment}
                  currencyCode={currencyCode}
                  money={money}
                  isShippingFree={priceBreakdown.isShippingFree}
                  items={items}
                  subtotal={priceBreakdown.subtotal}
                  countryName={countryName}
                  title="How would you like it delivered?"
                />

                <CheckoutItemsList
                  items={items}
                  currencyCode={currencyCode}
                  money={money}
                  shipmentFromDay={selectedShipment?.estimatedFromDay || 3}
                  shipmentToDay={selectedShipment?.estimatedToDay || 6}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onMoveToWishlist={handleMoveToWishlist}
                  busyId={busyId}
                />
              </>
            )}

            {/* Step 3: Payment (Matching Screenshot) */}
            {currentStep === "payment" && (
              <>
                <CheckoutPaymentMethods
                  paymentMethod={paymentMethod}
                  onSelectPaymentMethod={setPaymentMethod}
                  currencyCode={currencyCode}
                />

                <CheckoutItemsList
                  items={items}
                  currencyCode={currencyCode}
                  money={money}
                  shipmentFromDay={selectedShipment?.estimatedFromDay || 3}
                  shipmentToDay={selectedShipment?.estimatedToDay || 6}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onMoveToWishlist={handleMoveToWishlist}
                  busyId={busyId}
                />
              </>
            )}
          </div>

          {/* Right Column (42% on Desktop): Sticky Sidebar */}
          <div className="w-full lg:w-[42%] lg:sticky lg:top-24">
            <CheckoutPriceSummary
              price={priceBreakdown}
              currencyCode={currencyCode}
              money={money}
              onApplyVoucher={handleApplyVoucher}
              onCancelVoucher={handleCancelVoucher}
              note={orderNote}
              onNoteChange={setOrderNote}
              currentStep={currentStep}
              onContinue={handleContinueAction}
              isProcessing={isProcessingOrder}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

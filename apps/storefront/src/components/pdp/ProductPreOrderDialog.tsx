"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrencyStore } from "@/stores/currency.store";
import { useCartStore } from "@/stores/cart.store";
import { useAuthStore } from "@/stores/auth.store";
import { cartRepository } from "@/lib/api/repositories/cart.repository";
import { ProductCustomFabricProfile, FabricProfileItem } from "./ProductCustomFabricProfile";
import { ProductFinishProfile, FinishProfileItem } from "./ProductFinishProfile";
import { ProductSizeProfile, SizeProfileOption } from "./ProductSizeProfile";
import { ProductVolumeDiscountDialog, VolumeDiscountItem, VolumeDiscountProfile } from "./ProductVolumeDiscountDialog";
import { calculateVDProductPrice, getConsumedFabric } from "@/lib/pdp/pricing-engine";

export interface ProductPreOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  productData: any;
  initialSelectedFabric?: FabricProfileItem | null;
  initialSelectedFinishes?: FinishProfileItem[];
  initialSelectedSize?: SizeProfileOption | null;
  initialCustomSizeData?: Record<string, string> | null;
}

function formatDateRange(fromDays: number, toDays: number): string {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() + fromDays);

  const toDate = new Date();
  toDate.setDate(toDate.getDate() + toDays);

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const fromStr = `${getOrdinal(fromDate.getDate())} ${months[fromDate.getMonth()]}`;
  const toStr = `${getOrdinal(toDate.getDate())} ${months[toDate.getMonth()]}, ${toDate.getFullYear()}`;

  return `${fromStr} to ${toStr}`;
}

const DEFAULT_FABRIC_VD_PROFILE: VolumeDiscountProfile = {
  profileName: "Volume Discount",
  disclaimer: "Volume discounts applied automatically based on meterage.",
  volumeDiscountProfileItemList: [
    { minimumOrderQuantity: 50, discount: 7.5, preOrder: true, advancePayment: 50, deliveryFromDays: 45, deliveryToDays: 60 },
    { minimumOrderQuantity: 75, discount: 10.0, preOrder: true, advancePayment: 50, deliveryFromDays: 45, deliveryToDays: 60 },
    { minimumOrderQuantity: 100, discount: 17.5, preOrder: true, advancePayment: 50, deliveryFromDays: 45, deliveryToDays: 60 },
  ],
};

export function ProductPreOrderDialog({
  isOpen,
  onClose,
  product,
  productData,
  initialSelectedFabric = null,
  initialSelectedFinishes = [],
  initialSelectedSize = null,
  initialCustomSizeData = null,
}: ProductPreOrderDialogProps) {
  const router = useRouter();
  const { selectedCurrency, convertPrice } = useCurrencyStore();
  const { refresh: refreshCart, open: openCart } = useCartStore();
  const { isLoggedIn } = useAuthStore();
  const currencyCode = selectedCurrency.toUpperCase();

  const [selectedFabric, setSelectedFabric] = useState<FabricProfileItem | null>(initialSelectedFabric);
  const [selectedFinishes, setSelectedFinishes] = useState<FinishProfileItem[]>(initialSelectedFinishes);
  const [selectedSize, setSelectedSize] = useState<SizeProfileOption | null>(initialSelectedSize);
  const [customSizeData, setCustomSizeData] = useState<Record<string, string> | null>(initialCustomSizeData);

  const [showVDModal, setShowVDModal] = useState(false);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  const [copiedSku, setCopiedSku] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const p = product || productData?.product || {};
  const productGroup = p.productGroup === "finished" ? "finished" : "fabric";
  const unit = (p.unit || "METER").toLowerCase();

  const rawVd = product?.volumeDiscountProfile || productData?.product?.volumeDiscountProfile || productData?.volumeDiscountProfile;
  const vdProfile: VolumeDiscountProfile | undefined = rawVd || (productGroup === "fabric" ? DEFAULT_FABRIC_VD_PROFILE : undefined);

  const vdList: VolumeDiscountItem[] = vdProfile?.volumeDiscountProfileItemList
    ? [...vdProfile.volumeDiscountProfileItemList].sort(
        (a, b) => a.minimumOrderQuantity - b.minimumOrderQuantity
      )
    : [];

  // Calculate default pre-order MOQ
  const preOrderTier = vdList.find((item) => item.preOrder) || vdList[0];
  const defaultMoq = preOrderTier ? preOrderTier.minimumOrderQuantity : 50;

  const [quantity, setQuantity] = useState<number>(defaultMoq);

  useEffect(() => {
    if (isOpen) {
      setSelectedFabric(initialSelectedFabric);
      setSelectedFinishes(initialSelectedFinishes);
      setSelectedSize(initialSelectedSize);
      setCustomSizeData(initialCustomSizeData);
      setQuantity(defaultMoq);
    }
  }, [isOpen, initialSelectedFabric, initialSelectedFinishes, initialSelectedSize, initialCustomSizeData, defaultMoq]);

  if (!isOpen) return null;

  // Find active discount tier based on quantity
  const sortedDescTiers = [...vdList].sort(
    (a, b) => b.minimumOrderQuantity - a.minimumOrderQuantity
  );
  const activeTier = sortedDescTiers.find((t) => t.minimumOrderQuantity <= quantity);

  const discountPercent = activeTier ? activeTier.discount || 0 : 0;
  const advancePercent = activeTier && activeTier.advancePayment ? activeTier.advancePayment : 50;
  const fromDays = activeTier ? activeTier.deliveryFromDays || 45 : 45;
  const toDays = activeTier ? activeTier.deliveryToDays || 60 : 60;

  // Base raw price calculation matching Angular setProductData & reCalculatePrice
  const rawMakingCharge = Number(p.price || 0);
  const totalFinishPrice = selectedFinishes.reduce((sum, f) => sum + Number(f.price || 0), 0);
  const customSizePrice = customSizeData && p.customSizeProfile?.price ? Number(p.customSizeProfile.price) : 0;

  const effectiveSize = selectedSize || initialSelectedSize;
  const consumedFabric = getConsumedFabric(p, effectiveSize);

  let basePrice = rawMakingCharge;
  let activeFabricCost = 0;

  if (productGroup === "finished") {
    const rawFabricPrice =
      selectedFabric?.fabricPreview?.price ??
      (selectedFabric as any)?.price ??
      p.madeToOrderFabric?.price ??
      p.made_to_order_fabric_price;

    const selectedFabricPrice =
      rawFabricPrice !== undefined && rawFabricPrice !== null && !isNaN(Number(rawFabricPrice)) && Number(rawFabricPrice) > 0
        ? Number(rawFabricPrice)
        : (selectedFabric || p.madeToOrderFabric ? rawMakingCharge : 0);

    activeFabricCost = selectedFabricPrice * consumedFabric;
    basePrice = Math.round((rawMakingCharge + activeFabricCost + totalFinishPrice + customSizePrice) * 100) / 100;
  } else {
    const customFabricPrice = selectedFabric?.fabricPreview?.price ?? (selectedFabric as any)?.price;
    const activeBasePrice =
      customFabricPrice !== undefined && customFabricPrice !== null && !isNaN(Number(customFabricPrice))
        ? Number(customFabricPrice)
        : rawMakingCharge;
    basePrice = Math.round((activeBasePrice + totalFinishPrice + customSizePrice) * 100) / 100;
  }

  const discountedUnitPrice = activeTier
    ? calculateVDProductPrice({
        product: p,
        selectedFabric,
        selectFinishPrice: totalFinishPrice,
        customSizePrice,
        selectedVDProfile: activeTier,
        quantity,
        consumedFabric,
      })
    : basePrice;

  // Angular picks tier with maximum discount for bulk price pill button
  const maxDiscountTier = sortedDescTiers[0];
  const bulkPrice = maxDiscountTier
    ? calculateVDProductPrice({
        product: p,
        selectedFabric,
        selectFinishPrice: totalFinishPrice,
        customSizePrice,
        selectedVDProfile: maxDiscountTier,
        quantity: maxDiscountTier.minimumOrderQuantity,
        consumedFabric,
      })
    : basePrice;

  const convertedBulkPrice = convertPrice(bulkPrice);

  const handleCopySku = () => {
    if (p.sku) {
      navigator.clipboard.writeText(p.sku);
      setCopiedSku(true);
      setTimeout(() => setCopiedSku(false), 2000);
    }
  };

  const handlePreOrderNow = async () => {
    if (!isLoggedIn) {
      if (typeof window !== "undefined") {
        router.push(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`);
      } else {
        router.push("/auth");
      }
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const finishIds = selectedFinishes.map((f) => f.id).filter(Boolean);
      const finishIdToUse = finishIds.length > 0 ? finishIds.join(",") : undefined;
      const previewId = Number(productData?.id || productData?.previewId || productData?.fabricProduct?.id || productData?.finishedProduct?.id || p.id || 0);

      await cartRepository.addToCart({
        fabricProductId: productGroup === "fabric" ? previewId : undefined,
        finishedProductId: productGroup === "finished" ? previewId : undefined,
        quantity: quantity,
        unit: (p.unit || "METER").toUpperCase(),
        price: discountedUnitPrice,
        makingCharge: productGroup === "finished" ? (rawMakingCharge || 0) : 0,
        sku: p.sku || "",
        orderType: "PRE_ORDER",
        selectedFabricId: selectedFabric?.fabricPreview?.id
          ? Number(selectedFabric.fabricPreview.id)
          : (selectedFabric as any)?.id ? Number((selectedFabric as any).id) : undefined,
        selectedSizeOptionId: selectedSize?.id ? Number(selectedSize.id) : undefined,
        customSize: customSizeData || undefined,
        productGroup,
        selectedFinishId: finishIdToUse,
        minOrderQuantity: defaultMoq,
      });

      await refreshCart();
      onClose();
      openCart();
    } catch (err: any) {
      console.error("Failed to add pre-order to cart:", err);
      setErrorMessage(err?.message || "Failed to add pre-order item to cart.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        {/* Click outside to close */}
        <div className="flex-1" onClick={onClose} />

        {/* Slide-over Drawer Panel */}
        <div className="w-full max-w-[680px] h-full bg-white shadow-2xl flex flex-col relative overflow-hidden animate-in slide-in-from-right duration-300">
          {/* Top Left Close Button */}
          <div className="p-4 pb-2 flex justify-between items-center z-10">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded bg-[#D4A373] text-white flex items-center justify-center hover:bg-[#b58356] transition-colors cursor-pointer shadow"
              title="Close"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-3">
            {/* Title */}
            <h2 className="w-full font-semibold text-[#3c3c3c] text-xl md:text-2xl text-center">
              Pre Order
            </h2>

            {/* Error Message Banner */}
            {errorMessage && (
              <div className="w-full bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 flex items-center justify-between animate-in fade-in">
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-red-500 hover:text-red-800 font-bold ml-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Disclaimer Advance Payment Box */}
            <div className="w-full flex justify-center mt-1 mb-2">
              <div className="w-full bg-[#FFF8D0] border border-[#FFEBAA] rounded-lg p-2.5 flex items-center justify-center gap-2 text-xs text-[#6B5A10] font-medium text-center">
                <span className="material-symbols-outlined text-base text-[#7D5A20] shrink-0">
                  error
                </span>
                <p>An advance payment of {advancePercent}% is required at checkout</p>
              </div>
            </div>

            {/* Special Status Badge */}
            {p.specialStatus?.name && (
              <div className="inline-block bg-[#275E49] text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full w-fit">
                {p.specialStatus.name}
              </div>
            )}

            {/* Product Title */}
            <h1 className="fb-font-dm text-xl md:text-2xl font-bold text-gray-900 leading-tight">
              {p.name}
            </h1>

            {/* SKU with Copy Icon */}
            {p.sku && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono">
                <span>SKU: {p.sku}</span>
                <button
                  type="button"
                  onClick={handleCopySku}
                  className="hover:text-gray-900 cursor-pointer flex items-center"
                  title="Copy SKU"
                >
                  <span className="material-symbols-outlined text-sm">
                    {copiedSku ? "check" : "content_copy"}
                  </span>
                </button>
              </div>
            )}

            {/* Pricing Section */}
            <div className="flex items-center justify-between flex-wrap gap-2 mt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {currencyCode}
                </span>

                {discountedUnitPrice < basePrice || discountPercent > 0 ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-gray-400 line-through">
                      {convertPrice(basePrice).toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-xl font-bold text-gray-900">
                      {convertPrice(discountedUnitPrice).toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-xs text-gray-500">/ {unit}</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-gray-900">
                      {convertPrice(basePrice).toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-xs text-gray-500">/ {unit}</span>
                  </div>
                )}
              </div>

              {/* View Price Details Popover Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
                  className="text-xs text-[#7D5A20] font-semibold underline hover:text-black cursor-pointer"
                >
                  View Price Details
                </button>

                {showPriceBreakdown && (
                  <div className="absolute right-0 top-6 w-64 bg-white border border-gray-200 rounded-lg shadow-xl p-3 z-30 text-xs flex flex-col gap-2">
                    <div className="font-bold text-gray-900 border-b pb-1">Price Details</div>
                    <div className="flex justify-between text-gray-600">
                      <span>Base Making / Fabric:</span>
                      <span>{currencyCode} {convertPrice(rawMakingCharge).toFixed(2)}</span>
                    </div>
                    {activeFabricCost > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Custom Fabric Cost:</span>
                        <span>{currencyCode} {convertPrice(activeFabricCost).toFixed(2)}</span>
                      </div>
                    )}
                    {totalFinishPrice > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Custom Finishes / Dyes:</span>
                        <span>+{currencyCode} {convertPrice(totalFinishPrice).toFixed(2)}</span>
                      </div>
                    )}
                    {customSizePrice > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Custom Size Surcharge:</span>
                        <span>+{currencyCode} {convertPrice(customSizePrice).toFixed(2)}</span>
                      </div>
                    )}
                    {discountPercent > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Volume Discount ({discountPercent}%):</span>
                        <span>-{currencyCode} {convertPrice(basePrice - discountedUnitPrice).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-gray-900 border-t pt-1">
                      <span>Net Unit Price:</span>
                      <span>{currencyCode} {convertPrice(discountedUnitPrice).toFixed(2)} / {unit}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bulk Price Pill Badge Button */}
            {vdProfile && (
              <button
                type="button"
                onClick={() => setShowVDModal(true)}
                className="w-fit border border-[#C79D6D] text-[#C79D6D] bg-[#FFFBF7] rounded px-3 py-1.5 text-xs font-semibold flex items-center gap-1 hover:bg-[#F9F3EA] transition-colors cursor-pointer mt-1"
              >
                <span>
                  Bulk Price @ {currencyCode}{" "}
                  {convertedBulkPrice.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}{" "}
                  / {unit} &gt;
                </span>
              </button>
            )}

            {/* Customizations for Pre-Order (Fabric, Size, Finish) */}
            {p.fabricProfileEnabled && (p.fabricProfile || productData?.fabricProfile) && (
              <div className="mt-2">
                <ProductCustomFabricProfile
                  product={p}
                  fabricProfile={p.fabricProfile || productData?.fabricProfile || {}}
                  selectedFabric={selectedFabric}
                  onSelectFabric={(fab) => setSelectedFabric(fab)}
                />
              </div>
            )}

            {p.sizeProfileEnabled && (p.sizeProfile || productData?.sizeProfile) && (
              <div className="mt-2">
                <ProductSizeProfile
                  product={p}
                  sizeProfile={p.sizeProfile || productData?.sizeProfile}
                  productSizeProfileList={p.productSizeProfileList || []}
                  selectedSize={selectedSize}
                  onSizeSelect={(size) => setSelectedSize(size)}
                  customSizeSubmittedData={customSizeData}
                  onCustomSizeSubmit={(data) => setCustomSizeData(data)}
                />
              </div>
            )}

            {/* Custom Organic Dye & Natural Vegetable Dye */}
            {(p.finishProfileEnabled !== false || productGroup === "fabric") && (
              <div className="mt-2">
                <ProductFinishProfile
                  finishProfile={p.finishProfile || productData?.finishProfile || null}
                  selectedFinishes={selectedFinishes}
                  onFinishChange={(finishes) => setSelectedFinishes(finishes)}
                />
              </div>
            )}

            {/* Quantity Stepper Input */}
            <div className="flex flex-col gap-1.5 mt-3">
              <span className="text-xs font-bold text-[#3c3c3c] capitalize">
                Quantity ({unit})
              </span>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-[#D1D4DB] rounded bg-white overflow-hidden">
                  <button
                    type="button"
                    disabled={quantity <= defaultMoq}
                    onClick={() => setQuantity((q) => Math.max(defaultMoq, q - 1))}
                    className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30 font-bold transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(defaultMoq, parseInt(e.target.value) || defaultMoq))
                    }
                    className="w-16 text-center text-sm font-bold focus:outline-none"
                    min={defaultMoq}
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 font-bold transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <span className="text-xs text-gray-600 font-medium">
                  Minimum order quantity is {defaultMoq} {unit}
                </span>
              </div>
            </div>

            {/* Estimated Delivery Date with Truck SVG */}
            <div className="flex items-center gap-3 border-t border-gray-200 pt-4 mt-2">
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M28.05 15.5719L25.2375 9.00937C25.1657 8.83992 25.0457 8.69534 24.8923 8.59365C24.7389 8.49196 24.559 8.43765 24.375 8.4375H21.5625V6.5625C21.5625 6.31386 21.4637 6.0754 21.2879 5.89959C21.1121 5.72377 20.8736 5.625 20.625 5.625H2.8125C2.56386 5.625 2.3254 5.72377 2.14959 5.89959C1.97377 6.0754 1.875 6.31386 1.875 6.5625V22.5C1.875 22.7486 1.97377 22.9871 2.14959 23.1629C2.3254 23.3387 2.56386 23.4375 2.8125 23.4375H4.81875C5.03464 24.2319 5.50594 24.9332 6.15993 25.4332C6.81393 25.9332 7.61428 26.2041 8.4375 26.2041C9.26072 26.2041 10.0611 25.9332 10.7151 25.4332C11.3691 24.9332 11.8404 24.2319 12.0562 23.4375H17.9437C18.1596 24.2319 18.6309 24.9332 19.2849 25.4332C19.9389 25.9332 20.7393 26.2041 21.5625 26.2041C22.3857 26.2041 23.1861 25.9332 23.8401 25.4332C24.4941 24.9332 24.9654 24.2319 25.1813 23.4375H27.1875C27.4361 23.4375 27.6746 23.3387 27.8504 23.1629C28.0262 22.9871 28.125 22.7486 28.125 22.5V15.9375C28.1248 15.8118 28.0993 15.6875 28.05 15.5719ZM21.5625 10.3125H23.7563L25.7625 15H21.5625V10.3125ZM8.4375 24.375C8.06666 24.375 7.70415 24.265 7.39581 24.059C7.08746 23.853 6.84714 23.5601 6.70523 23.2175C6.56331 22.8749 6.52618 22.4979 6.59853 22.1342C6.67087 21.7705 6.84945 21.4364 7.11167 21.1742C7.3739 20.912 7.70799 20.7334 8.07171 20.661C8.43542 20.5887 8.81242 20.6258 9.15503 20.7677C9.49764 20.9096 9.79048 21.15 9.99651 21.4583C10.2025 21.7666 10.3125 22.1292 10.3125 22.5C10.3125 22.9973 10.115 23.4742 9.76332 23.8258C9.41169 24.1775 8.93478 24.375 8.4375 24.375ZM17.9437 21.5625H12.0562C11.8404 20.7681 11.3691 20.0668 10.7151 19.5668C10.0611 19.0668 9.26072 18.7959 8.4375 18.7959C7.61428 18.7959 6.81393 19.0668 6.15993 19.5668C5.50594 20.0668 5.03464 20.7681 4.81875 21.5625H3.75V7.5H19.6875V19.275C19.2606 19.5228 18.8868 19.8524 18.5876 20.2449C18.2884 20.6375 18.0696 21.0852 17.9437 21.5625ZM21.5625 24.375C21.1917 24.375 20.8291 24.265 20.5208 24.059C20.2125 23.853 19.9721 23.5601 19.8302 23.2175C19.6883 22.8749 19.6512 22.4979 19.7235 22.1342C19.7959 21.7705 19.9745 21.4364 20.2367 21.1742C20.4989 20.912 20.833 20.7334 21.1967 20.661C21.5604 20.5887 21.9374 20.6258 22.28 20.7677C22.6226 20.9096 22.9155 21.15 23.1215 21.4583C23.3275 21.7666 23.4375 22.1292 23.4375 22.5C23.4375 22.9973 23.24 23.4742 22.8883 23.8258C22.5367 24.1775 22.0598 24.375 21.5625 24.375ZM26.25 21.5625H25.1813C24.9739 20.7596 24.5063 20.048 23.8515 19.5391C23.1968 19.0302 22.3918 18.7527 21.5625 18.75V16.875H26.25V21.5625Z"
                  fill="#7D5A20"
                />
              </svg>
              <div className="flex flex-col text-xs md:text-sm">
                <span className="text-gray-600">Pre Order, Estimated Date Of Delivery</span>
                <span className="font-bold text-gray-900">{formatDateRange(fromDays, toDays)}</span>
              </div>
            </div>

            {/* Pre-Order Now Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handlePreOrderNow}
                disabled={isSubmitting}
                className="w-full bg-[#D4A373] hover:bg-[#b58356] text-white font-medium py-3 rounded-md text-base transition-colors shadow-sm cursor-pointer disabled:opacity-60 text-center"
              >
                {isSubmitting ? "Adding Pre-Order..." : "Pre-Order Now"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Nested Volume Discount Profile Modal */}
      {vdProfile && (
        <ProductVolumeDiscountDialog
          isOpen={showVDModal}
          onClose={() => setShowVDModal(false)}
          product={p}
          basePrice={basePrice}
          selectFinishPrice={totalFinishPrice}
          customSizePrice={customSizePrice}
          selectedFabric={selectedFabric}
          unit={unit}
          volumeDiscountProfile={vdProfile}
          consumedFabric={consumedFabric}
        />
      )}
    </>
  );
}

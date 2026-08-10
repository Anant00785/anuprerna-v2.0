'use client';

import React, { useEffect, useState } from 'react';
import { X, Star, Upload, Loader2, Check, Search, Image as ImageIcon } from 'lucide-react';
import { ReviewService, IReview } from '@/services/review-service';
import { ProductService } from '@/services/product-service';

interface ReviewModalProps {
  isOpen: boolean;
  initialData?: IReview | null;
  onClose: () => void;
  onSaved: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  initialData,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Product Picker state
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);

  // Image Upload state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Form Validation & Submit state
  const [errors, setErrors] = useState<{ name?: string; country?: string; rating?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadProducts();
      if (initialData) {
        setName(initialData.name || '');
        setCity(initialData.city || '');
        setCountry(initialData.country || '');
        setRating(initialData.rating || 5);
        setDescription(initialData.description || '');
        setLink(initialData.link || '');
        setSelectedProduct(initialData.product || null);
        if (initialData.productImages) {
          const imgs = initialData.productImages.split(',').filter(Boolean);
          setImagePreviews(imgs);
        } else {
          setImagePreviews([]);
        }
      } else {
        setName('');
        setCity('');
        setCountry('');
        setRating(5);
        setDescription('');
        setLink('');
        setSelectedProduct(null);
        setImageFiles([]);
        setImagePreviews([]);
      }
      setErrors({});
      setApiError('');
    }
  }, [isOpen, initialData]);

  const loadProducts = async () => {
    if (products.length > 0) return;
    setLoadingProducts(true);
    try {
      const [finished, fabrics] = await Promise.allSettled([
        ProductService.getFinishedProducts(),
        ProductService.getFabricProducts(),
      ]);
      const list1 = finished.status === 'fulfilled' ? finished.value : [];
      const list2 = fabrics.status === 'fulfilled' ? fabrics.value : [];
      setProducts([...list1, ...list2]);
    } catch {
      // Fallback empty
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    setImageFiles((prev) => [...prev, ...selected]);

    selected.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImagePreviews((prev) => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePreview = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const err: { name?: string; country?: string; rating?: string } = {};
    if (!name.trim()) err.name = 'Name is required';
    if (!country.trim()) err.country = 'Country is required';
    if (!rating || rating < 1 || rating > 5) err.rating = 'Rating (1-5 stars) is required';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setApiError('');

    try {
      let uploadedUrls: string[] = [];

      if (imageFiles.length > 0) {
        setUploadingImages(true);
        for (const file of imageFiles) {
          try {
            const url = await ReviewService.uploadReviewImage(file);
            if (url) uploadedUrls.push(url);
          } catch {
            // keep going
          }
        }
        setUploadingImages(false);
      }

      // Combine existing previews (which are URLs) with newly uploaded ones
      const existingUrls = imagePreviews.filter((p) => p.startsWith('http://') || p.startsWith('https://'));
      const finalImageString = [...existingUrls, ...uploadedUrls].join(',');

      const payload: IReview = {
        ...(initialData || {}),
        name: name.trim(),
        city: city.trim(),
        country: country.trim(),
        rating,
        description: description.trim(),
        link: link.trim(),
        adminAdded: true,
        productId: selectedProduct?.id || selectedProduct?.productId || initialData?.productId || undefined,
        productImages: finalImageString,
        createdAt: initialData?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      if (initialData?.id) {
        await ReviewService.updateReview(payload);
      } else {
        await ReviewService.addReview(payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setApiError(err.message || 'Failed to save review');
    } finally {
      setSubmitting(false);
      setUploadingImages(false);
    }
  };

  if (!isOpen) return null;

  const filteredProducts = products.filter((p) => {
    const term = productSearch.toLowerCase();
    const sku = (p.sku || p.productSku || '').toLowerCase();
    const prodName = (p.name || p.productName || '').toLowerCase();
    return sku.includes(term) || prodName.includes(term);
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
            <h3 className="font-bold text-slate-900 text-base">
              {initialData?.id ? 'Edit Customer Review' : 'Add Manual Product Review'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {apiError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl">
              {apiError}
            </div>
          )}

          {/* Star Rating Picker */}
          <div>
            <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1.5">
              Rating Stars *
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-7 h-7 ${filled ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                    />
                  </button>
                );
              })}
              <span className="ml-2 font-bold text-sm text-slate-800">{rating}.0 / 5.0</span>
            </div>
            {errors.rating && <p className="text-rose-500 text-xs mt-1">{errors.rating}</p>}
          </div>

          {/* Reviewer Name */}
          <div>
            <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">
              Reviewer Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Nicole Frederick"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 border ${
                errors.name ? 'border-rose-400' : 'border-slate-200'
              } rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900`}
            />
            {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Location: City & Country */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">
                City
              </label>
              <input
                type="text"
                placeholder="e.g. Souderton"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">
                Country *
              </label>
              <input
                type="text"
                placeholder="e.g. United States, India"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 border ${
                  errors.country ? 'border-rose-400' : 'border-slate-200'
                } rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900`}
              />
              {errors.country && <p className="text-rose-500 text-xs mt-1">{errors.country}</p>}
            </div>
          </div>

          {/* Product Picker */}
          <div className="relative">
            <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">
              Associated Product (SKU)
            </label>
            {selectedProduct ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">{selectedProduct.sku || selectedProduct.name}</p>
                  <p className="text-2xs text-slate-500">{selectedProduct.name || selectedProduct.productGroup}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="text-xs font-bold text-rose-600 hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  placeholder="Search and select product by SKU..."
                  value={productSearch}
                  onFocus={() => setProductDropdownOpen(true)}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setProductDropdownOpen(true);
                  }}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
                />

                {productDropdownOpen && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100">
                    {loadingProducts ? (
                      <div className="p-4 text-center text-xs text-slate-400">Loading products...</div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">No products found</div>
                    ) : (
                      filteredProducts.slice(0, 30).map((p) => (
                        <div
                          key={p.id || p.productId}
                          onClick={() => {
                            setSelectedProduct(p);
                            setProductDropdownOpen(false);
                          }}
                          className="p-2.5 hover:bg-slate-50 cursor-pointer text-xs flex items-center justify-between"
                        >
                          <span className="font-bold text-slate-900">{p.sku || p.name}</span>
                          <span className="text-2xs text-slate-400 font-mono">{p.name || p.productGroup}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* External Review Link */}
          <div>
            <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">
              External Review Link (URL)
            </label>
            <input
              type="url"
              placeholder="e.g. https://google.com/review/123"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">
              Review Content & Comments
            </label>
            <textarea
              rows={4}
              placeholder="e.g. The quality of this fabric is beyond amazing! Color is bright and pattern is consistent."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Product Photos Upload */}
          <div>
            <label className="block font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1">
              Review Product Photos
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-all">
                <Upload className="w-4 h-4" />
                <span>Upload Photos</span>
                <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
              <span className="text-2xs text-slate-400">{imagePreviews.length} photos selected</span>
            </div>

            {imagePreviews.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {imagePreviews.map((img, idx) => (
                  <div key={idx} className="relative group w-14 h-14 rounded-xl overflow-hidden border border-slate-200">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePreview(idx)}
                      className="absolute top-0.5 right-0.5 p-1 bg-slate-900/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingImages}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-sm"
            >
              {submitting || uploadingImages ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>{initialData?.id ? 'Update Review' : 'Save Review'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

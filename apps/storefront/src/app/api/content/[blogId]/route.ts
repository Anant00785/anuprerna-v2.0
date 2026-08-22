import { NextResponse } from "next/server";
import { env } from "@/env";

const BASE_URL = env.NEXT_PUBLIC_SPRINGBOOT_API_URL.replace(/\/$/, "");
const DEFAULT_HEADERS = {
  Accept: "application/json",
  Origin: "https://anuprerna.com",
};

const POLICY_FALLBACKS: Record<string, any> = {
  "terms-and-conditions": {
    id: 10771,
    title: "Terms and Conditions",
    description: "Please read these terms and conditions carefully before using our website and services.",
    readingTime: 5,
    blogContentCategory: { name: "Policy", blogContentType: { name: "Terms" } },
    blogContentSectionList: [
      {
        id: 1,
        templateType: 8,
        heading: "1. Acceptance of Terms",
        paragraph1: "By accessing and using Anuprerna's website and purchasing our artisanal sustainable textiles, you agree to be bound by these Terms and Conditions. If you disagree with any part, you may not use our services.",
      },
      {
        id: 2,
        templateType: 8,
        heading: "2. Handcrafted & Natural Imperfections",
        paragraph1: "Our fabrics are genuinely handwoven, hand-spun, and naturally dyed by rural artisans. Slight variations in color, weave texture, and pattern are intrinsic to artisanal handcraft and are not considered defects.",
      },
      {
        id: 3,
        templateType: 8,
        heading: "3. Pricing & International Orders",
        paragraph1: "Prices are subject to change without notice. For international shipments, customs duties and import taxes are the responsibility of the recipient.",
      },
      {
        id: 4,
        templateType: 8,
        heading: "4. Intellectual Property",
        paragraph1: "All craft story content, motifs, imagery, text, and graphics on this platform are the property of Anuprerna and protected by applicable copyright and trademark law.",
      },
    ],
  },
  "privacy-policy": {
    id: 10769,
    title: "Privacy Policy",
    description: "Anuprerna is committed to protecting your privacy and ensuring your personal information is handled safely.",
    readingTime: 4,
    blogContentCategory: { name: "Policy", blogContentType: { name: "Privacy" } },
    blogContentSectionList: [
      {
        id: 1,
        templateType: 8,
        heading: "1. Information We Collect",
        paragraph1: "We collect information you provide directly to us when you create an account, request swatches, place an order, or subscribe to our newsletter (e.g. name, email, shipping address, contact number).",
      },
      {
        id: 2,
        templateType: 8,
        heading: "2. How We Use Your Information",
        paragraph1: "Your information is used strictly to process orders, manage artisan traceability, provide customer support, and send order status updates.",
      },
      {
        id: 3,
        templateType: 8,
        heading: "3. Data Security",
        paragraph1: "We implement industry-standard encryption protocols and secure cloud storage to protect your personal details against unauthorized access.",
      },
    ],
  },
  "return-policy": {
    id: 10770,
    title: "Return & Exchange Policy",
    description: "Our return, exchange, and cancellation policy for handcrafted and bespoke textile orders.",
    readingTime: 3,
    blogContentCategory: { name: "Policy", blogContentType: { name: "Return & Exchange" } },
    blogContentSectionList: [
      {
        id: 1,
        templateType: 8,
        heading: "1. Handcut Fabrics & Swatch Kits",
        paragraph1: "Because fabrics are custom cut from bolts per your specified length, cut lengths and sample swatch kits are generally non-returnable unless defective or damaged in transit.",
      },
      {
        id: 2,
        templateType: 8,
        heading: "2. Damaged or Incorrect Items",
        paragraph1: "If you receive a damaged item or an incorrect shipment, please notify our team at support@anuprerna.com within 7 days of delivery with photos of the package and item.",
      },
      {
        id: 3,
        templateType: 8,
        heading: "3. Refunds & Replacements",
        paragraph1: "Approved returns will be refunded to your original payment method or issued as store credit within 5-7 business days of receipt at our studio.",
      },
    ],
  },
  "shipping-policy": {
    id: 10772,
    title: "Shipping & International Orders",
    description: "Worldwide express shipping policies and delivery timeframes for artisanal textiles.",
    readingTime: 3,
    blogContentCategory: { name: "Policy", blogContentType: { name: "Shipping" } },
    blogContentSectionList: [
      {
        id: 1,
        templateType: 8,
        heading: "1. Domestic & International Shipping",
        paragraph1: "We ship to over 50+ countries worldwide using DHL Express, FedEx, and reliable regional courier partners.",
      },
      {
        id: 2,
        templateType: 8,
        heading: "2. Processing & Dispatch Times",
        paragraph1: "In-stock fabric orders are dispatched within 2-4 business days. Custom woven or naturally dyed production orders follow the agreed project production timeline.",
      },
    ],
  },
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ blogId: string }> }
) {
  const resolvedParams = await params;
  const blogId = resolvedParams.blogId;

  if (!blogId) {
    return NextResponse.json({ success: false, error: "Missing blogId" }, { status: 400 });
  }

  // Check static policy keys first
  const normalizedKey = blogId.toLowerCase().replace(/_/g, "-");
  const fallback =
    POLICY_FALLBACKS[normalizedKey] ||
    (normalizedKey.includes("terms") ? POLICY_FALLBACKS["terms-and-conditions"] : null) ||
    (normalizedKey.includes("privacy") ? POLICY_FALLBACKS["privacy-policy"] : null) ||
    (normalizedKey.includes("return") || normalizedKey.includes("exchange") ? POLICY_FALLBACKS["return-policy"] : null) ||
    (normalizedKey.includes("shipping") || normalizedKey.includes("international") ? POLICY_FALLBACKS["shipping-policy"] : null);

  try {
    const res = await fetch(`${BASE_URL}/get/blog-content/${encodeURIComponent(blogId)}`, {
      headers: DEFAULT_HEADERS,
      next: { revalidate: 300 },
    });

    if (res.ok) {
      const json = await res.json();
      const blogContent = json.blogContent || json.payload || json;
      if (blogContent && (blogContent.title || blogContent.blogTitle || blogContent.name)) {
        return NextResponse.json({
          success: true,
          data: blogContent,
        });
      }
    }

    if (fallback) {
      return NextResponse.json({
        success: true,
        data: fallback,
      });
    }

    return NextResponse.json({ success: false, error: `HTTP ${res.status}` }, { status: res.status });
  } catch (error) {
    if (fallback) {
      return NextResponse.json({
        success: true,
        data: fallback,
      });
    }
    console.error("Content API Route Error:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}

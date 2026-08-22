import { NextResponse } from "next/server";
import { env } from "@/env";

const BASE_URL = (env.NEXT_PUBLIC_API_MODE === "nest" ? env.NEXT_PUBLIC_NEST_API_URL : env.NEXT_PUBLIC_SPRINGBOOT_API_URL).replace(/\/$/, "");
const DEFAULT_HEADERS = {
  Accept: "application/json",
  Origin: "https://anuprerna.com",
};

const FALLBACK_DATA: Record<string, any[]> = {
  fabrics: [
    {
      segmentCategoryName: "PRINTED DESIGN",
      subCategoryName: "DIGITAL PRINT",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/96PZ0GYJBQAU772MWNQ1HMFM2MW904135.jpg",
    },
    {
      segmentCategoryName: "ORGANIC AND NATURAL",
      subCategoryName: "DYEABLE KHADI COTTON",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/TJNUV5A4N7HYHHU46LN0NCED0VO003890.jpg",
    },
    {
      segmentCategoryName: "PRINTED DESIGN",
      subCategoryName: "HAND BLOCK PRINTING",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/AUHJT3UL1UMPOLTHOQDA5D76CA5X07356.jpg",
    },
    {
      segmentCategoryName: "EMBROIDERY TECHNIQUE",
      subCategoryName: "HANDLOOM JACQUARD",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/85PU0XICI28HZN40HDDZWS3H9WAL05809.jpg",
    },
    {
      segmentCategoryName: "PRINTED DESIGN",
      subCategoryName: "HANDPRINTED BATIK",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/3IC401WDVQO2WUMGUG3E4AJ8CQ5S00453.png",
    },
  ],
  accessories: [
    {
      segmentCategoryName: "SCARF",
      subCategoryName: "Custom Stoles",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/O7L4ELP8YKCSPRNBYUH5KUD9I9SP00509.jpg",
    },
    {
      segmentCategoryName: "SCARF",
      subCategoryName: "Neckerchief",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/HMD31252OFCZQ08GK3X0WHDXFONU04019.png",
    },
    {
      segmentCategoryName: "SCARF",
      subCategoryName: "Stoles",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/6FPSW3EI1ZJ8V4K521TUTX5RUG6004222.jpg",
    },
    {
      segmentCategoryName: "BAGS",
      subCategoryName: "Tote Bags",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/JMA1172YLBJ145CR2F7DMHSXCDIY03262.png",
    },
    {
      segmentCategoryName: "BAGS",
      subCategoryName: "Bucket Bags",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/O12DPVP05FQ18GO1Y9PLULJQA4LC03552.jpg",
    },
  ],
  home: [
    {
      segmentCategoryName: "KITCHENWARE",
      subCategoryName: "Table Runner",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/VBMCHG7919BHDT3QO5KVOSUTUR4B09493.jpg",
    },
    {
      segmentCategoryName: "KITCHENWARE",
      subCategoryName: "Apron",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/FPU5QM1S5EYUZUKJSGDCIYN9QFZ000082.png",
    },
    {
      segmentCategoryName: "KITCHENWARE",
      subCategoryName: "Fabric Coasters",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/2B0PYQGE3DWQZMRGL8MWDNY6TJAR08161.jpg",
    },
    {
      segmentCategoryName: "KITCHENWARE",
      subCategoryName: "Table Napkin",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/59XZP290CHDAWH1IPOXAUE380WPU02829.jpg",
    },
    {
      segmentCategoryName: "KITCHENWARE",
      subCategoryName: "Table Placemat",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/78HBAH3D0ZUYH3NGSXBPRNML9LHB06404.jpg",
    },
  ],
  apparel: [
    {
      segmentCategoryName: "WOMEN",
      subCategoryName: "Dresses",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/57R5O8XJ7E2XDF6T257M9HQ92X7M05234.jpg",
    },
    {
      segmentCategoryName: "WOMEN",
      subCategoryName: "Tops & Tunics",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/B9495YF15B06450146P1Z3B56KCP08240.png",
    },
    {
      segmentCategoryName: "MEN",
      subCategoryName: "Shirts",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/N74V7Q28S57Z2V45E1J3L7C2R42F02146.jpg",
    },
    {
      segmentCategoryName: "KIDS",
      subCategoryName: "Kids Wear",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/B10W87DFN22J3Z9CYT4R8P09E83N00389.jpg",
    },
  ],
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  const resolvedParams = await params;
  const category = resolvedParams.category;

  try {
    const res = await fetch(`${BASE_URL}/get/featured/${encodeURIComponent(category)}/sub-category`, {
      headers: DEFAULT_HEADERS,
      next: { revalidate: 300 },
    });

    if (res.ok) {
      const json = await res.json();
      const featuredSubCategories = json.featuredSubCategories || json.featuredSubCategoryList || json.data || [];
      if (Array.isArray(featuredSubCategories) && featuredSubCategories.length > 0) {
        return NextResponse.json({
          success: true,
          data: featuredSubCategories,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: FALLBACK_DATA[category] || [],
    });
  } catch (error) {
    return NextResponse.json({
      success: true,
      data: FALLBACK_DATA[category] || [],
    });
  }
}

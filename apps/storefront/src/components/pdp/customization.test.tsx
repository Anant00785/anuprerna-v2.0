import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductCustomFabricProfile } from "./ProductCustomFabricProfile";
import { ProductFinishProfile } from "./ProductFinishProfile";
import { ProductSizeProfile } from "./ProductSizeProfile";

describe("ProductCustomFabricProfile", () => {
  const mockProduct = {
    madeToOrderFabric: {
      id: 101,
      name: "Default White Linen 120 GSM",
      heroImage: "/images/fab1.jpg",
      sku: "SKU-DEF-101",
      price: 450,
      specialStatus: { name: "Default White" },
    },
    madeToOrderProfile: { minimumOrderQuantity: 1 },
  };

  const mockFabricProfile = {
    id: 1,
    name: "Loom Profile",
    fabricProfileItemList: [
      {
        id: 201,
        fabricPreview: {
          id: 201,
          name: "Indigo Handspun Cotton 140 GSM",
          slug: "indigo-handspun-cotton",
          heroImage: "/images/fab2.jpg",
          sku: "SKU-ALT-201",
          price: 550,
          totalQuantity: 100,
          specialStatus: { name: "Indigo Handspun" },
        },
      },
      {
        id: 202,
        fabricPreview: {
          id: 202,
          name: "Natural Khadi Silk 90 GSM",
          slug: "natural-khadi-silk",
          heroImage: "/images/fab3.jpg",
          sku: "SKU-ALT-202",
          price: 850,
          totalQuantity: 50,
        },
      },
      {
        id: 203,
        fabricPreview: {
          id: 203,
          name: "Madder Red Cotton 130 GSM",
          slug: "madder-red-cotton",
          heroImage: "/images/fab4.jpg",
          sku: "SKU-ALT-203",
          price: 600,
          totalQuantity: 80,
        },
      },
    ],
  };

  it("renders default fabric and viewable fabric cards", () => {
    const onSelect = vi.fn();
    render(
      <ProductCustomFabricProfile
        product={mockProduct}
        fabricProfile={mockFabricProfile}
        selectedFabric={null}
        onSelectFabric={onSelect}
      />
    );

    expect(screen.getByText("Choose Fabric")).toBeDefined();
    expect(screen.getByText("Default White")).toBeDefined();
    expect(screen.getByText("Indigo Handspun")).toBeDefined();
  });

  it("calls onSelectFabric when an alternate fabric is clicked", () => {
    const onSelect = vi.fn();
    render(
      <ProductCustomFabricProfile
        product={mockProduct}
        fabricProfile={mockFabricProfile}
        selectedFabric={null}
        onSelectFabric={onSelect}
      />
    );

    const indigoCard = screen.getByText("Indigo Handspun");
    fireEvent.click(indigoCard);
    expect(onSelect).toHaveBeenCalled();
  });

  it("renders default fabric from product itself when madeToOrderFabric is undefined", () => {
    const fabricProduct = {
      name: "Plain Purple Pure Khadi 142 GSM",
      heroImage: "/purple.jpg",
      sku: "CSD1260083",
      price: 360,
      productGroup: "fabric",
      specialStatus: { name: "Azo Free Dyed Cotton" },
      madeToOrderProfile: { minimumOrderQuantity: 1 },
    };

    render(
      <ProductCustomFabricProfile
        product={fabricProduct}
        fabricProfile={mockFabricProfile}
        selectedFabric={null}
        onSelectFabric={vi.fn()}
      />
    );

    expect(screen.getByText("Choose Fabric")).toBeDefined();
    expect(screen.getByText("Azo Free Dyed Cotton")).toBeDefined();
  });
});

describe("ProductFinishProfile", () => {
  const mockFinishProfile = {
    displayName: "Choose Organic Dye",
    finishProfileItemList: [
      { id: 1, label: "Madder Root", image: "/madder.jpg", price: 150, description: "Natural red plant dye" },
      { id: 2, label: "Indigo Leaf", image: "/indigo.jpg", price: 200, description: "Natural blue fermented dye" },
    ],
  };

  it("renders finish swatches and allows toggling finishes", () => {
    const onChange = vi.fn();
    render(
      <ProductFinishProfile
        finishProfile={mockFinishProfile}
        selectedFinishes={[]}
        onFinishChange={onChange}
      />
    );

    expect(screen.getByText("Choose Organic Dye")).toBeDefined();
    const madderSwatch = screen.getByTitle("Madder Root (+₹150)");
    fireEvent.click(madderSwatch);
    expect(onChange).toHaveBeenCalledWith([mockFinishProfile.finishProfileItemList[0]]);
  });

  it("renders selected finish chips with remove trigger", () => {
    const onChange = vi.fn();
    render(
      <ProductFinishProfile
        finishProfile={mockFinishProfile}
        selectedFinishes={[mockFinishProfile.finishProfileItemList[0]]}
        onFinishChange={onChange}
      />
    );

    const chip = screen.getByText("madder root");
    expect(chip).toBeDefined();
    fireEvent.click(chip);
    expect(onChange).toHaveBeenCalledWith([]);
  });
});

describe("ProductSizeProfile", () => {
  const mockProduct = {
    productGroup: "finished",
    customSizeProfileEnabled: true,
    customSizeProfile: {
      id: 5,
      price: 250,
      disclaimer: "Custom size requires 5 extra production days.",
      customSizeProfileItemList: [
        { label: "Length (cm)", placeholder: "e.g. 100", mandatory: true, fieldType: 1 },
        { label: "Width (cm)", placeholder: "e.g. 45", mandatory: true, fieldType: 1 },
      ],
    },
  };

  const mockSizeProfile = {
    displayName: "Select Stole Size",
    sizeProfileOptionList: [
      { id: 1, label: "50x180 cm", keyFeature: "Standard Scarf", sortOrder: 1 },
      { id: 2, label: "70x200 cm", keyFeature: "Full Stole", sortOrder: 2 },
    ],
  };

  const mockProductSizeList = [
    { id: 1, quantity: 10, sizeProfileOption: { id: 1, label: "50x180 cm", keyFeature: "Standard Scarf", sortOrder: 1 } },
    { id: 2, quantity: 5, sizeProfileOption: { id: 2, label: "70x200 cm", keyFeature: "Full Stole", sortOrder: 2 } },
  ];

  it("renders standard size buttons and selects size on click", () => {
    const onSelect = vi.fn();
    const onCustom = vi.fn();
    render(
      <ProductSizeProfile
        product={mockProduct}
        sizeProfile={mockSizeProfile}
        productSizeProfileList={mockProductSizeList}
        selectedSize={mockSizeProfile.sizeProfileOptionList[0]}
        onSizeSelect={onSelect}
        customSizeSubmittedData={null}
        onCustomSizeSubmit={onCustom}
      />
    );

    expect(screen.getByText("Select Stole Size")).toBeDefined();
    expect(screen.getByText("50x180 cm")).toBeDefined();
    expect(screen.getByText("70x200 cm")).toBeDefined();

    fireEvent.click(screen.getByText("70x200 cm"));
    expect(onSelect).toHaveBeenCalledWith(mockSizeProfile.sizeProfileOptionList[1]);
  });

  it("expands custom size form when Custom Size is clicked", () => {
    const onSelect = vi.fn();
    const onCustom = vi.fn();
    render(
      <ProductSizeProfile
        product={mockProduct}
        sizeProfile={mockSizeProfile}
        productSizeProfileList={mockProductSizeList}
        selectedSize={mockSizeProfile.sizeProfileOptionList[0]}
        onSizeSelect={onSelect}
        customSizeSubmittedData={null}
        onCustomSizeSubmit={onCustom}
      />
    );

    const customBtn = screen.getByText("Custom Size");
    fireEvent.click(customBtn);

    expect(screen.getByText("Length (cm)")).toBeDefined();
    expect(screen.getByText("Width (cm)")).toBeDefined();
    expect(screen.getByText("Apply Custom Size")).toBeDefined();
  });
});

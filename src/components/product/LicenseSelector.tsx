import { PriceOptionsProps } from "@/hooks/usePriceCalculator";
import { CartSelectedItem, CartUpdates, LicenseOption } from "@/types";
import React from "react";

export default function LicenseSelector({
  onSelect,
  selected,
  licenses,
    updateCart,
  inCart,
  calculatePrice,
}: {
  onSelect: (licence: LicenseOption) => void;
  selected: LicenseOption;
  licenses: LicenseOption[];
    updateCart: (updates: CartUpdates) => void;
    inCart: CartSelectedItem | null;
 calculatePrice: (
     type: "Digital" | "Print",
    eraser?: "material" | "frame" | "size" | "license" | "" ,
    newMultiplier?: number
  ) => PriceOptionsProps;
}) {
  //   const [selected, setSelected] = useState("personal");

  //   const handleSelect = (type: string) => {
  //     setSelected(type);
  //     onSelect(type);
  //   };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Choose License</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {licenses.map((license) => (
          <div
            key={license.type}
            className={`rounded-xl border-2 p-4 cursor-pointer transition-all duration-200
              ${
                selected.type === license.type
                  ? "border-black shadow-md bg-gray-50"
                  : "border-gray-200 hover:border-gray-400"
              }
            `}
            onClick={() => {
              onSelect(license);
                if (inCart)
                    updateCart({
                      license: license.type,
                      price:
                        String(
                          Number(
                            calculatePrice("Print")
                              .printPrice
                          ) + Number(calculatePrice("Digital", "license", license.price).digitalPrice)
                        ) ?? 0,
                    });
            }} // ✅ Pass the clicked license
          >
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-gray-900">
                {license.name}
              </h4>
              <span className="text-sm font-semibold text-gray-600">
                {license.type === "personal" ? "FREE" : license.price}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">{license.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

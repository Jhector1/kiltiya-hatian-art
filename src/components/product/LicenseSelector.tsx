import { LicenseOption } from "@/types";
import React from "react";

const licenses = [
  {
    type: "personal",
    name: "Personal Use",
    price: 0,
    description: "For personal projects and non-commercial use.",
  },
  {
    type: "commercial",
    name: "Commercial Use",
    price: 50,
    description: "For business use: websites, client work, etc.",
  },
  {
    type: "extended",
    name: "Extended License",
    price: 200,
    description: "For resale or merchandise with unlimited copies.",
  },
];

export default function LicenseSelector({ onSelect, selected }: { onSelect: (licence: LicenseOption) => void , selected: LicenseOption}) {
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
              ${selected.type === license.type ? "border-black shadow-md bg-gray-50" : "border-gray-200 hover:border-gray-400"}
            `}
            onClick={() => onSelect(license)} // ✅ Pass the clicked license
          >
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-gray-900">{license.name}</h4>
              <span className="text-sm font-semibold text-gray-600">{license.type==='personal'? 'FREE': license.price}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">{license.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

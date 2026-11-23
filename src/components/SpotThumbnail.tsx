import { Coffee, Receipt, PiggyBank, ShoppingBag, Utensils } from "lucide-react";
import { useState } from "react";

export const SPOT_IMAGES = {
  ledger: "/src/assets/images/ledger_finance_illustration_1795412760257.jpg",
  coffee: "/src/assets/images/spot_coffee_snack_1795413229526.jpg",
  dining: "/src/assets/images/spot_delivery_dining_1795413229580.jpg",
  savings: "/src/assets/images/spot_savings_jar_1795413229386.jpg",
  shopping: "/src/assets/images/spot_shopping_receipt_1795413229396.jpg",
} as const;

export function getImageForCategory(category: string): { src: string; alt: string } {
  if (category.includes("카페") || category.includes("간식")) {
    return { src: SPOT_IMAGES.coffee, alt: "카페 및 간식 지출 이미지" };
  }
  if (category.includes("배달") || category.includes("외식") || category.includes("식비")) {
    return { src: SPOT_IMAGES.dining, alt: "식비 및 배달 외식 지출 이미지" };
  }
  if (category.includes("쇼핑") || category.includes("의류") || category.includes("마트") || category.includes("문화")) {
    return { src: SPOT_IMAGES.shopping, alt: "쇼핑 및 생활 소비 이미지" };
  }
  if (category.includes("절약") || category.includes("예산")) {
    return { src: SPOT_IMAGES.savings, alt: "목표 예산 및 저축 저금통 이미지" };
  }
  return { src: SPOT_IMAGES.ledger, alt: "가계부 지출 관리 이미지" };
}

interface SpotThumbnailProps {
  category: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SpotThumbnail({ category, size = "md", className = "" }: SpotThumbnailProps) {
  const [failed, setFailed] = useState(false);
  const { src, alt } = getImageForCategory(category);

  const sizeClass =
    size === "sm"
      ? "w-8 h-8 rounded-md"
      : size === "lg"
      ? "w-14 h-14 sm:w-16 sm:h-16 rounded-xl"
      : "w-10 h-10 rounded-lg";

  const renderFallbackIcon = () => {
    if (category.includes("카페")) return <Coffee className="w-4 h-4 text-amber-700" />;
    if (category.includes("배달") || category.includes("식비")) return <Utensils className="w-4 h-4 text-rose-700" />;
    if (category.includes("쇼핑") || category.includes("마트")) return <ShoppingBag className="w-4 h-4 text-indigo-700" />;
    if (category.includes("절약") || category.includes("예산")) return <PiggyBank className="w-4 h-4 text-emerald-700" />;
    return <Receipt className="w-4 h-4 text-slate-600" />;
  };

  if (failed) {
    return (
      <div
        className={`${sizeClass} shrink-0 bg-slate-100 border border-slate-200 flex items-center justify-center ${className}`}
        aria-label={alt}
      >
        {renderFallbackIcon()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${sizeClass} shrink-0 object-cover border border-slate-200/80 bg-slate-100 ${className}`}
    />
  );
}

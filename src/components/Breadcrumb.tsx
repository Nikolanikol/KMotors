import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Props {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: Props) {
  return (
    <nav aria-label="breadcrumb" className="flex items-center flex-wrap gap-1 text-sm text-white/80">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-white/50" />}
            {isLast || !item.href ? (
              <span className={isLast ? "text-white font-semibold" : "text-white/80"}>
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-white/80 hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  segments: {
    name: string;
    href?: string;
  }[];
}

export function Breadcrumb({ segments, className, ...props }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center text-sm text-muted-foreground", className)}
      {...props}
    >
      <ol className="flex items-center gap-1.5">
        {segments.map((segment, index) => (
          <li key={segment.name} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            )}
            {segment.href && index < segments.length - 1 ? (
              <Link
                href={segment.href}
                className="flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                {index === 0 && <Home className="h-3.5 w-3.5" />}
                {segment.name}
              </Link>
            ) : (
              <span
                className={cn(
                  "font-medium",
                  index === segments.length - 1
                    ? "text-foreground"
                    : ""
                )}
              >
                {index === 0 && index !== segments.length - 1 && (
                  <Home className="mr-1.5 inline h-3.5 w-3.5" />
                )}
                {segment.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

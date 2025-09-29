import { Skeleton } from "./skeleton";
import { cn } from "../../lib/utils";

interface SkeletonCardProps {
  className?: string;
  wrapperClassName?: string;
  height?: string;
  width?: string;
  rounded?: string;
  children?: React.ReactNode;
  /**
   * Whether to show decorative elements like the circles
   */
  showDecorations?: boolean;
}

/**
 * Base card skeleton that can be customized for different card types
 */
export function SkeletonCard({
  className,
  wrapperClassName,
  height = "h-40",
  width = "w-full",
  rounded = "rounded-3xl",
  children,
  showDecorations = false,
}: SkeletonCardProps) {
  return (
    <div className={cn(
      height,
      width,
      rounded,
      "relative overflow-hidden bg-card border border-border", 
      wrapperClassName
    )}>
      {showDecorations && (
        <>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-foreground/5 translate-x-[30%] -translate-y-[30%]"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-foreground/5 -translate-x-[30%] translate-y-[30%]"></div>
        </>
      )}
      <div className={cn("p-6", className)}>
        {children}
      </div>
    </div>
  );
}

/**
 * Skeleton for the balance card with customizable properties
 */
export function BalanceSkeleton({ 
  className,
  backgroundClassName = "bg-primary",
  showAPY = true,
  showViewDetails = true,
}: {
  className?: string;
  backgroundClassName?: string;
  showAPY?: boolean;
  showViewDetails?: boolean;
}) {
  return (
    <SkeletonCard 
      wrapperClassName={cn("bg-primary", backgroundClassName)}
      showDecorations={true}
      className={className}
    >
      <h2 className="text-sm font-medium mb-2 relative z-10 text-white/90">
        Total balance
      </h2>
      
      {/* Skeleton for the balance amount */}
      <div className="mb-4 relative z-10">
        <Skeleton className="h-9 w-40 bg-white/20" />
      </div>
      
      <div className="flex justify-between items-center relative z-10">
        {showAPY && <Skeleton className="h-6 w-24 rounded-full bg-white/20" />}
        {showViewDetails && <Skeleton className="h-6 w-28 bg-white/20" />}
      </div>
    </SkeletonCard>
  );
}

/**
 * Skeleton for transaction items with customizable properties
 */
export function TransactionsSkeleton({ 
  count = 3,
  className,
  itemClassName,
}: { 
  count?: number;
  className?: string;
  itemClassName?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn(
          "bg-card border border-border rounded-xl p-4 flex justify-between items-center",
          itemClassName
        )}>
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-4 w-16 ml-auto" />
            <Skeleton className="h-3 w-12 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for the empty state with customizable properties
 */
export function EmptyStateSkeleton({
  className,
  iconSize = "h-10 w-10",
  titleWidth = "w-40",
  descriptionWidth = "w-56",
}: {
  className?: string;
  iconSize?: string;
  titleWidth?: string;
  descriptionWidth?: string;
}) {
  return (
    <div className={cn("text-center bg-card border border-border rounded-xl p-8", className)}>
      <Skeleton className={cn("mx-auto rounded-full mb-3", iconSize)} />
      <Skeleton className={cn("mx-auto h-5 mb-1", titleWidth)} />
      <Skeleton className={cn("mx-auto h-4", descriptionWidth)} />
    </div>
  );
}

/**
 * Skeleton for a card in the Learn & Discover section with customizable properties
 */
export function LearnCardSkeleton({ 
  count = 3,
  className,
  cardClassName,
  width = "w-[280px] sm:w-[300px]",
}: { 
  count?: number;
  className?: string;
  cardClassName?: string;
  width?: string;
}) {
  return (
    <div className={cn("flex overflow-x-auto space-x-4 pb-4 -mx-6 px-6 scrollbar-hide", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex-shrink-0 bg-card border border-border rounded-xl p-5 flex flex-col",
            width,
            cardClassName
          )}
        >
          <Skeleton className="w-12 h-12 rounded-full mb-4" />
          <Skeleton className="h-6 w-40 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-5" />
          <Skeleton className="h-4 w-24 self-start" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for the CTA card with customizable properties
 */
export function CTASkeleton({
  className,
  iconSize = "w-10 h-10",
  hasArrow = true,
}: {
  className?: string;
  iconSize?: string;
  hasArrow?: boolean;
}) {
  return (
    <div className={cn("p-5 bg-background border border-border rounded-xl", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className={cn("rounded-full", iconSize)} />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        {hasArrow && <Skeleton className="w-9 h-9 rounded-full" />}
      </div>
    </div>
  );
} 
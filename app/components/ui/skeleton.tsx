import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string;
  /**
   * The number of skeleton items to render (for arrays)
   */
  count?: number;
  /**
   * Whether to show the shine animation
   */
  animate?: boolean;
}

const Skeleton = ({
  className,
  count = 1,
  animate = true,
}: SkeletonProps) => {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <>
      {items.map((i) => (
        <div
          key={i}
          className={cn(
            "bg-gray-200 rounded-md relative overflow-hidden",
            animate && "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent",
            className
          )}
          aria-hidden="true"
        />
      ))}
    </>
  );
};

export { Skeleton }

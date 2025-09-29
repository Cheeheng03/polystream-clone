import React from "react";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface TaskCardProps {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  pointsEarned: number;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  id,
  title,
  description,
  imageUrl,
  pointsEarned,
}) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/rewards/${id}`);
  };

  return (
    <div
      className="flex flex-col bg-white border border-gray-200 rounded-3xl shadow-sm p-0 overflow-hidden min-w-[260px] w-full card-tap-effect cursor-pointer"
      onClick={handleClick}
    >
      <div className="w-full h-32 flex items-center justify-center">
        <Image
          src={imageUrl || "https://via.placeholder.com/120x60?text=Image"}
          alt="Task"
          width={120}
          height={120}
          className="object-contain"
        />
      </div>
      <div className="flex flex-col flex-1 px-4 pt-3">
        <div className="flex flex-col py-3">
          <div className="flex items-center gap-2 mb-1 justify-between">
            <div className="flex flex-col gap-2 w-[70%]">
              <h3 className="font-semibold text-lg text-foreground leading-tight">
                {title}
              </h3>
              <span className="text-xs font-normal text-primary">
                {description}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs font-normal text-muted-foreground">
                Points earned
              </span>
              <span className="text-lg font-semibold text-primary">
                {Number(pointsEarned) < 0.01
                  ? "0"
                  : Number(pointsEarned).toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex mt-2 items-center gap-1 justify-start text-sm font-normal text-muted-foreground">
            <span>Details</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

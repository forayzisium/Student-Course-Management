type ReportProgressCardProps = {
  title: string;
  value: number;
  description: string;
};

export default function ReportProgressCard({
  title,
  value,
  description,
}: ReportProgressCardProps) {
  const progress = Math.min(100, Math.max(0, value));

  return (
    <div className="min-w-0 rounded-xl bg-white p-4 shadow-sm sm:p-6">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words font-semibold text-[#333333]">{title}</h3>

          <p className="mt-1 break-words text-sm text-gray-500">
            {description}
          </p>
        </div>

        <span className="shrink-0 text-xl font-bold text-[#B45A2A]">
          {progress}%
        </span>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-[#B45A2A] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

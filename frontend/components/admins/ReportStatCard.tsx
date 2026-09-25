type ReportStatCardProps = {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
};

export default function ReportStatCard({
  title,
  value,
  description,
  icon,
}: ReportStatCardProps) {
  return (
    <div className="min-w-0 rounded-xl bg-white p-5 shadow-sm">
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="break-words text-sm text-gray-500">{title}</p>

          <h2 className="mt-2 break-words text-2xl font-bold text-[#333333]">
            {value}
          </h2>

          <p className="mt-1 break-words text-xs text-gray-500">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#111827] text-white">
          {icon}
        </div>
      </div>
    </div>
  );
}

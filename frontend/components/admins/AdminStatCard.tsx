type AdminStatCardProps = {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
};

export default function AdminStatCard({
  title,
  value,
  description,
  icon,
}: AdminStatCardProps) {
  return (
    <div className="min-w-0 rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm text-slate-400">{title}</p>

          <p className="mt-2 break-words text-3xl font-bold text-slate-800">
            {value}
          </p>

          <p className="mt-2 break-words text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
          {icon}
        </div>
      </div>
    </div>
  );
}

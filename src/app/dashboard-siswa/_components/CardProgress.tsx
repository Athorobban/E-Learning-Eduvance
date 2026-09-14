"use client";

type ProgressProps = {
  label: string;
  done: number;
  total: number;
  color: string;
};

export default function CardProgress({ label, done, total, color }: ProgressProps) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <div className="flex justify-between mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-sm text-gray-500">
          {done}/{total} ({percent}%)
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-4">
        <div className={`${color} h-4 rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

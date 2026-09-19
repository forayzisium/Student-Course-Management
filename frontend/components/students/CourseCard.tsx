import Link from "next/link";
import Button from "../Button";

type CourseCardProps = {
  id: number;
  code: string;
  title: string;
  instructor: string;
  progress: number;
};

export default function CourseCard({
  id,
  code,
  title,
  instructor,
  progress,
}: CourseCardProps) {
  const progressValue = Math.min(100, Math.max(0, progress));

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md font-inter">
      <p className="text-sm font-medium text-gray-500">{code}</p>

      <h3 className="mt-1 text-lg font-semibold text-gray-900">{title}</h3>

      <p className="mt-1 text-sm text-gray-600">{instructor}</p>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-gray-600">Assignments submitted</span>

        <span className="font-medium text-gray-900">{progressValue}%</span>
      </div>

      <Link href={`/student/courses/${id}`}>
        <Button className="mt-5 w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition">
          Continue Course
        </Button>
      </Link>
    </div>
  );
}

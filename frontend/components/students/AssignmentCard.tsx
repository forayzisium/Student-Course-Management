import Link from "next/link";
import Button from "../Button";

type AssignmentCardProps = {
  course: string;
  title: string;
  dueDate: string;
  status: string;
};

export default function AssignmentCard({
  course,
  title,
  dueDate,
  status,
}: AssignmentCardProps) {
  const getStatusStyle = () => {
    switch (status.toLowerCase()) {
      case "submitted":
        return "bg-green-100 text-green-700";

      case "pending":
        return "bg-yellow-100 text-yellow-700";

      case "overdue":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md font-inter">
      <p className="text-sm font-medium text-gray-500">{course}</p>

      <h3 className="mt-1 text-lg font-semibold text-gray-900">{title}</h3>

      <p className="mt-3 text-sm text-gray-600">Due: {dueDate}</p>

      <div className="mt-3">
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium  ${getStatusStyle()}`}
        >
          {status}
        </span>
      </div>

      <Link href="/student/assignments">
        <Button className="mt-5 w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
          View Assignment
        </Button>
      </Link>
    </div>
  );
}

import React from 'react';
import Button from '../Button';

export interface Assignment {
  id?: string;
  course?: string;
  courseCode?: string;
  title?: string;
  dueDate?: string;
  status?: string;
  points?: string;
}

interface AssignmentCardProps {
  assignment?: Assignment;
  course?: string;
  courseCode?: string;
  title?: string;
  dueDate?: string;
  status?: string;
  points?: string;
  onToggleStatus?: (id: string) => void;
}

export default function AssignmentCard({
  assignment,
  course: directCourse,
  courseCode: directCourseCode,
  title: directTitle,
  dueDate: directDueDate,
  status: directStatus,
  points: directPoints,
  onToggleStatus,
}: AssignmentCardProps) {
  const courseCode = directCourse || directCourseCode || assignment?.course || assignment?.courseCode || 'Course';
  const title = directTitle || assignment?.title || '';
  const dueDate = directDueDate || assignment?.dueDate || '';
  const status = directStatus || assignment?.status || 'Pending';
  const points = directPoints || assignment?.points;

  const isSubmitted = status.toLowerCase() === 'submitted';

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E9E4D9] shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between space-y-3 min-w-0">
      {/* Top Badge & Status Row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold px-2.5 py-1 rounded bg-stone-100 text-stone-700 truncate max-w-[65%]">
          {courseCode}
        </span>
        <span
          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${
            isSubmitted
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {status}
        </span>
      </div>

      {/* Assignment Title */}
      <div>
        <h4 className="font-bold text-[#231F1D] text-sm sm:text-base leading-snug line-clamp-2">
          {title}
        </h4>
      </div>

      {/* Footer Info Row */}
      <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
        <span>Due: <strong className="text-stone-700 font-semibold">{dueDate}</strong></span>
        {points && <span className="font-medium text-stone-600">{points}</span>}
        {onToggleStatus && assignment?.id && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleStatus(assignment.id!)}
            className="text-[11px] py-1 px-2.5"
          >
            {isSubmitted ? 'Undo' : 'Submit'}
          </Button>
        )}
      </div>
    </div>
  );
}

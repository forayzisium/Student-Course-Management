import React from 'react';
import Button from '../Button';

export interface Course {
  id?: string;
  code?: string;
  title?: string;
  instructor?: string;
  progress?: number;
}

interface CourseCardProps {
  course?: Course;
  code?: string;
  title?: string;
  instructor?: string;
  progress?: number;
  actionText?: string;
  onSelect?: (course: Course) => void;
}

export default function CourseCard({
  course,
  code: directCode,
  title: directTitle,
  instructor: directInstructor,
  progress: directProgress,
  actionText = 'Continue Course',
  onSelect,
}: CourseCardProps) {
  const code = directCode || course?.code || '';
  const title = directTitle || course?.title || '';
  const instructor = directInstructor || course?.instructor || '';
  const progress = directProgress ?? course?.progress ?? 0;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E9E4D9] shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between space-y-5 min-w-0">
      <div className="space-y-1">
        <span className="text-xs font-semibold text-stone-500 tracking-wide block truncate">
          {code}
        </span>
        <h3 className="font-sans text-lg sm:text-xl font-bold text-[#231F1D] leading-tight">
          {title}
        </h3>
        <p className="text-xs text-stone-500 font-medium pt-0.5 truncate">
          {instructor}
        </p>
      </div>

      <div className="space-y-4 pt-1">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-stone-500">
            <span>Progress</span>
            <span className="font-bold text-[#231F1D]">{progress}%</span>
          </div>
          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#B85328] h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onSelect && onSelect(course || { code, title, instructor, progress })}
          >
            {actionText}
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

export default function MaintenancePage({
  pageName = "This Page",
}: {
  pageName?: string;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#EAE6DC]">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#B45A2B]/10 text-[#B45A2B]">
          <svg
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9V5l3 3M9 14a3 3 0 106 0 3 3 0 01-6 0z"
            />
          </svg>
        </div>

        <h1 className="mt-6 font-serif text-3xl font-bold text-[#333333]">
          {pageName} is under maintenance
        </h1>

        <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">
          We&apos;re working hard to bring you this feature soon. Please check
          back later or explore other parts of the platform.
        </p>
      </div>
    </div>
  );
}

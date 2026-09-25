export type EnrollmentResponse<Course> = {
  success: boolean;
  enrollments: { status: string; course: Course }[];
};

export function getEnrolledCourses<Course>(
  response: EnrollmentResponse<Course>,
): Course[] {
  if (!response.success || !Array.isArray(response.enrollments)) {
    throw new Error("Invalid enrollment response");
  }
  // Enrollment status controls membership; course status controls availability.
  return response.enrollments
    .filter((enrollment) => enrollment.status === "ACTIVE")
    .map((enrollment) => enrollment.course);
}

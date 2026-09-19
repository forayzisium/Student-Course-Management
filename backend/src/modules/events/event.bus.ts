import { EventEmitter } from "events";

export type RealtimeEventType =
  | "GRADE_UPDATED"
  | "ASSIGNMENT_CREATED"
  | "ASSIGNMENT_GRADED"
  | "ATTENDANCE_RECORDED"
  | "PAYMENT_UPDATED"
  | "COURSE_CATALOG_UPDATED"
  | "ENROLLMENT_UPDATED"
  | "PROFILE_UPDATED";

export interface RealtimeEventPayload {
  type: RealtimeEventType;
  studentId?: number;
  userId?: number;
  courseId?: number;
  data?: Record<string, unknown>;
  timestamp: string;
}

class RealtimeEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }

  emitEvent(payload: Omit<RealtimeEventPayload, "timestamp">) {
    const fullPayload: RealtimeEventPayload = {
      ...payload,
      timestamp: new Date().toISOString(),
    };
    this.emit("realtime-event", fullPayload);
  }

  emitToStudent(
    studentId: number,
    type: RealtimeEventType,
    data?: Record<string, unknown>,
  ) {
    this.emitEvent({
      type,
      studentId,
      data,
    });
  }

  emitToUser(
    userId: number,
    type: RealtimeEventType,
    data?: Record<string, unknown>,
  ) {
    this.emitEvent({
      type,
      userId,
      data,
    });
  }

  emitBroadcast(type: RealtimeEventType, data?: Record<string, unknown>) {
    this.emitEvent({
      type,
      data,
    });
  }
}

export const realtimeEventBus = new RealtimeEventBus();

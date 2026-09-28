export type DemoAttendanceState = "not-timed-in" | "timed-in" | "completed";

export type QrScanFeedbackState =
  | {
      type: "time-in" | "time-out";
      time: string;
    }
  | {
      type: "completed";
    };

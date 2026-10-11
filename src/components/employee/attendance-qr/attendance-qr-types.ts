export type QrScanFeedbackState =
  | {
      type: "time-in" | "time-out";
      time: string;
    }
  | {
      type: "already-recorded";
      timeIn: string;
      timeOut: string;
    };

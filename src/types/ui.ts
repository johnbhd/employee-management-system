export type StatusTone = "success" | "warning" | "danger" | "info" | "muted";

export type IconName =
  | "dashboard"
  | "monitoring"
  | "hrps"
  | "bundy"
  | "qr"
  | "unified"
  | "payroll"
  | "accounting"
  | "errors"
  | "users"
  | "roles"
  | "audit"
  | "settings"
  | "menu"
  | "search"
  | "bell"
  | "help"
  | "user"
  | "chevron"
  | "logout"
  | "close"
  | "calendar"
  | "check"
  | "clock"
  | "warning"
  | "info"
  | "refresh"
  | "download"
  | "arrow"
  | "filter"
  | "lock"
  | "key"
  | "support"
  | "sun"
  | "hand"
  | "file"
  | "layers"
  | "shield"
  | "activity"
  | "building"
  | "phone"
  | "location"
  | "comment";

export type NavigationItem = {
  id: string;
  label: string;
  href?: string;
  icon: IconName;
};

export type Metric = {
  label: string;
  value: string;
  note: string;
  icon: IconName;
  tone: StatusTone;
};

import Link from "next/link";

import { Icon } from "@/components/ui/Icon";

const quickActions = [
  {
    icon: "qr" as const,
    title: "Show QR",
    description: "Show your attendance QR code",
    href: "/employee/attendance-qr",
  },
  {
    icon: "clock" as const,
    title: "View History",
    description: "Review your past attendance records",
    href: "/employee/attendance-history",
  },
];

export function MyAttendanceQuickActions() {
  return (
    <div className="my-attendance-action-list">
      {quickActions.map((action) => (
        <Link
          className={`my-attendance-action ${action.title === "Show QR" ? "is-primary" : ""}`}
          href={action.href}
          key={action.title}
        >
          <Icon name={action.icon} />
          <span>
            <strong>{action.title}</strong>
            <small>{action.description}</small>
          </span>
        </Link>
      ))}
    </div>
  );
}

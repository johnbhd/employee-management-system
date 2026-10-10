import { Icon } from "@/components/ui/Icon";
import type { EmployeeReference } from "@/types/employee";
import type { IconName, StatusTone } from "@/types/ui";

type EmployeeDirectorySummaryProps = {
    employees: readonly EmployeeReference[];
};

type SummaryMetric = {
    label: string;
    value: number;
    icon: IconName;
    tone: StatusTone;
};

export function EmployeeDirectorySummary({ employees }: EmployeeDirectorySummaryProps) {
    const metrics: SummaryMetric[] = [
        {
            label: "Total employees",
            value: employees.length,
            icon: "users",
            tone: "info",
        },
        {
            label: "Active employees",
            value: employees.filter((employee) => employee.employmentStatus === "active").length,
            icon: "check",
            tone: "success",
        },
        {
            label: "Inactive employees",
            value: employees.filter((employee) => employee.employmentStatus === "inactive").length,
            icon: "users",
            tone: "muted",
        },
        {
            label: "Departments",
            value: new Set(employees.map((employee) => employee.department)).size,
            icon: "building",
            tone: "info",
        },
    ];

    return (
        <section className="hr-directory-summary" aria-label="Employee directory summary">
            {metrics.map((metric) => (
                <article className={"hr-directory-summary-card hr-directory-summary-card-" + metric.tone} key={metric.label}>
                    <div className="hr-directory-summary-icon" aria-hidden="true">
                        <Icon name={metric.icon} />
                    </div>
                    <div className="hr-directory-summary-copy">
                        <span>{metric.label}</span>
                        <strong>{metric.value}</strong>
                    </div>
                </article>
            ))}
        </section>
    );
}

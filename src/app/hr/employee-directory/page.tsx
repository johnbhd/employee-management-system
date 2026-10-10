import { EmployeeDirectoryPage } from "@/components/hr/employee-directory/EmployeeDirectoryPage";
import {
    getEmployeeDirectoryData,
} from "@/server/hr/employee-directory.service";
import type { EmployeeReference } from "@/types/employee";

export default async function Page() {
    let employees: EmployeeReference[] = [];
    let loadError = false;

    try {
        ({ employees } = await getEmployeeDirectoryData());
    } catch {
        loadError = true;
    }

    return (
        <EmployeeDirectoryPage
            employees={employees}
            loadError={loadError}
        />
    );
}

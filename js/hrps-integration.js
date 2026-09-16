import { initializeAdminLayout } from './admin-layout.js';

const { announce } = initializeAdminLayout({
    activePage: 'hrps-integration',
    navbar: {
        title: 'HRPS Integration',
        subtitle: 'Employee master-data synchronization'
    }
});

const syncNowButton = document.getElementById('sync-now');

if (syncNowButton) {
    const syncLabel = syncNowButton.querySelector('[data-sync-label]');
    let resetSyncFeedback;

    syncNowButton.addEventListener('click', () => {
        const checkedAt = new Intl.DateTimeFormat('en', {
            hour: 'numeric',
            minute: '2-digit'
        }).format(new Date());

        syncNowButton.classList.add('is-refreshed');

        if (syncLabel) {
            syncLabel.textContent = 'Status Refreshed';
        }

        announce('Prototype HRPS synchronization status refreshed at ' + checkedAt + '. No external request was sent.');
        window.clearTimeout(resetSyncFeedback);
        resetSyncFeedback = window.setTimeout(() => {
            syncNowButton.classList.remove('is-refreshed');

            if (syncLabel) {
                syncLabel.textContent = 'Sync Now';
            }
        }, 1800);
    });
}

const employeeSearch = document.getElementById('employee-record-search');
const departmentFilter = document.getElementById('department-filter');
const employmentFilter = document.getElementById('employment-filter');
const syncResultFilter = document.getElementById('sync-result-filter');
const employeeRows = document.querySelectorAll('[data-employee-record]');

function updateEmployeeRecordFilters() {
    const searchTerm = employeeSearch ? employeeSearch.value.trim().toLowerCase() : '';
    const department = departmentFilter ? departmentFilter.value : 'all';
    const employment = employmentFilter ? employmentFilter.value : 'all';
    const syncResult = syncResultFilter ? syncResultFilter.value : 'all';
    let visibleCount = 0;

    employeeRows.forEach((row) => {
        const matchesSearch = !searchTerm || row.textContent.toLowerCase().includes(searchTerm);
        const matchesDepartment = department === 'all' || row.getAttribute('data-department') === department;
        const matchesEmployment = employment === 'all' || row.getAttribute('data-employment') === employment;
        const matchesSyncResult = syncResult === 'all' || row.getAttribute('data-sync-result') === syncResult;
        const isVisible = matchesSearch && matchesDepartment && matchesEmployment && matchesSyncResult;

        row.classList.toggle('hidden', !isVisible);

        if (isVisible) {
            visibleCount += 1;
        }
    });

    announce('Showing ' + visibleCount + ' mock synchronized employee record' + (visibleCount === 1 ? '' : 's') + '.');
}

if (employeeSearch) {
    employeeSearch.addEventListener('input', updateEmployeeRecordFilters);
}

[departmentFilter, employmentFilter, syncResultFilter].forEach((filter) => {
    if (filter) {
        filter.addEventListener('change', updateEmployeeRecordFilters);
    }
});

import { initializeAdminLayout } from './admin-layout.js';
const { announce } = initializeAdminLayout({
    activePage: 'bundy-biometric-etl',
    navbar: {
        title: 'Bundy / Biometric ETL',
        subtitle: 'Attendance log ingestion and processing'
    }
});

const runImportButton = document.getElementById('run-import');

if (runImportButton) {
    const importLabel = runImportButton.querySelector('[data-import-label]');
    let resetImportFeedback;

    runImportButton.addEventListener('click', () => {
        runImportButton.disabled = true;
        runImportButton.classList.add('is-refreshed');

        if (importLabel) {
            importLabel.textContent = 'Simulated Import';
        }

        announce('Simulated import requested. No physical Bundy device was contacted and no records were loaded.');

        window.clearTimeout(resetImportFeedback);
        resetImportFeedback = window.setTimeout(() => {
            runImportButton.disabled = false;
            runImportButton.classList.remove('is-refreshed');

            if (importLabel) {
                importLabel.textContent = 'Run Import';
            }

            announce('Prototype ETL status remains unchanged; no device communication was attempted.');
        }, 1800);
    });
}

const filterForm = document.getElementById('attendance-log-filters');
const employeeSearch = document.getElementById('attendance-log-search');
const dateFilter = document.getElementById('attendance-log-date');
const deviceFilter = document.getElementById('device-filter');
const matchStatusFilter = document.getElementById('match-status-filter');
const processingStatusFilter = document.getElementById('processing-status-filter');
const logRows = Array.from(document.querySelectorAll('[data-log-row]'));
const emptyState = document.querySelector('[data-log-empty]');
const logCount = document.querySelector('[data-log-count]');

function updateAttendanceLogFilters() {
    const searchTerm = employeeSearch ? employeeSearch.value.trim().toLowerCase() : '';
    const date = dateFilter ? dateFilter.value : '';
    const device = deviceFilter ? deviceFilter.value : 'all';
    const matchStatus = matchStatusFilter ? matchStatusFilter.value : 'all';
    const processingStatus = processingStatusFilter ? processingStatusFilter.value : 'all';
    let visibleCount = 0;

    logRows.forEach((row) => {
        const matchesSearch = !searchTerm || row.textContent.toLowerCase().includes(searchTerm);
        const matchesDate = !date || row.getAttribute('data-date') === date;
        const matchesDevice = device === 'all' || row.getAttribute('data-device') === device;
        const matchesMatchStatus = matchStatus === 'all' || row.getAttribute('data-match-status') === matchStatus;
        const matchesProcessingStatus = processingStatus === 'all' || row.getAttribute('data-processing-status') === processingStatus;
        const isVisible = matchesSearch && matchesDate && matchesDevice && matchesMatchStatus && matchesProcessingStatus;

        row.classList.toggle('hidden', !isVisible);

        if (isVisible) {
            visibleCount += 1;
        }
    });

    if (emptyState) {
        emptyState.hidden = visibleCount !== 0;
    }

    if (logCount) {
        logCount.textContent = 'Showing ' + visibleCount + ' mock attendance log' + (visibleCount === 1 ? '.' : 's.');
    }

    announce('Showing ' + visibleCount + ' mock attendance log' + (visibleCount === 1 ? '.' : 's.'));
}

if (filterForm) {
    filterForm.addEventListener('submit', (event) => event.preventDefault());
}

[employeeSearch, dateFilter, deviceFilter, matchStatusFilter, processingStatusFilter].forEach((filter) => {
    if (filter) {
        filter.addEventListener(filter.tagName === 'INPUT' && filter.type === 'search' ? 'input' : 'change', updateAttendanceLogFilters);
    }
});

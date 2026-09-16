import { initializeAdminLayout } from './admin-layout.js';

const { announce } = initializeAdminLayout({
    activePage: 'qr-attendance',
    navbar: {
        title: 'QR Attendance',
        subtitle: 'Attendance source monitoring'
    }
});

const refreshStatusButton = document.getElementById('refresh-status');

if (refreshStatusButton) {
    const refreshLabel = refreshStatusButton.querySelector('[data-refresh-label]');
    let resetRefreshFeedback;

    refreshStatusButton.addEventListener('click', () => {
        refreshStatusButton.disabled = true;
        refreshStatusButton.classList.add('is-refreshed');

        if (refreshLabel) {
            refreshLabel.textContent = 'Refreshing...';
        }

        announce('Refreshing prototype status...');

        window.clearTimeout(resetRefreshFeedback);
        resetRefreshFeedback = window.setTimeout(() => {
            refreshStatusButton.disabled = false;
            refreshStatusButton.classList.remove('is-refreshed');

            if (refreshLabel) {
                refreshLabel.textContent = 'Status Refreshed';
            }

            announce('Status refreshed. No QR station or backend was contacted; prototype values remain unchanged.');

            window.setTimeout(() => {
                if (refreshLabel) {
                    refreshLabel.textContent = 'Refresh Status';
                }
            }, 1400);
        }, 900);
    });
}

const filterForm = document.getElementById('qr-activity-filters');
const employeeSearch = document.getElementById('qr-employee-search');
const dateFilter = document.getElementById('qr-date-filter');
const stationFilter = document.getElementById('qr-station-filter');
const eventFilter = document.getElementById('qr-event-filter');
const validationFilter = document.getElementById('qr-validation-filter');
const processingFilter = document.getElementById('qr-processing-filter');
const qrRows = Array.from(document.querySelectorAll('[data-qr-row]'));
const emptyState = document.querySelector('[data-qr-empty]');
const qrCount = document.querySelector('[data-qr-count]');

function updateQrActivityFilters() {
    const searchTerm = employeeSearch ? employeeSearch.value.trim().toLowerCase() : '';
    const date = dateFilter ? dateFilter.value : '';
    const station = stationFilter ? stationFilter.value : 'all';
    const event = eventFilter ? eventFilter.value : 'all';
    const validation = validationFilter ? validationFilter.value : 'all';
    const processing = processingFilter ? processingFilter.value : 'all';
    let visibleCount = 0;

    qrRows.forEach((row) => {
        const matchesSearch = !searchTerm || row.textContent.toLowerCase().includes(searchTerm);
        const matchesDate = !date || row.getAttribute('data-date') === date;
        const matchesStation = station === 'all' || row.getAttribute('data-station') === station;
        const matchesEvent = event === 'all' || row.getAttribute('data-event') === event;
        const matchesValidation = validation === 'all' || row.getAttribute('data-validation') === validation;
        const matchesProcessing = processing === 'all' || row.getAttribute('data-processing') === processing;
        const isVisible = matchesSearch && matchesDate && matchesStation && matchesEvent && matchesValidation && matchesProcessing;

        row.classList.toggle('hidden', !isVisible);

        if (isVisible) {
            visibleCount += 1;
        }
    });

    if (emptyState) {
        emptyState.hidden = visibleCount !== 0;
    }

    const countText = 'Showing ' + visibleCount + ' mock QR attendance event' + (visibleCount === 1 ? '.' : 's.');

    if (qrCount) {
        qrCount.textContent = countText;
    }

    announce(countText);
}

if (filterForm) {
    filterForm.addEventListener('submit', (event) => event.preventDefault());
}

[employeeSearch, dateFilter, stationFilter, eventFilter, validationFilter, processingFilter].forEach((filter) => {
    if (filter) {
        const eventName = filter.tagName === 'INPUT' && filter.type === 'search' ? 'input' : 'change';
        filter.addEventListener(eventName, updateQrActivityFilters);
    }
});

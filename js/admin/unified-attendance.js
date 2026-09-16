import { initializeAdminLayout } from './admin-layout.js';

const { announce } = initializeAdminLayout({
    activePage: 'unified-attendance',
    navbar: {
        title: 'Unified Attendance',
        subtitle: 'Standardized attendance data'
    }
});

const refreshDataButton = document.getElementById('refresh-data');

if (refreshDataButton) {
    const refreshLabel = refreshDataButton.querySelector('[data-refresh-label]');
    let resetRefreshFeedback;
    let resetRefreshLabel;

    refreshDataButton.addEventListener('click', () => {
        refreshDataButton.disabled = true;
        refreshDataButton.classList.add('is-refreshed');

        if (refreshLabel) {
            refreshLabel.textContent = 'Refreshing...';
        }

        announce('Refreshing prototype data...');

        window.clearTimeout(resetRefreshFeedback);
        window.clearTimeout(resetRefreshLabel);
        resetRefreshFeedback = window.setTimeout(() => {
            refreshDataButton.disabled = false;

            if (refreshLabel) {
                refreshLabel.textContent = 'Data Refreshed';
            }

            announce('Data refreshed. No attendance source was synchronized; prototype values remain unchanged.');

            resetRefreshLabel = window.setTimeout(() => {
                refreshDataButton.classList.remove('is-refreshed');

                if (refreshLabel) {
                    refreshLabel.textContent = 'Refresh Data';
                }
            }, 1400);
        }, 900);
    });
}

const filterForm = document.getElementById('unified-record-filters');
const recordSearch = document.getElementById('unified-record-search');
const dateFilter = document.getElementById('unified-record-date');
const sourceFilter = document.getElementById('unified-source-filter');
const validationFilter = document.getElementById('unified-validation-filter');
const processingFilter = document.getElementById('unified-processing-filter');
const recordRows = Array.from(document.querySelectorAll('[data-unified-row]'));
const emptyState = document.querySelector('[data-unified-empty]');
const recordCount = document.querySelector('[data-unified-count]');

function updateUnifiedRecords() {
    const searchTerm = recordSearch ? recordSearch.value.trim().toLowerCase() : '';
    const date = dateFilter ? dateFilter.value : '';
    const source = sourceFilter ? sourceFilter.value : 'all';
    const validation = validationFilter ? validationFilter.value : 'all';
    const processing = processingFilter ? processingFilter.value : 'all';
    let visibleCount = 0;

    recordRows.forEach((row) => {
        const matchesSearch = !searchTerm || row.textContent.toLowerCase().includes(searchTerm);
        const matchesDate = !date || row.getAttribute('data-date') === date;
        const matchesSource = source === 'all' || row.getAttribute('data-source') === source;
        const matchesValidation = validation === 'all' || row.getAttribute('data-validation') === validation;
        const matchesProcessing = processing === 'all' || row.getAttribute('data-processing') === processing;
        const isVisible = matchesSearch && matchesDate && matchesSource && matchesValidation && matchesProcessing;

        row.classList.toggle('hidden', !isVisible);

        if (isVisible) {
            visibleCount += 1;
        }
    });

    if (emptyState) {
        emptyState.hidden = visibleCount !== 0;
    }

    const countText = 'Showing ' + visibleCount + ' mock unified attendance record' + (visibleCount === 1 ? '.' : 's.');

    if (recordCount) {
        recordCount.textContent = countText;
    }

    announce(countText);
}

if (filterForm) {
    filterForm.addEventListener('submit', (event) => event.preventDefault());
}

[recordSearch, dateFilter, sourceFilter, validationFilter, processingFilter].forEach((filter) => {
    if (filter) {
        const eventName = filter.tagName === 'INPUT' && filter.type === 'search' ? 'input' : 'change';
        filter.addEventListener(eventName, updateUnifiedRecords);
    }
});

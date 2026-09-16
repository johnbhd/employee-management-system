import { initializeAdminLayout } from './admin-layout.js';

const { announce } = initializeAdminLayout({
    activePage: 'integration-monitoring',
    navbar: {
        title: 'Integration Monitoring',
        subtitle: 'Integration control center'
    }
});

const refreshAllButton = document.getElementById('refresh-all');

if (refreshAllButton) {
    const refreshLabel = refreshAllButton.querySelector('[data-refresh-label]');
    let resetRefreshFeedback;

    refreshAllButton.addEventListener('click', () => {
        const checkedAt = new Intl.DateTimeFormat('en', {
            hour: 'numeric',
            minute: '2-digit'
        }).format(new Date());

        refreshAllButton.classList.add('is-refreshed');

        if (refreshLabel) {
            refreshLabel.textContent = 'Status Refreshed';
        }

        announce('All integration statuses refreshed at ' + checkedAt + '. No external requests were sent.');
        window.clearTimeout(resetRefreshFeedback);
        resetRefreshFeedback = window.setTimeout(() => {
            refreshAllButton.classList.remove('is-refreshed');

            if (refreshLabel) {
                refreshLabel.textContent = 'Refresh All';
            }
        }, 1800);
    });
}

const activityFilters = document.querySelectorAll('[data-activity-filter]');
const activityRows = document.querySelectorAll('[data-activity-status]');

activityFilters.forEach((filterButton) => {
    filterButton.addEventListener('click', () => {
        const filter = filterButton.getAttribute('data-activity-filter') || 'all';

        activityFilters.forEach((button) => {
            const isSelected = button === filterButton;
            button.classList.toggle('bg-au-navy', isSelected);
            button.classList.toggle('text-white', isSelected);
            button.classList.toggle('bg-slate-100', !isSelected);
            button.classList.toggle('text-slate-500', !isSelected);
        });

        activityRows.forEach((row) => {
            const rowStatus = row.getAttribute('data-activity-status');
            row.classList.toggle('hidden', filter !== 'all' && rowStatus !== filter);
        });

        announce('Showing ' + (filter === 'all' ? 'all integration activity' : filter + ' synchronization activity') + '.');
    });
});

document.querySelectorAll('[data-retry-action]').forEach((button) => {
    button.addEventListener('click', () => {
        const integration = button.getAttribute('data-retry-action') || 'integration';
        button.textContent = 'Queued';
        button.disabled = true;
        announce('Retry queued for ' + integration + '. No external request was sent.');
    });
});

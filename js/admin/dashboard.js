import { initializeAdminLayout } from './admin-layout.js';

const { announce } = initializeAdminLayout({
    activePage: 'dashboard',
    navbar: {
        title: 'IT Administrator Dashboard',
        subtitle: 'Integration control center'
    }
});

const refreshButton = document.getElementById('refresh-status');

if (refreshButton) {
    const refreshLabel = refreshButton.querySelector('[data-refresh-label]');
    let resetRefreshFeedback;

    refreshButton.addEventListener('click', () => {
        const checkedAt = new Intl.DateTimeFormat('en', {
            hour: 'numeric',
            minute: '2-digit'
        }).format(new Date());

        refreshButton.classList.add('is-refreshed');

        if (refreshLabel) {
            refreshLabel.textContent = 'Status Refreshed';
        }

        announce('Status refreshed at ' + checkedAt + '.');
        window.clearTimeout(resetRefreshFeedback);
        resetRefreshFeedback = window.setTimeout(() => {
            refreshButton.classList.remove('is-refreshed');

            if (refreshLabel) {
                refreshLabel.textContent = 'Refresh Status';
            }
        }, 1800);
    });
}

document.querySelectorAll('[data-retry-action]').forEach((button) => {
    button.addEventListener('click', () => {
        const integration = button.getAttribute('data-retry-action') || 'integration';
        button.textContent = 'Queued';
        button.disabled = true;
        announce('Retry queued for ' + integration + '. No external request was sent.');
    });
});

import { Sidebar } from '../admin/layout/sidebar.js';
import { Navbar } from '../admin/layout/navbar.js';

export function initializeAdminLayout(options = {}) {
    const {
        activePage = 'dashboard',
        navbar = {}
    } = options;
    const sidebarRoot = document.getElementById('sidebar-root');
    const navbarRoot = document.getElementById('navbar-root');

    if (sidebarRoot) {
        sidebarRoot.innerHTML = Sidebar(activePage);
    }

    if (navbarRoot) {
        navbarRoot.innerHTML = Navbar(navbar);
    }

    const sidebarPanel = document.querySelector('[data-sidebar-panel]');
    const sidebarOverlay = document.querySelector('[data-sidebar-overlay]');
    const sidebarOpenButton = document.querySelector('[data-sidebar-open]');
    const sidebarCloseButtons = document.querySelectorAll('[data-sidebar-close]');
    const profileButton = document.querySelector('[data-profile-button]');
    const profileMenu = document.querySelector('[data-profile-menu]');
    const feedbackElement = document.querySelector('[data-layout-feedback]');
    const globalSearch = document.getElementById('global-search');
    const normalNavbar = document.querySelector('[data-navbar-normal-content]');
    const mobileSearchMode = document.querySelector('[data-mobile-search-mode]');
    const mobileSearchInput = document.getElementById('mobile-dashboard-search');
    const closeMobileSearchButton = document.getElementById('close-mobile-search');
    const searchTriggers = document.querySelectorAll('[data-search-trigger]');

    function announce(message) {
        if (feedbackElement) {
            feedbackElement.textContent = message;
        }
    }

    function setSearchOpen(isOpen) {
        if (normalNavbar) {
            normalNavbar.classList.toggle('hidden', isOpen);
        }

        if (mobileSearchMode) {
            mobileSearchMode.classList.toggle('hidden', !isOpen);
        }

        searchTriggers.forEach((trigger) => {
            trigger.setAttribute('aria-expanded', String(isOpen));
        });
    }

    function isCompactSearch() {
        return window.matchMedia('(max-width: 1279px)').matches;
    }

    function openMobileSearch() {
        setSearchOpen(true);

        if (mobileSearchInput) {
            mobileSearchInput.focus();
            mobileSearchInput.select();
        }
    }

    function closeMobileSearch() {
        if (mobileSearchInput) {
            mobileSearchInput.value = '';
            mobileSearchInput.blur();
        }

        setSearchOpen(false);
    }

    function focusGlobalSearch() {
        if (isCompactSearch()) {
            openMobileSearch();
            return;
        }

        if (!globalSearch) {
            return;
        }

        globalSearch.focus();
        globalSearch.select();
    }

    function setSidebarOpen(isOpen) {
        if (!sidebarPanel || !sidebarOverlay) {
            return;
        }

        sidebarPanel.classList.toggle('-translate-x-full', !isOpen);
        sidebarPanel.classList.toggle('translate-x-0', isOpen);
        sidebarOverlay.classList.toggle('hidden', !isOpen);
        sidebarOverlay.setAttribute('aria-hidden', String(!isOpen));
        document.body.classList.toggle('sidebar-is-open', isOpen);

        if (sidebarOpenButton) {
            sidebarOpenButton.setAttribute('aria-expanded', String(isOpen));
        }
    }

    function setProfileOpen(isOpen) {
        if (!profileButton || !profileMenu) {
            return;
        }

        profileButton.setAttribute('aria-expanded', String(isOpen));
        profileMenu.classList.toggle('hidden', !isOpen);
        profileMenu.hidden = !isOpen;
    }

    searchTriggers.forEach((trigger) => {
        trigger.addEventListener('click', focusGlobalSearch);
    });

    if (closeMobileSearchButton) {
        closeMobileSearchButton.addEventListener('click', () => {
            closeMobileSearch();

            if (searchTriggers[0]) {
                searchTriggers[0].focus();
            }
        });
    }

    setSidebarOpen(false);

    if (sidebarOpenButton) {
        sidebarOpenButton.addEventListener('click', () => setSidebarOpen(true));
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => setSidebarOpen(false));
    }

    sidebarCloseButtons.forEach((button) => {
        button.addEventListener('click', () => setSidebarOpen(false));
    });

    document.querySelectorAll('[data-nav-link]').forEach((link) => {
        link.addEventListener('click', () => setSidebarOpen(false));
    });

    if (profileButton && profileMenu) {
        profileButton.addEventListener('click', (event) => {
            event.stopPropagation();
            setProfileOpen(profileMenu.hidden);
        });

        document.addEventListener('click', (event) => {
            if (!profileMenu.contains(event.target) && !profileButton.contains(event.target)) {
                setProfileOpen(false);
            }
        });
    }

    document.addEventListener('keydown', (event) => {
        if ((globalSearch || mobileSearchInput) && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
            event.preventDefault();
            focusGlobalSearch();
            return;
        }

        if (event.key === 'Escape') {
            setSidebarOpen(false);
            setProfileOpen(false);

            if (mobileSearchMode && !mobileSearchMode.classList.contains('hidden')) {
                closeMobileSearch();
            }
        }
    });

    document.querySelectorAll('[data-ui-action]').forEach((action) => {
        action.addEventListener('click', () => {
            const actionName = action.getAttribute('data-ui-action') || 'This action';
            announce(actionName.charAt(0).toUpperCase() + actionName.slice(1) + ' is available as a UI-only prototype action.');
        });
    });

    return { announce };
}

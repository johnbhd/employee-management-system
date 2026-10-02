"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { logoutFromPrototype } from "@/lib/auth-flash-toast";
import type { IconName } from "@/types/ui";

import { Icon } from "../../ui/Icon";

type AccountingNavigationItem = {
  id: string;
  label: string;
  icon: IconName;
  href?: string;
  planned?: boolean;
};

const accountingNavigation: AccountingNavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "dashboard",
    href: "/accounting/dashboard",
  },
  {
    id: "approved-payroll",
    label: "Approved Payroll Information",
    icon: "payroll",
    planned: true,
  },
  {
    id: "integration-status",
    label: "Integration Status",
    icon: "accounting",
    href: "/accounting/integration-status",
  },
  {
    id: "transaction-history",
    label: "Transaction History",
    icon: "clock",
    planned: true,
  },
];

type AccountingSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AccountingSidebar({ isOpen, onClose }: AccountingSidebarProps) {
  const pathname = usePathname();

  function handleLogout() {
    logoutFromPrototype();
    onClose();
  }

  return (
    <>
      <button
        type="button"
        className={`accounting-sidebar-overlay ${isOpen ? "is-visible" : ""}`}
        onClick={onClose}
        aria-label="Close accounting navigation"
      />
      <aside
        className={`accounting-sidebar ${isOpen ? "is-open" : ""}`}
        aria-label="Accounting Staff navigation"
      >
        <div className="accounting-sidebar-inner">
          <div className="accounting-sidebar-header">
            <Link href="/accounting/dashboard" className="accounting-brand" onClick={onClose}>
              <Image
                src="/images/aulogo.png"
                alt="Arellano University logo"
                width={44}
                height={44}
                priority
              />
              <span>
                <strong>ARELLANO UNIVERSITY</strong>
                <small>Juan Sumulong Campus</small>
              </span>
            </Link>
            <button
              type="button"
              className="accounting-sidebar-close"
              onClick={onClose}
              aria-label="Close accounting navigation"
            >
              <Icon name="close" />
            </button>
          </div>

          <div className="accounting-sidebar-scroll">
            <div className="accounting-workspace-label">
              <span>Accounting Operations</span>
              <span className="accounting-role-pill">Accounting Staff</span>
            </div>
            <nav className="accounting-sidebar-nav" aria-label="Accounting portal navigation">
              {accountingNavigation.map((item) => {
                const active = item.href
                  ? pathname === item.href || pathname.startsWith(`${item.href}/`)
                  : false;
                const content = (
                  <>
                    <Icon name={item.icon} />
                    <span className="accounting-nav-copy">
                      <span>{item.label}</span>
                      {item.planned ? <small>Planned</small> : null}
                    </span>
                  </>
                );

                return item.href ? (
                  <Link
                    href={item.href}
                    className={`accounting-nav-link ${active ? "is-active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    key={item.id}
                    onClick={onClose}
                  >
                    {content}
                  </Link>
                ) : (
                  <span
                    className="accounting-nav-link accounting-nav-placeholder"
                    key={item.id}
                    aria-disabled="true"
                  >
                    {content}
                  </span>
                );
              })}
            </nav>
            <div className="accounting-sidebar-status">
              <div>
                <span className="accounting-status-dot" aria-hidden="true" />
                <span>Simulated status</span>
              </div>
              <strong>Accounting Integration</strong>
              <p>Approved payroll transfers are monitored before synchronization with the Existing Accounting System.</p>
            </div>
          </div>

          <div className="accounting-sidebar-footer">
            <div className="accounting-sidebar-account">
              <span className="accounting-account-avatar">
                <Icon name="user" />
              </span>
              <span>
                <strong>Accounting Staff</strong>
                <small>AU-JSC Accounting Account</small>
              </span>
            </div>
            <Link href="/" className="accounting-sidebar-logout" onClick={handleLogout}>
              <Icon name="logout" />
              Log out
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { adminNavigation } from "@/data/admin";

import { Icon } from "../../ui/Icon";

type AdminSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <button
        type="button"
        className={`admin-sidebar-overlay ${isOpen ? "is-visible" : ""}`}
        aria-label="Close navigation menu"
        onClick={onClose}
      />
      <aside className={`admin-sidebar ${isOpen ? "is-open" : ""}`} aria-label="IT Administrator navigation">
        <div className="admin-sidebar-inner">
          <div className="admin-sidebar-header">
            <Link href="/admin/dashboard" className="admin-brand" onClick={onClose}>
              <Image src="/images/aulogo.png" alt="Arellano University logo" width={44} height={44} priority />
              <span>
                <strong>ARELLANO UNIVERSITY</strong>
                <small>Juan Sumulong Campus</small>
              </span>
            </Link>
            <button type="button" className="icon-button admin-sidebar-close" onClick={onClose} aria-label="Close navigation menu">
              <Icon name="close" />
            </button>
          </div>

          <div className="admin-sidebar-scroll">
            <div className="workspace-label">
              <span>Workspace</span>
              <span className="role-pill">IT Administrator</span>
            </div>
            <nav className="admin-sidebar-nav" aria-label="Primary navigation">
              {adminNavigation.map((item) => {
                const active = item.href ? pathname === item.href || pathname.startsWith(`${item.href}/`) : false;

                if (!item.href) {
                  return (
                    <span className="admin-nav-link admin-nav-placeholder" key={item.id} aria-disabled="true">
                      <Icon name={item.icon} />
                      <span>{item.label}</span>
                    </span>
                  );
                }

                return (
                  <Link
                    href={item.href}
                    className={`admin-nav-link ${active ? "is-active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    key={item.id}
                    onClick={onClose}
                  >
                    <Icon name={item.icon} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="admin-sidebar-footer">
            <div className="sidebar-status-card">
              <div>
                <span className="status-dot status-success" />
                <span>Integration layer</span>
              </div>
              <strong>Live</strong>
              <p>Six connected services monitored from one control center.</p>
            </div>
            <div className="sidebar-account">
              <span className="account-avatar"><Icon name="user" /></span>
              <span>
                <strong>IT Administrator</strong>
                <small>AU-JSC Admin Account</small>
              </span>
              <Link href="/" aria-label="Log out" onClick={onClose}>
                <Icon name="logout" />
              </Link>
            </div>
            <Link href="/" className="sidebar-logout" onClick={onClose}>
              <Icon name="logout" />
              Logout
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

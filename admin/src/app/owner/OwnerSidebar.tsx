import React from "react";
import Link from "next/link";
import styles from "./OwnerSidebar.module.css";

const navItems = [
  { name: "Dashboard", path: "/owner/dashboard" },
  { name: "Tenants", path: "/owner/tenants" },
  { name: "Users", path: "/owner/users" },
  { name: "Audit Logs", path: "/owner/audit-logs" },
  { name: "Settings", path: "/owner/settings" },
];

export default function OwnerSidebar() {
  return (
    <nav className={styles.sidebar}>
      <div className={styles.logo}>🚚 Delivery Admin</div>
      <ul className={styles.menu}>
        {navItems.map((item) => (
          <li key={item.path}>
            <Link href={item.path} className={styles.link}>
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
      <div className={styles.footer}>
        <span>© {new Date().getFullYear()} DeliveryApp</span>
      </div>
    </nav>
  );
}

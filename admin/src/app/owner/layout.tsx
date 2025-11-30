import React from "react";
import OwnerSidebar from "./OwnerSidebar";
import styles from "./OwnerLayout.module.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <OwnerSidebar />
      <main className={styles.content}>{children}</main>
    </div>
  );
}

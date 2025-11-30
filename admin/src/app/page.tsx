import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>🚚 DeliveryApp</div>
        <Link href="/login" className={styles.loginButton}>
          Login
        </Link>
      </header>
      <main className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Fast, Reliable, and Modern Delivery Platform</h1>
          <p className={styles.heroSubtitle}>
            Manage your deliveries, restaurants, and orders all in one place. Join as an owner, restaurant, client, or delivery person.
          </p>
          <Link href="/login" className={styles.ctaButton}>
            Get Started
          </Link>
        </div>
        <div className={styles.heroImage}>
          <img src="https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80" alt="Delivery" />
        </div>
      </main>
    </div>
  );
}

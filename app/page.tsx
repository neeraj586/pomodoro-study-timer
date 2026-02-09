import PomodoroTimer from "@/components/PomodoroTimer";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className="text-gradient-primary">focus for 25 minutes. don’t ruin it.</h1>
        <p>your character will judge you silently.</p>
      </header>

      <PomodoroTimer />

      <footer className={styles.footer}>
        <p>© 2026 Padippi</p>
      </footer>
    </main>
  );
}

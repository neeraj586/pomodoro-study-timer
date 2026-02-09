import PomodoroTimer from "@/components/PomodoroTimer";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className="text-gradient-primary">FocusFlow</h1>
        <p>Your sanctuary for deep work</p>
      </header>

      <PomodoroTimer />

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} FocusFlow. Designed for excellence.</p>
      </footer>
    </main>
  );
}

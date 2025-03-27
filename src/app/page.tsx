// app/page.tsx
"use client";

import SheetContainer from "../components/SheetContainer";
import styles from "@/app/page.module.css";

export default function HomePage() {
  return (
    <div className={styles.container}>
      <SheetContainer />
    </div>
  );
}
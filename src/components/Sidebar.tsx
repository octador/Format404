// app/components/sidebar.tsx
"use client";

import React from "react";
import { FaFont, FaImage, FaVideo } from 'react-icons/fa';
import MediaLibrary from "./mediaLibrary";
import styles from "./sidebar.module.css";

const Sidebar = () => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, type: string) => {
    console.log("Drag started:", type);
    e.dataTransfer.setData("itemType", type);
  };

  return (
    <div className={styles.sidebar}>
      <p>Faites glisser un élément :</p>
      <div
        className={styles.item}
        draggable
        onDragStart={(e) => handleDragStart(e, "Texte")}
      >
        <FaFont size={20} /> Texte
      </div>
      
      {/* Intégration de la médiathèque */}
      <div className={styles.sectionDivider}></div>
      <MediaLibrary />
    </div>
  );
};

export default Sidebar;
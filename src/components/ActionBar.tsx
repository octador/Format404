// app/components/actionBar.tsx
import React from 'react';
import { FaTrash, FaCopy, FaPaste, FaCut } from 'react-icons/fa';
import styles from './actionBar.module.css';

interface ActionBarProps {
  visible: boolean;
  onDelete: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  canPaste: boolean;
}

const ActionBar = ({ visible, onDelete, onCopy, onCut, onPaste, canPaste }: ActionBarProps) => {
  if (!visible) return null;

  return (
    <div className={styles.actionBar}>
      <button 
        className={styles.actionButton}
        onClick={onCopy}
        title="Copier les éléments sélectionnés"
      >
        <FaCopy size={16} />
        <span>Copier</span>
      </button>
      
      <button 
        className={styles.actionButton}
        onClick={onCut}
        title="Couper les éléments sélectionnés"
      >
        <FaCut size={16} />
        <span>Couper</span>
      </button>
      
      <button 
        className={`${styles.actionButton} ${!canPaste ? styles.disabled : ''}`}
        onClick={onPaste}
        disabled={!canPaste}
        title={canPaste ? "Coller les éléments" : "Rien à coller"}
      >
        <FaPaste size={16} />
        <span>Coller</span>
      </button>
      
      <div className={styles.divider}></div>
      
      <button 
        className={styles.actionButton}
        onClick={onDelete}
        title="Supprimer les éléments sélectionnés"
      >
        <FaTrash size={16} />
        <span>Supprimer</span>
      </button>
    </div>
  );
};

export default ActionBar;
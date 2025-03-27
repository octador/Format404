// app/components/SheetNavigationBar.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaArrowLeft, FaArrowRight, FaPlay, FaEdit, FaCopy } from 'react-icons/fa';
import styles from '@/components/sheetNavigationBar.module.css';
import { SheetData } from '@/app/types/sheet';

interface SheetNavigationBarProps {
  sheets: SheetData[];
  currentSheetId: string;
  onAddSheet: () => void;
  onDeleteSheet: (id: string) => void;
  onDuplicateSheet: (id: string) => void;
  onSelectSheet: (id: string) => void;
  onStartPresentation: () => void;
  onRenameSheet: (id: string, newTitle: string) => void;
  isEditMode: boolean;
}

const SheetNavigationBar: React.FC<SheetNavigationBarProps> = ({
  sheets,
  currentSheetId,
  onAddSheet,
  onDeleteSheet,
  onDuplicateSheet,
  onSelectSheet,
  onStartPresentation,
  onRenameSheet,
  isEditMode
}) => {
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  
  // Trouver l'index du sheet actuel
  const currentIndex = sheets.findIndex(sheet => sheet.id === currentSheetId);
  
  // Déterminer si les boutons de navigation doivent être désactivés
  const isFirstSheet = currentIndex === 0;
  const isLastSheet = currentIndex === sheets.length - 1;
  
  // Naviguer vers le sheet précédent
  const goToPreviousSheet = () => {
    if (!isFirstSheet) {
      onSelectSheet(sheets[currentIndex - 1].id);
    }
  };
  
  // Naviguer vers le sheet suivant
  const goToNextSheet = () => {
    if (!isLastSheet) {
      onSelectSheet(sheets[currentIndex + 1].id);
    }
  };
  
  // Commencer l'édition du titre
  const startEditingTitle = (id: string, title: string) => {
    setEditingTitleId(id);
    setNewTitle(title);
  };
  
  // Terminer l'édition du titre
  const finishEditingTitle = () => {
    if (editingTitleId && newTitle.trim()) {
      onRenameSheet(editingTitleId, newTitle.trim());
    }
    setEditingTitleId(null);
  };
  
  // Gérer la touche Entrée lors de l'édition du titre
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      finishEditingTitle();
    }
  };
  
  // Ajouter des raccourcis clavier pour la navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ne pas traiter les raccourcis si nous sommes en mode édition de titre
      if (editingTitleId) return;
      
      // Flèche gauche pour le sheet précédent
      if (e.key === 'ArrowLeft' && !isFirstSheet) {
        goToPreviousSheet();
      }
      // Flèche droite pour le sheet suivant
      else if (e.key === 'ArrowRight' && !isLastSheet) {
        goToNextSheet();
      }
      // F5 pour démarrer la présentation
      else if (e.key === 'F5') {
        e.preventDefault();
        onStartPresentation();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, sheets, editingTitleId]);
  
  return (
    <div className={styles.navigationBar}>
      <div className={styles.sheetTabs}>
        {sheets.map((sheet) => (
          <div 
            key={sheet.id}
            className={`${styles.sheetTab} ${sheet.id === currentSheetId ? styles.active : ''}`}
            onClick={() => onSelectSheet(sheet.id)}
          >
            {editingTitleId === sheet.id ? (
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onBlur={finishEditingTitle}
                onKeyDown={handleKeyDown}
                autoFocus
                className={styles.titleInput}
              />
            ) : (
              <>
                <span className={styles.sheetTitle}>{sheet.title}</span>
                {isEditMode && (
                  <div className={styles.tabActions}>
                    <button 
                      className={styles.actionButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingTitle(sheet.id, sheet.title);
                      }}
                      title="Renommer"
                    >
                      <FaEdit size={12} />
                    </button>
                    <button 
                      className={styles.actionButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateSheet(sheet.id);
                      }}
                      title="Dupliquer"
                    >
                      <FaCopy size={12} />
                    </button>
                    {sheets.length > 1 && (
                      <button 
                        className={styles.actionButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSheet(sheet.id);
                        }}
                        title="Supprimer"
                      >
                        <FaTrash size={12} />
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        {isEditMode && (
          <button 
            className={styles.addSheetButton}
            onClick={onAddSheet}
            title="Ajouter une page"
          >
            <FaPlus size={16} />
          </button>
        )}
      </div>
      
      <div className={styles.navigationControls}>
        <button 
          className={`${styles.navButton} ${isFirstSheet ? styles.disabled : ''}`}
          onClick={goToPreviousSheet}
          disabled={isFirstSheet}
          title="Page précédente"
        >
          <FaArrowLeft size={16} />
        </button>
        <span className={styles.pageIndicator}>
          {currentIndex + 1} / {sheets.length}
        </span>
        <button 
          className={`${styles.navButton} ${isLastSheet ? styles.disabled : ''}`}
          onClick={goToNextSheet}
          disabled={isLastSheet}
          title="Page suivante"
        >
          <FaArrowRight size={16} />
        </button>
        <button 
          className={styles.presentButton}
          onClick={onStartPresentation}
          title="Démarrer la présentation"
        >
          <FaPlay size={16} />
        </button>
      </div>
    </div>
  );
};

export default SheetNavigationBar;
// app/components/SheetContainer.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Sheet, { DroppedItem } from './sheet';
import SheetNavigationBar from './sheetNavigationBar';
import styles from './SheetContainer.module.css';

type SheetData = {
  id: string;
  title: string;
  items: DroppedItem[];
  order: number;
};

const SheetContainer: React.FC = () => {
  // État pour stocker tous les sheets
  const [sheets, setSheets] = useState<SheetData[]>([]);
  // ID du sheet actuellement affiché
  const [currentSheetId, setCurrentSheetId] = useState<string>('');
  // Mode édition ou présentation
  const [isEditMode, setIsEditMode] = useState<boolean>(true);
  
  // Initialiser avec un sheet vide au chargement
  useEffect(() => {
    const initialSheet = createNewSheet('Page 1');
    setSheets([initialSheet]);
    setCurrentSheetId(initialSheet.id);
    
    // Essayer de charger les sheets sauvegardés
    const savedSheets = localStorage.getItem('formationSheets');
    if (savedSheets) {
      try {
        const parsedSheets = JSON.parse(savedSheets) as SheetData[];
        if (parsedSheets.length > 0) {
          setSheets(parsedSheets);
          setCurrentSheetId(parsedSheets[0].id);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des sheets:', error);
      }
    }
  }, []);
  
  // Sauvegarder les sheets quand ils changent
  useEffect(() => {
    if (sheets.length > 0) {
      localStorage.setItem('formationSheets', JSON.stringify(sheets));
    }
  }, [sheets]);
  
  // Créer un nouveau sheet
  const createNewSheet = (title: string): SheetData => {
    return {
      id: Math.random().toString(36).substr(2, 9),
      title,
      items: [],
      order: sheets.length
    };
  };
  
  // Ajouter un nouveau sheet
  const handleAddSheet = () => {
    const newSheet = createNewSheet(`Page ${sheets.length + 1}`);
    setSheets([...sheets, newSheet]);
    setCurrentSheetId(newSheet.id);
  };
  
  // Supprimer un sheet
  const handleDeleteSheet = (id: string) => {
    // Ne pas supprimer si c'est le seul sheet
    if (sheets.length <= 1) return;
    
    const updatedSheets = sheets.filter(sheet => sheet.id !== id);
    setSheets(updatedSheets);
    
    // Si le sheet actuel est supprimé, sélectionner le premier sheet
    if (id === currentSheetId) {
      setCurrentSheetId(updatedSheets[0].id);
    };
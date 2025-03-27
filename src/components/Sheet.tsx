// app/components/sheet.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { FaImage, FaVideo, FaFont, FaTimes, FaBold, FaItalic, FaUnderline, FaAlignLeft, FaAlignCenter, FaAlignRight } from 'react-icons/fa';
import styles from "./sheet.module.css";
import ActionBar from "./actionBar";

export type DroppedItem = {
  id: string;
  type: string;
  x: number;
  y: number;
  selected?: boolean;
  mediaUrl?: string;
  mediaId?: string;
  content?: string;
  style?: {
    fontSize?: string;
    fontWeight?: string;
    fontStyle?: string;
    textDecoration?: string;
    color?: string;
    textAlign?: string;
    width?: string;
    backgroundColor?: string;
  };
  isEditing?: boolean;
};

interface SheetProps {
  items?: DroppedItem[];
  onItemsChange?: (items: DroppedItem[]) => void;
  isReadOnly?: boolean;
}

export default function Sheet({ items = [], onItemsChange, isReadOnly = false }: SheetProps) {
  const [droppedItems, setDroppedItems] = useState<DroppedItem[]>(items);
  const [clipboard, setClipboard] = useState<DroppedItem[]>([]);
  const [hasUnpastedCopy, setHasUnpastedCopy] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const textEditRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const isInitialMount = useRef(true);
  const pendingChanges = useRef(false);

  // Initialiser l'état local avec les props au montage et quand les items changent
  useEffect(() => {
    setDroppedItems(items);
  }, [items]);

  // Notifier le parent des changements
  useEffect(() => {
    // Ne pas notifier lors du montage initial
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (onItemsChange) {
      // Filtrer les propriétés temporaires avant de notifier le parent
      const cleanItems = droppedItems.map(item => ({
        ...item,
        selected: false,
        isEditing: false
      }));
      onItemsChange(cleanItems);
    }
  }, [droppedItems, onItemsChange]);

  // Fonction pour générer un ID unique
  const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  // Suivre la position de la souris pour le collage
  useEffect(() => {
    if (isReadOnly) return; // Ne pas suivre la souris en mode lecture seule
    
    const handleMouseMove = (e: MouseEvent) => {
      if (dropZoneRef.current) {
        const rect = dropZoneRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isReadOnly]);

  // Gérer les touches clavier (pour la suppression avec Delete et les raccourcis copier/coller)
  useEffect(() => {
    if (isReadOnly) return; // Désactiver les raccourcis en mode lecture seule
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ne pas traiter les événements clavier si nous sommes en train d'éditer du texte
      if (droppedItems.some(item => item.isEditing)) return;

      // Supprimer avec Delete
      if (e.key === "Delete" || e.key === "Backspace") {
        setDroppedItems(prevItems => 
          prevItems.filter(item => !item.selected)
        );
      } 
      // Désélectionner avec Escape
      else if (e.key === "Escape") {
        setDroppedItems(prevItems => 
          prevItems.map(item => ({ ...item, selected: false, isEditing: false }))
        );
      }
      // Copier avec Ctrl+C
      else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        handleCopy();
      }
      // Couper avec Ctrl+X
      else if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        handleCut();
      }
      // Coller avec Ctrl+V
      else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (clipboard.length > 0) {
          handlePaste();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [droppedItems, clipboard, isReadOnly]);

  // Gérer les clics en dehors des zones d'édition
  useEffect(() => {
    if (isReadOnly) return; // Désactiver en mode lecture seule
    
    const handleClickOutside = (e: MouseEvent) => {
      if (droppedItems.some(item => item.isEditing)) {
        const target = e.target as Node;
        if (textEditRef.current && !textEditRef.current.contains(target)) {
          setDroppedItems(prevItems => 
            prevItems.map(item => ({ ...item, isEditing: false }))
          );
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [droppedItems, isReadOnly]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (isReadOnly) return; // Désactiver en mode lecture seule
    
    e.preventDefault();
    const itemType = e.dataTransfer.getData("itemType");
    
    // Si aucun type n'est défini, c'est probablement un déplacement interne
    if (!itemType) return;
    
    console.log("Item dropped:", itemType);

    const dropZone = dropZoneRef.current;
    if (!dropZone) return;

    const rect = dropZone.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Vérifier s'il s'agit d'un élément de la médiathèque
    const mediaItemId = e.dataTransfer.getData("mediaItemId");
    const mediaItemUrl = e.dataTransfer.getData("mediaItemUrl");
    
    // Créer un nouvel élément avec les informations appropriées
    const newItem: DroppedItem = { 
      id: generateId(), 
      type: itemType, 
      x, 
      y,
      selected: false,
      // Si c'est un élément de la médiathèque, ajouter l'URL
      ...(mediaItemUrl && { mediaUrl: mediaItemUrl, mediaId: mediaItemId })
    };

    // Ajouter du contenu par défaut pour le texte
    if (itemType === "Texte") {
      newItem.content = "Double-cliquez pour éditer ce texte";
      newItem.style = {
        fontSize: "16px",
        fontWeight: "normal",
        fontStyle: "normal",
        textDecoration: "none",
        color: "#000000",
        textAlign: "left",
        width: "250px",
        backgroundColor: "transparent"
      };
    }

    // Désélectionner tous les éléments et ajouter le nouveau
    setDroppedItems([
      ...droppedItems.map(item => ({ ...item, selected: false })),
      newItem
    ]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (isReadOnly) return; // Désactiver en mode lecture seule
    
    e.preventDefault();
    
    // Si un élément est en cours de déplacement, mettre à jour sa position
    if (draggedItemId) {
      const dropZone = dropZoneRef.current;
      if (!dropZone) return;

      const rect = dropZone.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;

      setDroppedItems(prevItems => 
        prevItems.map(item => 
          item.id === draggedItemId 
            ? { ...item, x, y } 
            : item
        )
      );
    }
  };

  // Démarrer le déplacement d'un élément existant
  const handleItemDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    if (isReadOnly) return; // Désactiver en mode lecture seule
    
    e.stopPropagation();
    
    // Ne pas permettre le drag si nous sommes en mode édition
    const item = droppedItems.find(item => item.id === id);
    if (item?.isEditing) {
      e.preventDefault();
      return;
    }
    
    // Empêcher le navigateur de créer une image fantôme
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
    
    if (!item) return;
    
    // Calculer le décalage pour un déplacement précis
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    setDraggedItemId(id);
    setDragOffset({ x: offsetX, y: offsetY });
  };

  const handleItemDragEnd = () => {
    setDraggedItemId(null);
  };

  // Sélectionner un élément au clic
  const handleItemClick = (e: React.MouseEvent, id: string) => {
    if (isReadOnly) return; // Désactiver en mode lecture seule
    
    e.stopPropagation();
    
    // Si l'élément est en mode édition, ne pas changer la sélection
    const item = droppedItems.find(item => item.id === id);
    if (item?.isEditing) return;
    
    // Si la touche Ctrl est enfoncée, on ajoute à la sélection
    // Sinon, on sélectionne uniquement cet élément
    if (e.ctrlKey || e.metaKey) {
      setDroppedItems(prevItems => 
        prevItems.map(item => 
          item.id === id 
            ? { ...item, selected: !item.selected } 
            : item
        )
      );
    } else {
      setDroppedItems(prevItems => 
        prevItems.map(item => ({
          ...item,
          selected: item.id === id
        }))
      );
    }
  };

  // Activer le mode édition au double-clic sur un texte
  const handleTextDoubleClick = (e: React.MouseEvent, id: string) => {
    if (isReadOnly) return; // Désactiver en mode lecture seule
    
    e.stopPropagation();
    
    setDroppedItems(prevItems => 
      prevItems.map(item => ({
        ...item,
        isEditing: item.id === id && item.type === "Texte",
        selected: item.id === id
      }))
    );
  };

  // Mettre à jour le contenu du texte
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>, id: string) => {
    setDroppedItems(prevItems => 
      prevItems.map(item => 
        item.id === id 
          ? { ...item, content: e.target.value } 
          : item
      )
    );
  };

  // Appliquer un style au texte
  const applyTextStyle = (id: string, styleProperty: string, value: string) => {
    setDroppedItems(prevItems => 
      prevItems.map(item => 
        item.id === id 
          ? { 
              ...item, 
              style: { 
                ...item.style, 
                [styleProperty]: value 
              } 
            } 
          : item
      )
    );
  };

  // Désélectionner tous les éléments au clic sur la zone de drop
  const handleDropZoneClick = (e: React.MouseEvent) => {
    if (isReadOnly) return; // Désactiver en mode lecture seule
    
    // Vérifier si le clic est sur l'ActionBar
    const target = e.target as HTMLElement;
    if (target.closest(`.${styles.actionBar}`) || target.closest(`.actionBar`)) {
      return; // Ne pas désélectionner si le clic est sur l'ActionBar
    }
    
    setDroppedItems(prevItems => 
      prevItems.map(item => ({ ...item, selected: false, isEditing: false }))
    );
  };

  // Supprimer un élément
  const handleDeleteItem = (e: React.MouseEvent, id: string) => {
    if (isReadOnly) return; // Désactiver en mode lecture seule
    
    e.stopPropagation();
    setDroppedItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  // Terminer l'édition du texte
  const finishTextEditing = (id: string) => {
    setDroppedItems(prevItems => 
      prevItems.map(item => 
        item.id === id 
          ? { ...item, isEditing: false } 
          : item
      )
    );
  };

  // Copier les éléments sélectionnés
  const handleCopy = () => {
    if (isReadOnly) return; // Désactiver en mode lecture seule
    
    const selectedItems = droppedItems.filter(item => item.selected);
    if (selectedItems.length > 0) {
      // Trouver la position la plus à gauche et la plus haute parmi les éléments sélectionnés
      const minX = Math.min(...selectedItems.map(item => item.x));
      const minY = Math.min(...selectedItems.map(item => item.y));
      
      // Créer une copie des éléments sélectionnés avec leurs positions relatives
      const itemsForClipboard = selectedItems.map(item => ({
        ...item,
        x: item.x - minX, // Position relative
        y: item.y - minY, // Position relative
        id: generateId(), // Nouvel ID pour éviter les conflits
        isEditing: false  // S'assurer que l'élément n'est pas en mode édition
      }));
      
      setClipboard(itemsForClipboard);
      setHasUnpastedCopy(true);
      console.log("Éléments copiés dans le presse-papier:", itemsForClipboard.length);
    }
  };

  // Couper les éléments sélectionnés
  const handleCut = () => {
    if (isReadOnly) return; // Désactiver en mode lecture seule
    
    const selectedItems = droppedItems.filter(item => item.selected);
    if (selectedItems.length > 0) {
      // D'abord copier
      // Trouver la position la plus à gauche et la plus haute parmi les éléments sélectionnés
      const minX = Math.min(...selectedItems.map(item => item.x));
      const minY = Math.min(...selectedItems.map(item => item.y));
      
      // Créer une copie des éléments sélectionnés avec leurs positions relatives
      const itemsForClipboard = selectedItems.map(item => ({
        ...item,
        x: item.x - minX, // Position relative
        y: item.y - minY, // Position relative
        id: generateId(), // Nouvel ID pour éviter les conflits
        isEditing: false  // S'assurer que l'élément n'est pas en mode édition
      }));
      
      setClipboard(itemsForClipboard);
      
      // Puis supprimer
      setDroppedItems(prevItems => prevItems.filter(item => !item.selected));
      
      setHasUnpastedCopy(true);
      console.log("Éléments coupés:", selectedItems.length);
    }
  };

  // Coller les éléments du presse-papier
  const handlePaste = () => {
    if (isReadOnly) return; // Désactiver en mode lecture seule
    
    if (clipboard.length > 0) {
      // Créer de nouveaux éléments à partir du presse-papier
      const newItems = clipboard.map(item => ({
        ...item,
        x: mousePosition.x + item.x, // Position absolue basée sur la position de la souris
        y: mousePosition.y + item.y, // Position absolue basée sur la position de la souris
        id: generateId(), // Nouvel ID pour éviter les conflits
        selected: true,   // Sélectionner les nouveaux éléments
      }));
      
      // Désélectionner tous les éléments existants et ajouter les nouveaux
      setDroppedItems(prevItems => [
        ...prevItems.map(item => ({ ...item, selected: false })),
        ...newItems
      ]);
      
      // Marquer que le contenu du presse-papier a été collé
      setHasUnpastedCopy(false);
      
      console.log("Éléments collés:", newItems.length);
    }
  };

  // Vérifier si des éléments sont sélectionnés
  const hasSelectedItems = droppedItems.some(item => item.selected);
  
  // Déterminer si l'ActionBar doit être visible
  const showActionBar = !isReadOnly && (hasSelectedItems || hasUnpastedCopy);

  return (
    <div className={styles.sheet}>
      <div
        ref={dropZoneRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleDropZoneClick}
        className={`${styles.dropZone} ${isReadOnly ? styles.readOnly : ''}`}
      >
        {!isReadOnly && (
          <div className={styles.instructions}>
            <p>Sélectionnez un élément et appuyez sur <kbd>Delete</kbd> pour le supprimer</p>
            <p>Utilisez <kbd>Ctrl+C</kbd>, <kbd>Ctrl+X</kbd> et <kbd>Ctrl+V</kbd> pour copier, couper et coller</p>
          </div>
        )}
        
        {droppedItems.map((item) => (
          <div
            key={item.id}
            className={`${styles.droppedItem} ${item.selected ? styles.selected : ''} ${isReadOnly ? styles.readOnly : ''}`}
            style={{ 
              position: "absolute",
              top: item.y, 
              left: item.x,
              padding: (item.mediaUrl || item.isEditing) ? "0" : "10px", // Pas de padding pour les médias ou en mode édition
              background: "#f0f0f0",
              border: item.selected ? "2px solid #3498db" : "1px solid #ccc",
              borderRadius: "4px",
              cursor: isReadOnly ? "default" : (item.isEditing ? "text" : "move"),
              userSelect: "none",
              zIndex: item.isEditing ? 1000 : 1
            }}
            draggable={!isReadOnly && !item.isEditing}
            onDragStart={(e) => handleItemDragStart(e, item.id)}
            onDragEnd={handleItemDragEnd}
            onClick={(e) => handleItemClick(e, item.id)}
            onDoubleClick={item.type === "Texte" && !isReadOnly ? (e) => handleTextDoubleClick(e, item.id) : undefined}
          >
            <div className={styles.itemContent}>
              {item.type === "Image" && item.mediaUrl ? (
                <img 
                  src={item.mediaUrl} 
                  alt="Media" 
                  style={{ maxWidth: "200px", maxHeight: "200px", display: "block" }}
                />
              ) : item.type === "Vidéo" && item.mediaUrl ? (
                <video 
                  src={item.mediaUrl} 
                  controls={!isReadOnly}
                  autoPlay={isReadOnly}
                  loop={isReadOnly}
                  muted={isReadOnly}
                  style={{ maxWidth: "200px", maxHeight: "200px", display: "block" }}
                />
              ) : item.type === "Image" ? (
                <FaImage size={30} />
              ) : item.type === "Vidéo" ? (
                <FaVideo size={30} />
              ) : item.type === "Texte" ? (
                item.isEditing && !isReadOnly ? (
                  <div className={styles.textEditor} ref={textEditRef}>
                    <div className={styles.textToolbar}>
                      <button 
                        className={`${styles.toolbarButton} ${item.style?.fontWeight === 'bold' ? styles.active : ''}`}
                        onClick={() => applyTextStyle(item.id, 'fontWeight', item.style?.fontWeight === 'bold' ? 'normal' : 'bold')}
                      >
                        <FaBold />
                      </button>
                      <button 
                        className={`${styles.toolbarButton} ${item.style?.fontStyle === 'italic' ? styles.active : ''}`}
                        onClick={() => applyTextStyle(item.id, 'fontStyle', item.style?.fontStyle === 'italic' ? 'normal' : 'italic')}
                      >
                        <FaItalic />
                      </button>
                      <button 
                        className={`${styles.toolbarButton} ${item.style?.textDecoration === 'underline' ? styles.active : ''}`}
                        onClick={() => applyTextStyle(item.id, 'textDecoration', item.style?.textDecoration === 'underline' ? 'none' : 'underline')}
                      >
                        <FaUnderline />
                      </button>
                      <div className={styles.divider}></div>
                      <button 
                        className={`${styles.toolbarButton} ${item.style?.textAlign === 'left' ? styles.active : ''}`}
                        onClick={() => applyTextStyle(item.id, 'textAlign', 'left')}
                      >
                        <FaAlignLeft />
                      </button>
                      <button 
                        className={`${styles.toolbarButton} ${item.style?.textAlign === 'center' ? styles.active : ''}`}
                        onClick={() => applyTextStyle(item.id, 'textAlign', 'center')}
                      >
                        <FaAlignCenter />
                      </button>
                      <button 
                        className={`${styles.toolbarButton} ${item.style?.textAlign === 'right' ? styles.active : ''}`}
                        onClick={() => applyTextStyle(item.id, 'textAlign', 'right')}
                      >
                        <FaAlignRight />
                      </button>
                      <div className={styles.divider}></div>
                      <select 
                        className={styles.fontSizeSelect}
                        value={item.style?.fontSize?.replace('px', '') || '16'}
                        onChange={(e) => applyTextStyle(item.id, 'fontSize', `${e.target.value}px`)}
                      >
                        {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64].map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                      <input 
                        type="color" 
                        className={styles.colorPicker}
                        value={item.style?.color || '#000000'}
                        onChange={(e) => applyTextStyle(item.id, 'color', e.target.value)}
                      />
                      <button 
                        className={styles.doneButton}
                        onClick={() => finishTextEditing(item.id)}
                      >
                        Terminé
                      </button>
                    </div>
                    <textarea
                      className={styles.textArea}
                      value={item.content || ''}
                      onChange={(e) => handleTextChange(e, item.id)}
                      style={{
                        width: item.style?.width || '250px',
                        fontSize: item.style?.fontSize || '16px',
                        fontWeight: item.style?.fontWeight || 'normal',
                        fontStyle: item.style?.fontStyle || 'normal',
                        textDecoration: item.style?.textDecoration || 'none',
                        color: item.style?.color || '#000000',
                        textAlign: (item.style?.textAlign as any) || 'left',
                        backgroundColor: 'transparent',
                        resize: 'both'
                      }}
                      autoFocus
                    />
                  </div>
                ) : (
                  <div 
                    style={{
                      width: item.style?.width || '250px',
                      fontSize: item.style?.fontSize || '16px',
                      fontWeight: item.style?.fontWeight || 'normal',
                      fontStyle: item.style?.fontStyle || 'normal',
                      textDecoration: item.style?.textDecoration || 'none',
                      color: item.style?.color || '#000000',
                      textAlign: (item.style?.textAlign as any) || 'left',
                      backgroundColor: item.style?.backgroundColor || 'transparent',
                      wordWrap: 'break-word'
                    }}
                  >
                    {item.content || 'Double-cliquez pour éditer ce texte'}
                  </div>
                )
              ) : (
                item.type
              )}
            </div>
            
            {/* Bouton de suppression (visible seulement si l'élément n'est pas en mode édition et pas en lecture seule) */}
            {!item.isEditing && !isReadOnly && (
              <button 
                className={styles.deleteButton}
                onClick={(e) => handleDeleteItem(e, item.id)}
                title="Supprimer cet élément"
              >
                <FaTimes size={14} />
              </button>
            )}
          </div>
        ))}
        
        {/* Utiliser showActionBar pour déterminer si l'ActionBar doit être affichée */}
        {showActionBar && (
          <ActionBar
            visible={showActionBar}
            onDelete={() => setDroppedItems(prevItems => prevItems.filter(item => !item.selected))}
            onCopy={handleCopy}
            onCut={handleCut}
            onPaste={handlePaste}
            canPaste={clipboard.length > 0}
          />
        )}
      </div>
    </div>
  );
}
// app/components/MediaLibrary.tsx
"use client";

import React, { useState, useRef } from "react";
import { FaImage, FaVideo, FaFile, FaUpload, FaFolder, FaFolderOpen, FaTrash } from 'react-icons/fa';
import styles from "./mediaLibrary.module.css";

type MediaItem = {
  id: string;
  name: string;
  type: string;
  url: string;
  thumbnail?: string;
};

const MediaLibrary = () => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Générer un ID unique
  const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  // Déterminer l'icône en fonction du type de fichier
  const getIconForType = (type: string) => {
    if (type.startsWith("image/")) return <FaImage size={20} />;
    if (type.startsWith("video/")) return <FaVideo size={20} />;
    return <FaFile size={20} />;
  };

  // Ouvrir la boîte de dialogue de sélection de fichier
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Gérer le téléchargement de fichiers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newMediaItems: MediaItem[] = [];

    Array.from(files).forEach(file => {
      // Créer une URL pour le fichier
      const url = URL.createObjectURL(file);
      
      // Créer une miniature pour les images
      let thumbnail = "";
      if (file.type.startsWith("image/")) {
        thumbnail = url;
      }

      newMediaItems.push({
        id: generateId(),
        name: file.name,
        type: file.type,
        url: url,
        thumbnail: thumbnail
      });
    });

    setMediaItems([...mediaItems, ...newMediaItems]);
    
    // Réinitialiser l'input file pour permettre de sélectionner le même fichier plusieurs fois
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Supprimer un élément de la médiathèque
  const handleDeleteItem = (id: string) => {
    setMediaItems(mediaItems.filter(item => item.id !== id));
  };

  // Démarrer le drag d'un élément de la médiathèque
  const handleMediaItemDragStart = (e: React.DragEvent<HTMLDivElement>, item: MediaItem) => {
    e.dataTransfer.setData("itemType", item.type.startsWith("image/") ? "Image" : "Vidéo");
    e.dataTransfer.setData("mediaItemId", item.id);
    e.dataTransfer.setData("mediaItemUrl", item.url);
  };

  return (
    <div className={styles.mediaLibraryContainer}>
      {/* Bouton pour ouvrir/fermer la médiathèque */}
      <div 
        className={styles.mediaLibraryToggle}
        onClick={() => setIsLibraryOpen(!isLibraryOpen)}
      >
        {isLibraryOpen ? <FaFolderOpen size={20} /> : <FaFolder size={20} />} Médiathèque
      </div>
      
      {/* Contenu de la médiathèque */}
      {isLibraryOpen && (
        <div className={styles.mediaLibraryContent}>
          {/* Bouton d'upload */}
          <div className={styles.uploadButton} onClick={handleUploadClick}>
            <FaUpload size={16} /> Ajouter des fichiers
          </div>
          
          {/* Input file caché */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: "none" }}
            multiple
            accept="image/*,video/*"
          />
          
          {/* Liste des éléments de la médiathèque */}
          <div className={styles.mediaItemsList}>
            {mediaItems.length === 0 ? (
              <div className={styles.emptyLibrary}>
                Aucun fichier dans la médiathèque
              </div>
            ) : (
              mediaItems.map(item => (
                <div 
                  key={item.id}
                  className={styles.mediaItem}
                  draggable
                  onDragStart={(e) => handleMediaItemDragStart(e, item)}
                >
                  <div className={styles.mediaItemPreview}>
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.name} />
                    ) : (
                      getIconForType(item.type)
                    )}
                  </div>
                  <div className={styles.mediaItemInfo}>
                    <div className={styles.mediaItemName} title={item.name}>
                      {item.name.length > 15 ? `${item.name.substring(0, 12)}...` : item.name}
                    </div>
                    <button 
                      className={styles.deleteButton}
                      onClick={() => handleDeleteItem(item.id)}
                      title="Supprimer"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaLibrary;
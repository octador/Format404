// app/types/sheet.ts
export type SheetData = {
  id: string;
  title: string;
  items: DroppedItem[];
  order: number;
};

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

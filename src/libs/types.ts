export type Ratio = "16:9" | "9:16" | "1:1" | "4:3";

export type GalleryItem = {
  id: number;
  src: string;
  title: string;
  category: string;
  description?: string;
  year?: string;
  ratio: Ratio;
  resolution: string; // contoh: "1600x900"
};

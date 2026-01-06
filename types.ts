
export interface ServiceRow {
  id: string;
  serviceName: string; // Tên fallback
  serviceNameVi: string;
  serviceNameJa: string;
  originalPrice: number;
  campaign1: number | string;
  campaign2: number | string;
  isSaiGon: boolean;
  isCanTho: boolean;
  isHue: boolean;
  isHaNoi: boolean;
}
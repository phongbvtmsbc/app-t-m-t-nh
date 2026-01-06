import * as XLSX from 'xlsx';
import { ServiceRow } from '../types';

/**
 * Chuẩn hóa giá trị Boolean từ Excel.
 */
const isTrueValue = (val: any): boolean => {
  if (val === true || val === 'true' || val === 'TRUE' || val === 1 || val === '1' || val === 'yes' || val === 'YES' || val === '○') {
    return true;
  }
  return false;
};

/**
 * Xử lý giá tiền từ cell Excel.
 */
const parsePrice = (val: any): number | string => {
  if (val === undefined || val === null || val === '') return 'Không áp dụng';
  // Chuyển về chuỗi và lọc bỏ các ký tự không phải số/dấu chấm
  const cleaned = val.toString().replace(/[^0-9.-]+/g, "");
  const num = Number(cleaned);
  return (cleaned !== "" && !isNaN(num)) ? num : 'Không áp dụng';
};

export const parseExcelFile = async (file: File): Promise<ServiceRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const allRows: ServiceRow[] = json
          .map((item, index) => {
            const vnName = (item['Tên dịch vụ'] || item['Tên tiếng Việt'] || item['Tên VN'] || item['Service Name'] || '').toString().trim();
            const jpName = (item['施術名'] || item['Japanese Name'] || item['項目'] || '').toString().trim();
            const originalPrice = parsePrice(item['定価'] || item['Giá gốc']);
            
            return {
              id: `${index}-${Date.now()}`,
              serviceName: vnName || jpName || 'No Name',
              serviceNameVi: vnName,
              serviceNameJa: jpName,
              originalPrice: originalPrice as any, 
              campaign1: parsePrice(item['Khuyến mãi 1'] || item['Promo 1']),
              campaign2: parsePrice(item['Khuyến mãi 2'] || item['Promo 2']),
              isSaiGon: isTrueValue(item['Sài Gòn'] || item['SG']),
              isHue: isTrueValue(item['Huế'] || item['HUE']),
              isCanTho: isTrueValue(item['Cần Thơ'] || item['CT']),
              isHaNoi: isTrueValue(item['Hà Nội'] || item['HN']),
            };
          })
          .filter(row => {
            // Chỉ lọc bỏ những dòng không có tên và không có giá gốc
            const hasBasicData = (row.serviceNameVi !== '' || row.serviceNameJa !== '') && typeof row.originalPrice === 'number';
            return hasBasicData;
          });

        // Loại bỏ trùng lặp dựa trên tên và giá
        const uniqueRows: ServiceRow[] = [];
        const seenKeys = new Set<string>();

        for (const row of allRows) {
          const key = `${row.serviceNameVi}-${row.serviceNameJa}-${row.originalPrice}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            uniqueRows.push(row);
          }
        }

        resolve(uniqueRows);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
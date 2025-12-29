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
            const vnName = item['Tên dịch vụ'] || item['Tên tiếng Việt'] || item['Tên VN'] || '';
            const jpName = item['施術名'] || '';
            const originalPrice = parsePrice(item['定価'] || item['Giá gốc']);
            
            return {
              id: `${index}-${Date.now()}`,
              serviceName: (vnName || jpName).toString().trim(),
              originalPrice: originalPrice as any, 
              campaign1: parsePrice(item['Khuyến mãi 1']),
              campaign2: parsePrice(item['Khuyến mãi 2']),
              isSaiGon: isTrueValue(item['Sài Gòn']),
              isHue: isTrueValue(item['Huế']),
              isCanTho: isTrueValue(item['Cần Thơ']),
              isHaNoi: isTrueValue(item['Hà Nội']),
            };
          })
          .filter(row => {
            const hasBasicData = typeof row.originalPrice === 'number' && row.serviceName !== '';
            const isApplicableSomewhere = row.isSaiGon || row.isHue || row.isCanTho || row.isHaNoi;
            return hasBasicData && isApplicableSomewhere;
          });

        const uniqueRows: ServiceRow[] = [];
        const seenNames = new Set<string>();

        for (const row of allRows) {
          if (!seenNames.has(row.serviceName)) {
            seenNames.add(row.serviceName);
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
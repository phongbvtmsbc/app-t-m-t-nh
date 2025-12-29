import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calculator, 
  Search, 
  Plus, 
  Trash2, 
  Download, 
  Receipt,
  ArrowUp,
  X,
  FileSpreadsheet,
  Check,
  ShoppingCart
} from 'lucide-react';
import { parseExcelFile } from './services/excelParser';
import { ServiceRow } from './types';

// Utility for formatting VND currency
const formatVND = (value: number | string) => {
  if (value === 'Không áp dụng') return value;
  const num = Number(value);
  if (isNaN(num)) return value;
  return `${num.toLocaleString()} đ`;
};

const App: React.FC = () => {
  const [data, setData] = useState<ServiceRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<ServiceRow[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Monitor scroll for "Back to top" button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsedData = await parseExcelFile(file);
      setData(parsedData);
      setCart([]); // Reset cart when new data is loaded
    } catch (error) {
      alert("Lỗi khi đọc file Excel. Vui lòng kiểm tra lại định dạng tệp tin.");
    }
  };

  const filteredCatalog = useMemo(() => {
    if (!searchQuery) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(s => s.serviceName.toLowerCase().includes(q));
  }, [data, searchQuery]);

  const addToCart = (service: ServiceRow) => {
    if (cart.find(item => item.id === service.id)) return;
    setCart(prev => [...prev, service]);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  /**
   * FIX: Define clearCart exactly as requested
   */
  const clearCart = () => setCart([]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCardPrice = (service: ServiceRow, cardType: 'SG' | 'CT' | 'HUE' | 'HN') => {
    let isValid = false;
    let promoValue: number | string = 'Không áp dụng';

    switch (cardType) {
      case 'SG': isValid = service.isSaiGon; promoValue = service.campaign1; break;
      case 'HUE': isValid = service.isHue; promoValue = service.campaign1; break;
      case 'CT': isValid = service.isCanTho; promoValue = service.campaign2; break;
      case 'HN': isValid = service.isHaNoi; promoValue = service.campaign2; break;
    }

    if (!isValid) return { display: 'Không áp dụng', isPromo: false };
    if (typeof promoValue === 'number') return { display: promoValue.toString(), isPromo: true };
    return { display: service.originalPrice.toString(), isPromo: false };
  };

  const columnTotals = useMemo(() => {
    const totals = { 
      original: 0, 
      sg: 0, originalSg: 0,
      ct: 0, originalCt: 0,
      hue: 0, originalHue: 0,
      hn: 0, originalHn: 0 
    };

    cart.forEach(item => {
      const basePrice = Number(item.originalPrice) || 0;
      totals.original += basePrice;
      
      const regions: ('SG' | 'CT' | 'HUE' | 'HN')[] = ['SG', 'CT', 'HUE', 'HN'];
      regions.forEach(reg => {
        const p = getCardPrice(item, reg);
        if (p.display !== 'Không áp dụng') {
          const key = reg.toLowerCase() as 'sg' | 'ct' | 'hue' | 'hn';
          const originalKey = `original${reg.charAt(0) + reg.slice(1).toLowerCase()}` as 'originalSg' | 'originalCt' | 'originalHue' | 'originalHn';
          totals[key] += Number(p.display);
          totals[originalKey] += basePrice;
        }
      });
    });
    return totals;
  }, [cart]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-[100] shadow-sm">
        <div className="max-w-[1700px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg">
              <Calculator className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase">
              SBC <span className="text-indigo-600">Pricing</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-black text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95">
                <Download className="w-4 h-4" />
                NHẬP DỮ LIỆU EXCEL
              </div>
              <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>
      </header>

      <main className="max-w-[1700px] mx-auto w-full px-6 py-8 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <aside className="lg:col-span-3 lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)]">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 space-y-4">
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Search className="w-4 h-4 text-indigo-600" /> Tìm kiếm dịch vụ
                </h2>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Nhập tên..."
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-grow overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {filteredCatalog.length > 0 ? (
                  filteredCatalog.map(service => {
                    const inCart = cart.some(item => item.id === service.id);
                    return (
                      <div key={service.id} className={`p-3.5 rounded-2xl border transition-all ${inCart ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-indigo-100 hover:shadow-md'}`}>
                        <div className="mb-3">
                          <p className="text-sm font-bold text-slate-800 leading-snug mb-1">{service.serviceName}</p>
                          <p className="text-xs font-bold text-slate-400 tabular-nums">Gốc: {formatVND(service.originalPrice)}</p>
                        </div>
                        <button
                          disabled={inCart}
                          onClick={() => addToCart(service)}
                          className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${inCart ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-100'}`}
                        >
                          {inCart ? <><Check className="w-3.5 h-3.5" /> Đã thêm</> : <><Plus className="w-3.5 h-3.5" /> Thêm ngay</>}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-30 grayscale">
                    <FileSpreadsheet className="w-12 h-12 mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest leading-relaxed text-slate-400">Dữ liệu rỗng</p>
                  </div>
                )}
              </div>
            </div>
          </aside>

          <section className="lg:col-span-9 space-y-6">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col min-h-[calc(100vh-140px)]">
              
              <div className="p-7 border-b border-slate-100 bg-white sticky top-0 z-[70] flex items-center justify-between backdrop-blur-md bg-white/90">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-xl">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">BẢNG TẠM TÍNH</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5 italic">Pricing Consultation Worksheet</p>
                  </div>
                </div>
                {cart.length > 0 && (
                  <button 
                    onClick={clearCart}
                    className="px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-90 relative z-[80] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" /> XOÁ TOÀN BỘ
                  </button>
                )}
              </div>

              <div className="flex-grow overflow-x-auto">
                {cart.length > 0 ? (
                  <table className="w-full text-left border-collapse min-w-[1100px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-16">STT</th>
                        <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[25%]">Dịch vụ</th>
                        <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Giá gốc</th>
                        <th className="px-5 py-5 text-[10px] font-black text-indigo-600 uppercase tracking-widest text-center bg-indigo-100/30">Thẻ Sài Gòn</th>
                        <th className="px-5 py-5 text-[10px] font-black text-indigo-600 uppercase tracking-widest text-center">Thẻ Cần Thơ</th>
                        <th className="px-5 py-5 text-[10px] font-black text-indigo-600 uppercase tracking-widest text-center bg-indigo-100/30">Thẻ Huế</th>
                        <th className="px-5 py-5 text-[10px] font-black text-indigo-600 uppercase tracking-widest text-center">Thẻ Hà Nội</th>
                        <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-12">Xoá</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cart.map((item, index) => {
                        const sg = getCardPrice(item, 'SG');
                        const ct = getCardPrice(item, 'CT');
                        const hue = getCardPrice(item, 'HUE');
                        const hn = getCardPrice(item, 'HN');

                        return (
                          <tr key={item.id} className="hover:bg-indigo-50/20 transition-all group">
                            <td className="px-5 py-6 text-center text-xs font-black text-slate-300 tabular-nums">
                              {String(index + 1).padStart(2, '0')}
                            </td>
                            <td className="px-5 py-6">
                              <p className="text-sm font-black text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors">{item.serviceName}</p>
                            </td>
                            <td className="px-5 py-6 text-center text-xs font-bold text-slate-500 tabular-nums">
                              {formatVND(item.originalPrice)}
                            </td>
                            <td className="px-5 py-6 text-center tabular-nums bg-indigo-50/10">
                              <span className={`text-sm font-black tracking-tight ${sg.isPromo ? 'text-rose-600' : sg.display === 'Không áp dụng' ? 'text-slate-300 italic font-normal' : 'text-slate-800'}`}>
                                {formatVND(sg.display)}
                              </span>
                            </td>
                            <td className="px-5 py-6 text-center tabular-nums">
                              <span className={`text-sm font-black tracking-tight ${ct.isPromo ? 'text-rose-600' : ct.display === 'Không áp dụng' ? 'text-slate-300 italic font-normal' : 'text-slate-800'}`}>
                                {formatVND(ct.display)}
                              </span>
                            </td>
                            <td className="px-5 py-6 text-center tabular-nums bg-indigo-50/10">
                              <span className={`text-sm font-black tracking-tight ${hue.isPromo ? 'text-rose-600' : hue.display === 'Không áp dụng' ? 'text-slate-300 italic font-normal' : 'text-slate-800'}`}>
                                {formatVND(hue.display)}
                              </span>
                            </td>
                            <td className="px-5 py-6 text-center tabular-nums">
                              <span className={`text-sm font-black tracking-tight ${hn.isPromo ? 'text-rose-600' : hn.display === 'Không áp dụng' ? 'text-slate-300 italic font-normal' : 'text-slate-800'}`}>
                                {formatVND(hn.display)}
                              </span>
                            </td>
                            <td className="px-5 py-6 text-center">
                              <button 
                                onClick={() => removeFromCart(item.id)}
                                className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="sticky bottom-0 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
                      {/* Row: TOTAL */}
                      <tr className="bg-slate-900 text-white font-black border-t-4 border-indigo-600">
                        <td className="px-5 py-4 text-center text-[10px] uppercase tracking-widest border-r border-slate-700/50">TOTAL</td>
                        <td className="px-5 py-4 text-xs uppercase tracking-widest font-black">Tổng cộng báo giá</td>
                        <td className="px-5 py-4 text-center text-sm tabular-nums text-indigo-200">
                          {formatVND(columnTotals.original)}
                        </td>
                        <td className="px-5 py-4 text-center text-sm tabular-nums bg-indigo-800/20 border-l border-slate-700/50">
                          {formatVND(columnTotals.sg)}
                        </td>
                        <td className="px-5 py-4 text-center text-sm tabular-nums border-l border-slate-700/50">
                          {formatVND(columnTotals.ct)}
                        </td>
                        <td className="px-5 py-4 text-center text-sm tabular-nums bg-indigo-800/20 border-l border-slate-700/50">
                          {formatVND(columnTotals.hue)}
                        </td>
                        <td className="px-5 py-4 text-center text-sm tabular-nums border-l border-slate-700/50">
                          {formatVND(columnTotals.hn)}
                        </td>
                        <td className="px-5 py-4 bg-indigo-800/30"></td>
                      </tr>
                      {/* Row: SAVINGS */}
                      <tr className="bg-emerald-600 text-white font-black border-t border-emerald-500">
                        <td className="px-5 py-4 text-center text-[10px] uppercase tracking-widest border-r border-emerald-500/50">SAVE</td>
                        <td className="px-5 py-4 text-xs uppercase tracking-widest font-black">TIẾT KIỆM</td>
                        <td className="px-5 py-4 text-center text-sm tabular-nums text-emerald-200 opacity-50">—</td>
                        <td className="px-5 py-4 text-center text-sm tabular-nums bg-emerald-500/20 border-l border-emerald-500/50 text-emerald-300">
                          {formatVND(columnTotals.originalSg - columnTotals.sg)}
                        </td>
                        <td className="px-5 py-4 text-center text-sm tabular-nums border-l border-emerald-500/50 text-emerald-300">
                          {formatVND(columnTotals.originalCt - columnTotals.ct)}
                        </td>
                        <td className="px-5 py-4 text-center text-sm tabular-nums bg-emerald-500/20 border-l border-emerald-500/50 text-emerald-300">
                          {formatVND(columnTotals.originalHue - columnTotals.hue)}
                        </td>
                        <td className="px-5 py-4 text-center text-sm tabular-nums border-l border-emerald-500/50 text-emerald-300">
                          {formatVND(columnTotals.originalHn - columnTotals.hn)}
                        </td>
                        <td className="px-5 py-4 bg-emerald-500/30"></td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <div className="flex-grow flex flex-col items-center justify-center p-20 text-center text-slate-300 space-y-5">
                    <div className="p-10 rounded-full bg-slate-50 border-2 border-dashed border-slate-100 mb-2">
                      <ShoppingCart className="w-20 h-20 opacity-10" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-900 uppercase tracking-widest">Bảng tính chưa có dịch vụ</h4>
                      <p className="text-xs text-slate-400 font-medium max-w-[320px] mx-auto mt-2 leading-relaxed">
                        Hãy chọn dịch vụ từ danh sách bên trái để bắt đầu lập bảng báo giá tư vấn.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-10 right-10 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl hover:bg-indigo-600 transition-all z-[100] group animate-in slide-in-from-bottom-5"
        >
          <div className="flex flex-col items-center">
            <ArrowUp className="w-5 h-5 mb-1 group-hover:-translate-y-1 transition-transform" />
            <span className="text-[8px] font-black uppercase tracking-widest">Lên đầu</span>
          </div>
        </button>
      )}

      <div className="fixed top-0 right-0 -z-10 w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-slate-200/50 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2"></div>
    </div>
  );
};

export default App;
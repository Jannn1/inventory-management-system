import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Package,
  Database,
  Search,
  Plus,
  RefreshCw,
  Download,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
  ArrowLeft,
  Filter,
  MapPin,
  Laptop,
  Network,
  Keyboard,
  FileCode,
  Printer,
  Folder,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  MessageSquare,
  DollarSign,
  Copy,
  Tags,
  Smartphone,
  Headphones,
  HardDrive,
  Shield,
  Cpu,
  Eye,
  Minus,
  FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Szám formázása magyar forintként (pl. 385 000 Ft)
 */
function formatHUF(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 Ft';
  return new Intl.NumberFormat('hu-HU').format(Math.round(amount)) + ' Ft';
}

/**
 * Kategória ikon komponens dinamikus kiválasztással
 */
function CategoryIcon({ iconName, className = "w-4 h-4" }) {
  switch (iconName) {
    case 'Laptop': return <Laptop className={className} />;
    case 'Network': return <Network className={className} />;
    case 'Keyboard': return <Keyboard className={className} />;
    case 'FileCode': return <FileCode className={className} />;
    case 'Printer': return <Printer className={className} />;
    case 'Smartphone': return <Smartphone className={className} />;
    case 'Headphones': return <Headphones className={className} />;
    case 'HardDrive': return <HardDrive className={className} />;
    case 'Shield': return <Shield className={className} />;
    case 'Cpu': return <Cpu className={className} />;
    default: return <Folder className={className} />;
  }
}

/**
 * Kategória színstílus generáló
 */
function getCategoryBadgeClass(color) {
  switch (color) {
    case 'emerald':
      return 'bg-emerald-950/70 border-emerald-800/60 text-emerald-300';
    case 'cyan':
      return 'bg-cyan-950/70 border-cyan-800/60 text-cyan-300';
    case 'purple':
      return 'bg-purple-950/70 border-purple-800/60 text-purple-300';
    case 'indigo':
      return 'bg-indigo-950/70 border-indigo-800/60 text-indigo-300';
    case 'amber':
      return 'bg-amber-950/70 border-amber-800/60 text-amber-300';
    case 'rose':
      return 'bg-rose-950/70 border-rose-800/60 text-rose-300';
    case 'blue':
      return 'bg-blue-950/70 border-blue-800/60 text-blue-300';
    default:
      return 'bg-slate-800 border-slate-700 text-slate-300';
  }
}

function getCategoryColorHex(color) {
  switch (color) {
    case 'emerald': return '#10b981';
    case 'cyan': return '#06b6d4';
    case 'purple': return '#a855f7';
    case 'indigo': return '#6366f1';
    case 'amber': return '#f59e0b';
    case 'rose': return '#f43f5e';
    case 'blue': return '#3b82f6';
    default: return '#64748b';
  }
}

/**
 * Státusz badge komponens
 */
function StatusBadge({ status, quantity, minQuantity }) {
  if (status === 'out_of_stock' || quantity === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-950/70 border border-red-800/60 text-red-300">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        Kifogyott
      </span>
    );
  }
  if (status === 'low_stock' || quantity <= minQuantity) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-950/70 border border-amber-800/60 text-amber-300">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Kifogyóban
      </span>
    );
  }
  if (status === 'ordered') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-950/70 border border-blue-800/60 text-blue-300">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        Rendelés alatt
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-950/70 border border-emerald-800/60 text-emerald-300">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      Raktáron
    </span>
  );
}

const AVAILABLE_COLORS = [
  { id: 'emerald', label: 'Smaragdzöld', bg: 'bg-emerald-500' },
  { id: 'cyan', label: 'Ciánkék', bg: 'bg-cyan-500' },
  { id: 'indigo', label: 'Indigókék', bg: 'bg-indigo-500' },
  { id: 'purple', label: 'Lila', bg: 'bg-purple-500' },
  { id: 'amber', label: 'Borostyán', bg: 'bg-amber-500' },
  { id: 'rose', label: 'Rózsaszín', bg: 'bg-rose-500' },
];

const AVAILABLE_ICONS = [
  'Laptop',
  'Network',
  'Keyboard',
  'FileCode',
  'Printer',
  'Smartphone',
  'Headphones',
  'HardDrive',
  'Shield',
  'Cpu',
  'Folder',
];

export default function InventoryPage() {
  const [rawItems, setRawItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Szűrők & Keresés (Azonnali, memóriabeli kliensoldali szűrés!)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Modális ablakok állapota
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalFormData, setModalFormData] = useState({
    sku: '',
    name: '',
    category_id: 1,
    quantity: 1,
    min_quantity: 3,
    unit_price: 10000,
    location: 'Központi Raktár A/1',
    status: 'in_stock',
    notes: '',
  });
  const [savingItem, setSavingItem] = useState(false);
  const [modalError, setModalError] = useState('');

  // Kategória-kezelő Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catFormData, setCatFormData] = useState({
    name: '',
    color: 'indigo',
    icon: 'Folder',
    description: '',
  });
  const [savingCategory, setSavingCategory] = useState(false);
  const [catModalError, setCatModalError] = useState('');

  // Részletes Adatlap Modal
  const [inspectItem, setInspectItem] = useState(null);

  // Törlési és Reset megerősítések
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [copiedSku, setCopiedSku] = useState(null);

  // 1. Adatok és kategóriák lekérése a MySQL API-ból (egyszer a betöltéskor és módosításkor)
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const refreshData = useCallback(() => {
    setLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [listRes, statsRes] = await Promise.all([
          fetch('/api/inventory.php?action=list'),
          fetch('/api/inventory.php?action=stats'),
        ]);

        const listData = await listRes.json().catch(() => null);
        const statsData = await statsRes.json().catch(() => null);

        if (!isMounted) return;

        if (listRes.ok && listData && listData.success) {
          setRawItems(listData.items || []);
          if (Array.isArray(listData.categories) && listData.categories.length > 0) {
            setCategories(listData.categories);
          }
        } else {
          setError(listData?.message || 'Nem sikerült betölteni a raktár tételeket.');
        }

        if (statsRes.ok && statsData && statsData.success) {
          if (Array.isArray(statsData.categories)) setCategoryBreakdown(statsData.categories);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Adatbázis kapcsolódási hiba.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  // Értesítés automatikus elrejtése
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // =========================================================================
  // AZONNALI (0ms) MEMÓRIABELI SZŰRÉS ÉS RENDEZÉS USEMEMO-VAL
  // =========================================================================
  const filteredAndSortedItems = useMemo(() => {
    return rawItems
      .filter((item) => {
        // Keresőmező szűrés
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = item.name && item.name.toLowerCase().includes(q);
          const matchSku = item.sku && item.sku.toLowerCase().includes(q);
          const matchLoc = item.location && item.location.toLowerCase().includes(q);
          const matchNotes = item.notes && item.notes.toLowerCase().includes(q);
          const matchCat = item.category_name && item.category_name.toLowerCase().includes(q);
          if (!matchName && !matchSku && !matchLoc && !matchNotes && !matchCat) {
            return false;
          }
        }

        // Kategória szűrés
        if (selectedCategory !== null && item.category_id !== selectedCategory) {
          return false;
        }

        // Státusz szűrés
        if (selectedStatus !== 'all') {
          if (selectedStatus === 'low_stock') {
            const isLow = item.quantity <= item.min_quantity && item.quantity > 0;
            if (!isLow) return false;
          } else if (selectedStatus === 'out_of_stock') {
            if (item.quantity > 0) return false;
          } else if (selectedStatus === 'ordered') {
            if (item.status !== 'ordered') return false;
          } else if (selectedStatus === 'in_stock') {
            if (item.quantity <= item.min_quantity || item.status === 'ordered') return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (sortBy === 'quantity' || sortBy === 'unit_price' || sortBy === 'total_value') {
          valA = Number(valA) || 0;
          valB = Number(valB) || 0;
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }

        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
  }, [rawItems, searchQuery, selectedCategory, selectedStatus, sortBy, sortOrder]);

  // Dinamikus számított statisztikák
  const computedStats = useMemo(() => {
    let totalItems = rawItems.length;
    let totalQty = 0;
    let totalVal = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let ordered = 0;

    rawItems.forEach((it) => {
      const q = Number(it.quantity) || 0;
      const p = Number(it.unit_price) || 0;
      const min = Number(it.min_quantity) || 0;

      totalQty += q;
      totalVal += q * p;

      if (q === 0) {
        outOfStock++;
      } else if (q <= min) {
        lowStock++;
      }

      if (it.status === 'ordered') {
        ordered++;
      }
    });

    return {
      total_items: totalItems,
      total_quantity: totalQty,
      total_inventory_value: totalVal,
      low_stock_count: lowStock,
      out_of_stock_count: outOfStock,
      ordered_count: ordered,
    };
  }, [rawItems]);

  // Gyors készletmódosítás (+ / -) optimista frissítéssel
  const handleQuickAdjust = async (e, item, delta) => {
    e.stopPropagation();
    const newQty = Math.max(0, Number(item.quantity) + delta);
    if (newQty === item.quantity && delta < 0) return;

    // Optimista helyi frissítés (azonnali reakció 0 késleltetéssel!)
    setRawItems((prev) =>
      prev.map((it) => {
        if (it.id === item.id) {
          let updatedStatus = it.status;
          if (newQty === 0) updatedStatus = 'out_of_stock';
          else if (newQty <= it.min_quantity) updatedStatus = 'low_stock';
          else updatedStatus = 'in_stock';
          return {
            ...it,
            quantity: newQty,
            total_value: newQty * it.unit_price,
            status: updatedStatus,
          };
        }
        return it;
      })
    );

    try {
      await fetch('/api/inventory.php?action=adjust_stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, delta }),
      });
    } catch {
      // Hiba esetén újratöltjük a tényleges szerver állapotot
      refreshData();
    }
  };

  // Új tétel gomb kattintás
  const handleOpenCreate = () => {
    setEditingItem(null);
    setModalFormData({
      sku: '',
      name: '',
      category_id: categories[0]?.id || 1,
      quantity: 5,
      min_quantity: 2,
      unit_price: 25000,
      location: 'Központi Raktár A/1',
      status: 'in_stock',
      notes: '',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  // Szerkesztés gomb kattintás
  const handleOpenEdit = (item, e) => {
    if (e) e.stopPropagation();
    setEditingItem(item);
    setModalFormData({
      sku: item.sku,
      name: item.name,
      category_id: item.category_id,
      quantity: item.quantity,
      min_quantity: item.min_quantity,
      unit_price: item.unit_price,
      location: item.location || '',
      status: item.status,
      notes: item.notes || '',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  // Tétel mentése (Create vagy Update)
  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!modalFormData.sku.trim() || !modalFormData.name.trim()) {
      setModalError('A cikkszám (SKU) és a megnevezés megadása kötelező!');
      return;
    }

    setSavingItem(true);
    setModalError('');

    try {
      const action = editingItem ? 'update' : 'create';
      const payload = editingItem
        ? { id: editingItem.id, ...modalFormData }
        : modalFormData;

      const res = await fetch(`/api/inventory.php?action=${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success) {
        setIsModalOpen(false);
        setSuccessMsg(editingItem ? 'Tétel sikeresen frissítve!' : 'Új tétel sikeresen felvéve a raktárba!');
        refreshData();
      } else {
        setModalError(data?.message || 'Hiba történt a mentés során.');
      }
    } catch {
      setModalError('Nem sikerült kapcsolatot létesíteni az adatbázissal.');
    } finally {
      setSavingItem(false);
    }
  };

  // Tétel törlése
  const handleDeleteItem = async () => {
    if (!deleteConfirmItem) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/inventory.php?action=delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteConfirmItem.id }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.success) {
        setDeleteConfirmItem(null);
        setSuccessMsg('A tétel sikeresen törölve lett a MySQL adatbázisból!');
        refreshData();
      } else {
        alert(data?.message || 'Nem sikerült törölni a tételt.');
      }
    } catch {
      alert('Hálózati hiba a törlés során.');
    } finally {
      setDeleting(false);
    }
  };

  // Kategória-kezelő: Kategória Mentése
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catFormData.name.trim()) {
      setCatModalError('A kategória nevének megadása kötelező!');
      return;
    }

    setSavingCategory(true);
    setCatModalError('');

    try {
      const action = editingCategory ? 'update_category' : 'create_category';
      const payload = editingCategory
        ? { id: editingCategory.id, ...catFormData }
        : catFormData;

      const res = await fetch(`/api/inventory.php?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success) {
        if (Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
        setSuccessMsg(editingCategory ? 'Kategória sikeresen frissítve!' : 'Új kategória sikeresen létrehozva!');
        setEditingCategory(null);
        setCatFormData({ name: '', color: 'indigo', icon: 'Folder', description: '' });
        refreshData();
      } else {
        setCatModalError(data?.message || 'Hiba történt a kategória mentésekor.');
      }
    } catch {
      setCatModalError('Hálózati hiba a mentés során.');
    } finally {
      setSavingCategory(false);
    }
  };

  // Kategória törlése
  const handleDeleteCategory = async (catId) => {
    if (!confirm('Biztosan törölni szeretnéd ezt a kategóriát?')) return;
    try {
      const res = await fetch('/api/inventory.php?action=delete_category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: catId }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.success) {
        if (Array.isArray(data.categories)) setCategories(data.categories);
        setSuccessMsg('A kategória sikeresen törölve!');
        if (selectedCategory === catId) setSelectedCategory(null);
        refreshData();
      } else {
        alert(data?.message || 'Nem sikerült törölni a kategóriát.');
      }
    } catch {
      alert('Hálózati hiba a törlés során.');
    }
  };

  // Mintaadatok alaphelyzetbe állítása (Reset Demo)
  const handleResetDemo = async () => {
    setResetting(true);
    try {
      const res = await fetch('/api/inventory.php?action=reset_demo', {
        method: 'POST',
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.success) {
        setIsResetConfirmOpen(false);
        setSuccessMsg('A mintaadatok sikeresen visszaálltak az eredeti állapotra!');
        refreshData();
      } else {
        alert(data?.message || 'Nem sikerült visszaállítani az adatokat.');
      }
    } catch {
      alert('Hálózati hiba a mintaadatok visszaállítása során.');
    } finally {
      setResetting(false);
    }
  };

  // Cikkszám másolása a vágólapra
  const handleCopySku = (sku, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  // Rendezési irány és oszlop váltása
  const handleSortChange = (col) => {
    if (sortBy === col) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortOrder('asc');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200 print:bg-white print:text-black">
      {/* 1. FEJLÉC (Nyomtatáskor rejtve) */}
      <header className="sticky top-0 z-30 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Bal oldal: Vissza & Cím */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Vissza a portfólió főoldalára"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Adatbázis Alapú Nyilvántartó Rendszer
                  </h1>
                  <span className="hidden lg:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-[11px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    MySQL Kapcsolat Aktív
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Full-stack relációs vállalatirányítási modul (PHP 8 PDO & MySQL)
                </p>
              </div>
            </div>
          </div>

          {/* Jobb oldal: Fő műveleti gombok */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            {/* Új tétel rögzítése */}
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Új tétel</span>
            </button>

            {/* Kategóriák Kezelése Gomb */}
            <button
              onClick={() => {
                setEditingCategory(null);
                setCatFormData({ name: '', color: 'indigo', icon: 'Folder', description: '' });
                setCatModalError('');
                setIsCategoryModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/60 text-purple-300 hover:text-white text-xs sm:text-sm font-medium transition-all cursor-pointer"
              title="Kategóriák hozzáadása, szerkesztése és törlése"
            >
              <Tags className="w-4 h-4 text-purple-400" />
              <span>Kategóriák</span>
            </button>

            {/* CSV Exportálás */}
            <a
              href="/api/inventory.php?action=export_csv"
              download
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white text-xs sm:text-sm font-medium transition-all cursor-pointer"
              title="Raktárkészlet exportálása Excel-kompatibilis CSV fájlba"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">CSV</span>
            </a>

            {/* Nyomtatás / PDF Leltárív */}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white text-xs sm:text-sm font-medium transition-all cursor-pointer"
              title="Céges leltárív nyomtatása / mentése PDF-ként"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span className="hidden md:inline">Nyomtatás</span>
            </button>

            {/* Demo adatok visszaállítása */}
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-400 hover:text-amber-300 text-xs sm:text-sm font-medium transition-all cursor-pointer"
              title="Mintaadatok alaphelyzetbe állítása"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden lg:inline">Reset Demo</span>
            </button>

            {/* Frissítés */}
            <button
              onClick={refreshData}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              title="Adatok újratöltése a MySQL szerverről"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>

            {/* Ugrás a Chatre */}
            <Link
              to="/chat"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 transition-colors"
              title="Titkos Chat megnyitása"
            >
              <MessageSquare className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* NYOMTATÁSI FEJLÉC (Csak nyomtatáskor látszik) */}
      <div className="hidden print:block p-6 border-b border-black mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-black">Hivatalos Raktári Leltárív</h1>
            <p className="text-sm text-gray-600">Ár János Dániel – Adatbázis Alapú Nyilvántartó Rendszer</p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>Generálva: {new Date().toLocaleString('hu-HU')}</p>
            <p className="font-bold text-black text-sm mt-1">Összérték: {formatHUF(computedStats.total_inventory_value)}</p>
          </div>
        </div>
      </div>

      {/* SIKER ÉS HIBA SÁVOK */}
      {successMsg && (
        <div className="bg-emerald-950/80 border-b border-emerald-800/60 text-emerald-300 px-4 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 animate-fadeIn print:hidden">
          <Check className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-950/80 border-b border-red-800/60 text-red-300 px-4 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 print:hidden">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
          <button onClick={refreshData} className="underline ml-2 hover:text-white">Újrapróbálkozás</button>
        </div>
      )}

      {/* TARTALMI RÉSZ */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* 2. KPI MŰSZERFAL KÁRTYÁK (Nyomtatáskor rejtve) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
          {/* 1. Összes Cikk */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Nyilvántartott Tételek
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {computedStats.total_items} típus
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="text-emerald-400 font-semibold">{computedStats.total_quantity} db</span> eszköz és cikk a raktárban
            </p>
          </div>

          {/* 2. Raktárkészlet Összértéke */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Raktárkészlet Összértéke
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight">
              {formatHUF(computedStats.total_inventory_value)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Valós idejű beszerzési összérték
            </p>
          </div>

          {/* 3. Készlethiány és Riasztások */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Készlethiány / Riasztás
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-amber-400 tracking-tight">
                {computedStats.low_stock_count + computedStats.out_of_stock_count} tétel
              </span>
              {computedStats.out_of_stock_count > 0 && (
                <span className="text-xs font-semibold text-red-400">
                  ({computedStats.out_of_stock_count} kifogyott)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {computedStats.low_stock_count + computedStats.out_of_stock_count > 0
                ? 'Utánrendelést igénylő eszközök'
                : 'Minden eszköz biztonsági készlet felett'}
            </p>
          </div>

          {/* 4. Kategóriák Kezelése */}
          <div
            onClick={() => {
              setEditingCategory(null);
              setCatFormData({ name: '', color: 'indigo', icon: 'Folder', description: '' });
              setCatModalError('');
              setIsCategoryModalOpen(true);
            }}
            className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-purple-500/50 cursor-pointer transition-all"
            title="Kattints a kategóriák kezeléséhez!"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Kategóriák
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <Tags className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-purple-400 tracking-tight">
              {categories.length} kategória
            </div>
            <p className="text-xs text-purple-300/80 mt-1 flex items-center gap-1">
              <span>Kattints a kategóriák szerkesztéséhez</span>
              <span className="text-purple-400">→</span>
            </p>
          </div>
        </section>

        {/* 3. VIZUÁLIS ÉRTÉKMEGOSZLÁSI DIAGRAM (Nyomtatáskor rejtve) */}
        {categoryBreakdown.length > 0 && computedStats.total_inventory_value > 0 && (
          <section className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 print:hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Raktári Tőkeérték Megoszlása Kategóriánként</span>
              </span>
              <span className="text-slate-500 hidden sm:inline">
                Kattints egy kategóriára a listázáshoz
              </span>
            </div>

            {/* Sávdiagram (Stacked Progress Bar) */}
            <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden flex shadow-inner">
              {categoryBreakdown.map((cat) => {
                const val = Number(cat.total_value) || 0;
                const percent = (val / computedStats.total_inventory_value) * 100;
                if (percent < 0.5) return null;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                    style={{
                      width: `${percent}%`,
                      backgroundColor: getCategoryColorHex(cat.color),
                    }}
                    className="h-full hover:opacity-85 transition-opacity cursor-pointer relative group"
                    title={`${cat.name}: ${formatHUF(val)} (${percent.toFixed(1)}%)`}
                  />
                );
              })}
            </div>

            {/* Kategória feliratok és arányok */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              {categoryBreakdown.map((cat) => {
                const val = Number(cat.total_value) || 0;
                const percent = (val / computedStats.total_inventory_value) * 100;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? `${getCategoryBadgeClass(cat.color)} font-semibold ring-1 ring-white/20`
                        : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getCategoryColorHex(cat.color) }}
                    />
                    <span>{cat.name}</span>
                    <span className="text-[10px] opacity-70">
                      ({percent.toFixed(0)}% • {formatHUF(val)})
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* 4. KERESÉS, SZŰRÉS ÉS KATEGÓRIÁK (Nyomtatáskor rejtve) */}
        <section className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 print:hidden">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Keresőmező */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Azonnali keresés névre, cikkszámra (SKU), raktárhelyre..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Státusz szűrő gombok (AZONNALI 0ms VÁLTÁS!) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs text-slate-500 shrink-0 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" />
                Státusz:
              </span>
              {[
                { id: 'all', label: 'Mind' },
                { id: 'in_stock', label: 'Raktáron' },
                { id: 'low_stock', label: 'Kifogyóban' },
                { id: 'out_of_stock', label: 'Kifogyott' },
                { id: 'ordered', label: 'Rendelés alatt' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStatus(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
                    selectedStatus === st.id
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Kategória gombok sávja */}
          <div className="flex items-center justify-between gap-2 border-t border-slate-800/70 pt-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs flex-1">
              <span className="text-slate-500 shrink-0 font-medium mr-1">Kategória:</span>
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 rounded-lg transition-all shrink-0 cursor-pointer ${
                  selectedCategory === null
                    ? 'bg-slate-700 text-white font-semibold'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Összes ({rawItems.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat.id
                      ? `${getCategoryBadgeClass(cat.color)} font-semibold border`
                      : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <CategoryIcon iconName={cat.icon} className="w-3.5 h-3.5" />
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* Kategóriák Módosítása / Új Gomb */}
            <button
              onClick={() => {
                setEditingCategory(null);
                setCatFormData({ name: '', color: 'indigo', icon: 'Folder', description: '' });
                setCatModalError('');
                setIsCategoryModalOpen(true);
              }}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold px-2.5 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-950/70 border border-purple-800/40 shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Kategóriák kezelése</span>
            </button>
          </div>
        </section>

        {/* 5. RAKTÁR TÁBLÁZAT */}
        <section className="rounded-2xl bg-slate-900/80 border border-slate-800/90 overflow-hidden shadow-xl shadow-black/40 print:bg-white print:border-black print:shadow-none">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Raktári Tételek Listája</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {filteredAndSortedItems.length} találat
              </span>
            </div>

            <div className="text-xs text-slate-500 hidden sm:block">
              Gyors készletmódosítás a <span className="text-indigo-400 font-mono font-bold">+</span> / <span className="text-indigo-400 font-mono font-bold">-</span> gombokkal
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
              <span className="text-sm font-medium">Tételek betöltése a MySQL adatbázisból...</span>
            </div>
          ) : filteredAndSortedItems.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Package className="w-14 h-14 mb-3 stroke-1 text-slate-600" />
              <p className="text-base font-medium text-slate-300">Nem található a feltételeknek megfelelő raktári tétel.</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Próbáld meg törölni a keresést vagy a szűrőket!
              </p>
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                    setSelectedStatus('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  Szűrők törlése
                </button>
                <button
                  onClick={handleOpenCreate}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  Új tétel rögzítése
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm print:text-xs">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider font-semibold print:bg-gray-100 print:text-black">
                  <tr>
                    <th
                      onClick={() => handleSortChange('sku')}
                      className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Cikkszám (SKU)</span>
                        {sortBy === 'sku' && (sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSortChange('name')}
                      className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Megnevezés</span>
                        {sortBy === 'name' && (sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSortChange('category_name')}
                      className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                    >
                      <span>Kategória</span>
                    </th>
                    <th
                      onClick={() => handleSortChange('quantity')}
                      className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Készlet (db)</span>
                        {sortBy === 'quantity' && (sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSortChange('unit_price')}
                      className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors text-right"
                    >
                      <div className="flex items-center gap-1.5 justify-end">
                        <span>Egységár</span>
                        {sortBy === 'unit_price' && (sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                      </div>
                    </th>
                    <th className="py-3.5 px-4 text-right hidden md:table-cell">
                      <span>Összérték</span>
                    </th>
                    <th className="py-3.5 px-4 hidden lg:table-cell">
                      <span>Raktárhely</span>
                    </th>
                    <th className="py-3.5 px-4 text-center">
                      <span>Státusz</span>
                    </th>
                    <th className="py-3.5 px-4 text-right print:hidden">
                      <span>Műveletek</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-gray-300">
                  {filteredAndSortedItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setInspectItem(item)}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer print:hover:bg-transparent"
                    >
                      {/* Cikkszám */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={(e) => handleCopySku(item.sku, e)}
                          className="font-mono text-xs font-semibold text-slate-300 hover:text-indigo-400 bg-slate-950/80 px-2 py-1 rounded-md border border-slate-800/90 inline-flex items-center gap-1 cursor-pointer transition-colors print:bg-transparent print:border-none print:text-black"
                          title="Cikkszám másolása"
                        >
                          <span>{item.sku}</span>
                          {copiedSku === item.sku ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-600 group-hover:text-slate-400 print:hidden" />
                          )}
                        </button>
                      </td>

                      {/* Megnevezés & leírás */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-white group-hover:text-indigo-200 transition-colors print:text-black">
                          {item.name}
                        </div>
                        {item.notes && (
                          <div className="text-[11px] text-slate-500 truncate mt-0.5 print:text-gray-600" title={item.notes}>
                            {item.notes}
                          </div>
                        )}
                      </td>

                      {/* Kategória */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium border ${getCategoryBadgeClass(item.category_color)} print:border-black print:text-black`}>
                          <CategoryIcon iconName={item.category_icon} className="w-3 h-3" />
                          <span>{item.category_name}</span>
                        </span>
                      </td>

                      {/* Készlet gyorsmódosítókkal (+ / -) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {/* Gyors csökkentő gomb */}
                          <button
                            onClick={(e) => handleQuickAdjust(e, item, -1)}
                            disabled={item.quantity <= 0}
                            className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer print:hidden"
                            title="Készlet csökkentése 1-gyel"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <div className="min-w-[48px] text-center">
                            <span className={`font-bold text-sm ${item.quantity === 0 ? 'text-red-400' : item.quantity <= item.min_quantity ? 'text-amber-400' : 'text-slate-200'} print:text-black`}>
                              {item.quantity} db
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              (min. {item.min_quantity})
                            </span>
                          </div>

                          {/* Gyors növelő gomb */}
                          <button
                            onClick={(e) => handleQuickAdjust(e, item, +1)}
                            className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer print:hidden"
                            title="Készlet növelése 1-gyel"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Készletszint folyamatjelző csík */}
                        <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden print:hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              item.quantity === 0
                                ? 'bg-red-500 w-0'
                                : item.quantity <= item.min_quantity
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{
                              width: `${Math.min(100, Math.max(10, (item.quantity / (item.min_quantity * 2)) * 100))}%`,
                            }}
                          />
                        </div>
                      </td>

                      {/* Egységár */}
                      <td className="py-3.5 px-4 text-right font-medium text-slate-300 whitespace-nowrap print:text-black">
                        {formatHUF(item.unit_price)}
                      </td>

                      {/* Összérték */}
                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-400 whitespace-nowrap hidden md:table-cell print:text-black">
                        {formatHUF(item.total_value)}
                      </td>

                      {/* Raktárhely */}
                      <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap hidden lg:table-cell print:text-black">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 print:hidden" />
                          <span>{item.location || 'Főraktár'}</span>
                        </span>
                      </td>

                      {/* Státusz */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <StatusBadge
                          status={item.status}
                          quantity={item.quantity}
                          minQuantity={item.min_quantity}
                        />
                      </td>

                      {/* Műveletek (Nyomtatáskor rejtve) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap print:hidden">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectItem(item);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                            title="Részletes adatlap megtekintése"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleOpenEdit(item, e)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-all cursor-pointer"
                            title="Tétel adatainak szerkesztése"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmItem(item);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white transition-all cursor-pointer"
                            title="Tétel törlése a MySQL adatbázisból"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* =========================================================================
          MODAL 1: ÚJ TÉTEL FELVÉTELE VAGY SZERKESZTÉSE
      ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-7 relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  {editingItem ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {editingItem ? 'Tétel Adatainak Módosítása' : 'Új Raktári Tétel Rögzítése'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    A változtatások azonnal a MySQL adatbázisba mentődnek
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveItem} className="mt-5 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Cikkszám (SKU) */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Cikkszám (SKU) *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalFormData.sku}
                    onChange={(e) => setModalFormData({ ...modalFormData, sku: e.target.value.toUpperCase() })}
                    placeholder="pl. IT-DELL-5530"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Kategória */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Kategória *
                  </label>
                  <select
                    value={modalFormData.category_id}
                    onChange={(e) => setModalFormData({ ...modalFormData, category_id: parseInt(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Megnevezés */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Eszköz / Cikk Megnevezése *
                </label>
                <input
                  type="text"
                  required
                  value={modalFormData.name}
                  onChange={(e) => setModalFormData({ ...modalFormData, name: e.target.value })}
                  placeholder="pl. Dell Latitude 5530 i7 Laptop"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Jelenlegi Mennyiség */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Készlet (db) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={modalFormData.quantity}
                    onChange={(e) => setModalFormData({ ...modalFormData, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Minimum Készlet */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Min. Készlet *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={modalFormData.min_quantity}
                    onChange={(e) => setModalFormData({ ...modalFormData, min_quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Egységár */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Egységár (Ft) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={modalFormData.unit_price}
                    onChange={(e) => setModalFormData({ ...modalFormData, unit_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Raktári helyszín */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Raktári Helyszín
                  </label>
                  <input
                    type="text"
                    value={modalFormData.location}
                    onChange={(e) => setModalFormData({ ...modalFormData, location: e.target.value })}
                    placeholder="pl. Központi Raktár A/1"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Státusz */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Státusz
                  </label>
                  <select
                    value={modalFormData.status}
                    onChange={(e) => setModalFormData({ ...modalFormData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="in_stock">Raktáron (Megfelelő szint)</option>
                    <option value="low_stock">Kifogyóban (Minimális alatt)</option>
                    <option value="out_of_stock">Kifogyott (0 db)</option>
                    <option value="ordered">Rendelés alatt</option>
                  </select>
                </div>
              </div>

              {/* Megjegyzés / specifikáció */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Megjegyzések & Műszaki Paraméterek
                </label>
                <textarea
                  rows="2"
                  value={modalFormData.notes}
                  onChange={(e) => setModalFormData({ ...modalFormData, notes: e.target.value })}
                  placeholder="pl. Processzor, memória, garancia, egyéb információk..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs sm:text-sm"
                />
              </div>

              {/* Gombok */}
              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  disabled={savingItem}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingItem && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{editingItem ? 'Változtatások Mentése' : 'Tétel Rögzítése'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: KATEGÓRIÁK KEZELÉSE (HOZZÁADÁS / MÓDOSÍTÁS / TÖRLÉS)
      ========================================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-7 relative overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Tags className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Kategóriák Kezelése & Testreszabása
                  </h3>
                  <p className="text-xs text-slate-400">
                    Új kategóriák rögzítése, színek, ikonok módosítása és törlés
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {catModalError && (
              <div className="mt-4 p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs flex items-center gap-2 shrink-0">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{catModalError}</span>
              </div>
            )}

            <div className="overflow-y-auto flex-1 my-4 space-y-6 pr-1">
              {/* 1. Kategória Űrlap (Hozzáadás vagy Szerkesztés) */}
              <form onSubmit={handleSaveCategory} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-purple-400" />
                    <span>{editingCategory ? 'Kategória Szerkesztése' : 'Új Kategória Hozzáadása'}</span>
                  </h4>
                  {editingCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(null);
                        setCatFormData({ name: '', color: 'indigo', icon: 'Folder', description: '' });
                      }}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Mégse
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">
                      Kategória Neve *
                    </label>
                    <input
                      type="text"
                      required
                      value={catFormData.name}
                      onChange={(e) => setCatFormData({ ...catFormData, name: e.target.value })}
                      placeholder="pl. Okoseszközök & Tabletek"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">
                      Rövid Leírás
                    </label>
                    <input
                      type="text"
                      value={catFormData.description}
                      onChange={(e) => setCatFormData({ ...catFormData, description: e.target.value })}
                      placeholder="pl. Hordozható teszteszközök és okosórák"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Színválasztó paletta */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1 text-xs">
                    Vizuális Színjelölő:
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {AVAILABLE_COLORS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCatFormData({ ...catFormData, color: c.id })}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          catFormData.color === c.id
                            ? `${getCategoryBadgeClass(c.id)} ring-2 ring-purple-500/50`
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${c.bg}`} />
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ikonválasztó */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1 text-xs">
                    Kategória Ikonja:
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {AVAILABLE_ICONS.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setCatFormData({ ...catFormData, icon: ic })}
                        className={`p-2 rounded-lg border transition-all cursor-pointer ${
                          catFormData.icon === ic
                            ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                        title={ic}
                      >
                        <CategoryIcon iconName={ic} className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingCategory}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-semibold transition-all shadow-md shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {savingCategory && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingCategory ? 'Kategória Módosítása' : 'Kategória Létrehozása'}</span>
                  </button>
                </div>
              </form>

              {/* 2. Létező Kategóriák Listája */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                  Létező Kategóriák ({categories.length})
                </h4>
                <div className="divide-y divide-slate-800/80 rounded-2xl bg-slate-950/50 border border-slate-800/80 overflow-hidden">
                  {categories.map((cat) => {
                    const itemCount = rawItems.filter((i) => i.category_id === cat.id).length;
                    return (
                      <div
                        key={cat.id}
                        className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-900/60 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${getCategoryBadgeClass(cat.color)}`}>
                            <CategoryIcon iconName={cat.icon} className="w-3.5 h-3.5" />
                            <span>{cat.name}</span>
                          </span>
                          <span className="text-xs text-slate-400">
                            {itemCount} db tétel tartozik hozzá
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategory(cat);
                              setCatFormData({
                                name: cat.name,
                                color: cat.color || 'indigo',
                                icon: cat.icon || 'Folder',
                                description: cat.description || '',
                              });
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Kategória adatainak szerkesztése"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title={
                              itemCount > 0
                                ? 'Nem törölhető, mert még tartoznak hozzá tételek'
                                : 'Kategória törlése'
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Bezárás
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: RÉSZLETES ADATLAP (ASSET DOSSIER)
      ========================================================================= */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-7 relative overflow-hidden">
            {/* Fejléc */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Eszköz Részletes Adatlapja
                  </h3>
                  <p className="text-xs text-slate-400">
                    Azonosító: #{inspectItem.id} • Raktári tétel profil
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tartalom */}
            <div className="py-4 space-y-4 text-xs sm:text-sm">
              {/* Cikkszám és Státusz */}
              <div className="flex items-center justify-between bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Cikkszám (SKU)</span>
                  <span className="font-mono text-base font-bold text-white tracking-wide">{inspectItem.sku}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleCopySku(inspectItem.sku, e)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Cikkszám másolása"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <StatusBadge
                    status={inspectItem.status}
                    quantity={inspectItem.quantity}
                    minQuantity={inspectItem.min_quantity}
                  />
                </div>
              </div>

              {/* Megnevezés és Kategória */}
              <div>
                <span className="text-xs text-slate-400 block mb-1">Megnevezés</span>
                <p className="text-base font-bold text-white">{inspectItem.name}</p>
                <div className="mt-1.5">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium border ${getCategoryBadgeClass(inspectItem.category_color)}`}>
                    <CategoryIcon iconName={inspectItem.category_icon} className="w-3.5 h-3.5" />
                    <span>{inspectItem.category_name}</span>
                  </span>
                </div>
              </div>

              {/* Pénzügyi és Készlet Mutatók */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[11px] text-slate-500 block">Jelenlegi Készlet</span>
                  <span className="text-lg font-bold text-white">{inspectItem.quantity} db</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Minimális szint: {inspectItem.min_quantity} db</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[11px] text-slate-500 block">Beszerzési Egységár</span>
                  <span className="text-lg font-bold text-slate-200">{formatHUF(inspectItem.unit_price)}</span>
                  <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">
                    Összérték: {formatHUF(inspectItem.quantity * inspectItem.unit_price)}
                  </span>
                </div>
              </div>

              {/* Helyszín */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Raktári Elhelyezkedés</span>
                  <span className="font-medium text-white">{inspectItem.location || 'Főraktár'}</span>
                </div>
              </div>

              {/* Műszaki megjegyzések */}
              {inspectItem.notes && (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold mb-1">Műszaki Paraméterek & Megjegyzések</span>
                  <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">{inspectItem.notes}</p>
                </div>
              )}

              {/* Időbélyegek */}
              <div className="text-[10px] text-slate-500 pt-1 flex justify-between border-t border-slate-800">
                <span>Létrehozva: {inspectItem.created_at || '–'}</span>
                <span>Módosítva: {inspectItem.updated_at || '–'}</span>
              </div>
            </div>

            {/* Műveletek */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const it = inspectItem;
                  setInspectItem(null);
                  handleOpenEdit(it);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Adatok Módosítása</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors cursor-pointer"
              >
                Bezárás
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: TÖRLÉS MEGERŐSÍTÉSE
      ========================================================================= */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-950/80 border border-red-800 text-red-400 mx-auto flex items-center justify-center mb-4 shadow-lg shadow-red-950/50">
              <Trash2 className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-white">Biztosan törölni szeretnéd?</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              A(z) <span className="font-semibold text-white">„{deleteConfirmItem.name}”</span> (<span className="font-mono text-indigo-400">{deleteConfirmItem.sku}</span>) tétel véglegesen törlődik a MySQL adatbázisból.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Mégse
              </button>
              <button
                type="button"
                onClick={handleDeleteItem}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-red-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deleting && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>Törlés Véglegesítése</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: MINTAADATOK RESET MEGERŐSÍTÉSE
      ========================================================================= */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border border-amber-800 text-amber-400 mx-auto flex items-center justify-center mb-4 shadow-lg shadow-amber-950/50">
              <RotateCcw className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-white">Mintaadatok Visszaállítása</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              Ez a művelet újratelepíti az eredeti gazdag informatikai demó eszközöket és kategóriákat a MySQL adatbázisban. Hasznos, ha tesztelés után tiszta állapotra szeretnéd visszaállítani a raktárt.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Mégse
              </button>
              <button
                type="button"
                onClick={handleResetDemo}
                disabled={resetting}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-amber-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {resetting && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>Visszaállítás Most</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

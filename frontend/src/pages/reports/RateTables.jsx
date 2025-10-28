import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, TrendingUp, DollarSign, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';

const RateTables = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('gold');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [goldTable, setGoldTable] = useState(null);
  const [silverTable, setSilverTable] = useState(null);
  const [currentRates, setCurrentRates] = useState(null);
  const [editingTable, setEditingTable] = useState(null);

  const { isDark } = useTheme();

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const canSeeFormulas = isAdmin || isManager;
  const canEdit = isAdmin;
  
  const activeTable = activeTab === 'gold' ? goldTable : silverTable;

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await api.get('/rate-tables/all');
      
      if (response.data.success) {
        setGoldTable(response.data.data.gold);
        setSilverTable(response.data.data.silver);
        setCurrentRates(response.data.data.currentRates);
      }
    } catch (error) {
      console.error('Error fetching rate tables:', error);
      toast.error(t('rateTable.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('rateTableUpdated', (data) => {
      if (data.metalType === 'gold') {
        setGoldTable({
          table: data.table,
          calculatedValues: data.calculatedValues
        });
      } else {
        setSilverTable({
          table: data.table,
          calculatedValues: data.calculatedValues
        });
      }
      toast.success(`${data.metalType.charAt(0).toUpperCase() + data.metalType.slice(1)} ${t('rateTable.success.tableUpdated')}`);
    });

    socket.on('ratesUpdated', (data) => {
      setCurrentRates({
        goldBuy: data.goldBuy,
        goldSell: data.goldSell,
        silverBuy: data.silverBuy,
        silverSell: data.silverSell
      });
      fetchTables();
    });

    return () => {
      socket.off('rateTableUpdated');
      socket.off('ratesUpdated');
    };
  }, [socket, t]);

  const enterEditMode = () => {
    if (!canEdit) return;
    const table = activeTab === 'gold' ? goldTable : silverTable;
    let tableToEdit = JSON.parse(JSON.stringify(table.table));
    
    if (tableToEdit.rows.length === 0 && tableToEdit.columns.length === 0) {
      tableToEdit.rows = [{
        rowIndex: 0,
        title: 'Row 1'
      }];
      
      tableToEdit.columns = [{
        colIndex: 0,
        title: 'Column 1',
        roundingEnabled: false,
        roundDirection: 'low',
        roundingType: 'decimals'
      }];
      
      tableToEdit.cells = [{
        rowIndex: 0,
        colIndex: 0,
        useRate: 'buying',
        percentage: 100
      }];
    }
    
    setEditingTable(tableToEdit);
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditingTable(null);
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      
      if (!editingTable.valuePerGram || editingTable.valuePerGram <= 0) {
        toast.error(t('rateTable.error.valueGreaterThanZero'));
        return;
      }

      const invalidCells = editingTable.cells.filter(c => !c.percentage || c.percentage <= 0);
      if (invalidCells.length > 0) {
        toast.error(t('rateTable.error.percentageGreaterThanZero'));
        return;
      }
      
      const response = await api.put(`/rate-tables/${activeTab}`, {
        valuePerGram: editingTable.valuePerGram,
        rows: editingTable.rows,
        columns: editingTable.columns,
        cells: editingTable.cells
      });

      if (response.data.success) {
        if (activeTab === 'gold') {
          setGoldTable({
            table: response.data.data.table,
            calculatedValues: response.data.data.calculatedValues
          });
        } else {
          setSilverTable({
            table: response.data.data.table,
            calculatedValues: response.data.data.calculatedValues
          });
        }
        
        toast.success(t('rateTable.success.updated'));
        setEditMode(false);
        setEditingTable(null);
      }
    } catch (error) {
      console.error('Error saving table:', error);
      toast.error(error.response?.data?.message || t('rateTable.error.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const addRow = () => {
    const newRow = {
      rowIndex: editingTable.rows.length,
      title: `Row ${editingTable.rows.length + 1}`
    };
    
    const newCells = editingTable.columns.map((col) => ({
      rowIndex: newRow.rowIndex,
      colIndex: col.colIndex,
      useRate: 'buying',
      percentage: 100
    }));

    setEditingTable({
      ...editingTable,
      rows: [...editingTable.rows, newRow],
      cells: [...editingTable.cells, ...newCells]
    });
  };

  const removeRow = (rowIndex) => {
    setEditingTable({
      ...editingTable,
      rows: editingTable.rows
        .filter(r => r.rowIndex !== rowIndex)
        .map((r, idx) => ({ ...r, rowIndex: idx })),
      cells: editingTable.cells
        .filter(c => c.rowIndex !== rowIndex)
        .map(c => ({
          ...c,
          rowIndex: c.rowIndex > rowIndex ? c.rowIndex - 1 : c.rowIndex
        }))
    });
  };

  const addColumn = () => {
    const newCol = {
      colIndex: editingTable.columns.length,
      title: `Column ${editingTable.columns.length + 1}`,
      roundingEnabled: false,
      roundDirection: 'low',
      roundingType: 'decimals'
    };
    
    const newCells = editingTable.rows.map((row) => ({
      rowIndex: row.rowIndex,
      colIndex: newCol.colIndex,
      useRate: 'buying',
      percentage: 100
    }));

    setEditingTable({
      ...editingTable,
      columns: [...editingTable.columns, newCol],
      cells: [...editingTable.cells, ...newCells]
    });
  };

  const removeColumn = (colIndex) => {
    setEditingTable({
      ...editingTable,
      columns: editingTable.columns
        .filter(c => c.colIndex !== colIndex)
        .map((c, idx) => ({ ...c, colIndex: idx })),
      cells: editingTable.cells
        .filter(c => c.colIndex !== colIndex)
        .map(c => ({
          ...c,
          colIndex: c.colIndex > colIndex ? c.colIndex - 1 : c.colIndex
        }))
    });
  };

  const updateRowTitle = (rowIndex, title) => {
    setEditingTable({
      ...editingTable,
      rows: editingTable.rows.map(r =>
        r.rowIndex === rowIndex ? { ...r, title } : r
      )
    });
  };

  const updateColumnTitle = (colIndex, title) => {
    setEditingTable({
      ...editingTable,
      columns: editingTable.columns.map(c =>
        c.colIndex === colIndex ? { ...c, title } : c
      )
    });
  };

  const updateColumnRounding = (colIndex, updates) => {
    setEditingTable({
      ...editingTable,
      columns: editingTable.columns.map(c =>
        c.colIndex === colIndex ? { ...c, ...updates } : c
      )
    });
  };

  const updateCellConfig = (rowIndex, colIndex, updates) => {
    setEditingTable({
      ...editingTable,
      cells: editingTable.cells.map(c =>
        c.rowIndex === rowIndex && c.colIndex === colIndex
          ? { ...c, ...updates }
          : c
      )
    });
  };

  const getCellConfig = (rowIndex, colIndex, table = editingTable || activeTable?.table) => {
    if (!table) return null;
    return table.cells?.find(c => c.rowIndex === rowIndex && c.colIndex === colIndex);
  };

  const getColumnConfig = (colIndex, table = activeTable?.table) => {
    if (!table) return null;
    return table.columns?.find(c => c.colIndex === colIndex);
  };

  const getCellValue = (rowIndex, colIndex) => {
    if (!activeTable?.calculatedValues) return '-';
    const value = activeTable.calculatedValues[rowIndex]?.[colIndex];
    if (value == null) return '-';
    
    const columnConfig = getColumnConfig(colIndex);
    const hasRounding = columnConfig?.roundingEnabled;
    
    return hasRounding ? `₹${Math.round(value)}` : `₹${value.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white to-gold-50 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center animate-fade-in">
          <div className="relative">
            <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-gold-600 dark:text-gold-400" />
            <div className="absolute inset-0 blur-xl bg-gold-500/20 animate-glow"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">{t('rateTable.subtitle')}</p>
        </div>
      </div>
    );
  }

  const displayTable = editMode ? editingTable : activeTable?.table;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gold-50/30 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="animate-slide-up">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-gold bg-clip-text text-transparent mb-2">
                {t('rateTable.title')}
              </h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                {canEdit ? t('rateTable.subtitle') : canSeeFormulas ? t('rateTable.viewFormulas') : t('rateTable.viewOnly')}
              </p>
            </div>
            
            {canEdit && !editMode && displayTable && displayTable.rows.length > 0 && displayTable.columns.length > 0 && (
              <button
                onClick={enterEditMode}
                className="glass-effect px-6 py-3 bg-gradient-gold text-white rounded-xl hover:shadow-gold transition-all duration-300 flex items-center gap-2 justify-center group animate-scale-in"
              >
                <Edit2 size={18} className="group-hover:rotate-12 transition-transform" />
                <span className="font-medium">{t('rateTable.buttons.edit')}</span>
              </button>
            )}

            {editMode && (
              <div className="flex gap-3 animate-scale-in">
                <button
                  onClick={cancelEdit}
                  className="glass-effect px-6 py-3 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl hover:shadow-luxury transition-all duration-300 flex items-center gap-2 border border-gray-200 dark:border-slate-700"
                >
                  <X size={18} />
                  <span className="font-medium hidden sm:inline">{t('rateTable.buttons.cancel')}</span>
                </button>
                <button
                  onClick={saveChanges}
                  disabled={saving}
                  className="glass-effect px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-luxury-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span className="font-medium hidden sm:inline">{t('rateTable.buttons.saving')}</span>
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      <span className="font-medium hidden sm:inline">{t('rateTable.buttons.save')}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Current Rates Card */}
{/* Only show current rates for admin and manager */}
{currentRates && ['admin', 'manager'].includes(user?.role) && (
  <div className="glass-effect bg-gradient-to-br from-gold-50/80 to-amber-50/80 dark:from-slate-800/80 dark:to-slate-700/80 border border-gold-200 dark:border-gold-900/30 rounded-2xl p-6 shadow-luxury animate-slide-up">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-gradient-gold rounded-lg">
        <TrendingUp className="text-white" size={20} />
      </div>
      <h3 className="font-bold text-lg text-gray-900 dark:text-white">{t('rateTable.rates.currentLive')}</h3>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: t('rateTable.rates.goldBuy'), value: currentRates.goldBuy, unit: t('rateTable.rates.perGram'), color: 'yellow' },
        { label: t('rateTable.rates.goldSell'), value: currentRates.goldSell, unit: t('rateTable.rates.perGram'), color: 'yellow' },
        { label: t('rateTable.rates.silverBuy'), value: currentRates.silverBuy, unit: t('rateTable.rates.perKg'), color: 'gray' },
        { label: t('rateTable.rates.silverSell'), value: currentRates.silverSell, unit: t('rateTable.rates.perKg'), color: 'gray' }
      ].map((rate, idx) => (
        <div key={idx} className="glass-effect bg-white/50 dark:bg-slate-900/50 rounded-xl p-4 border border-gray-200 dark:border-slate-700 hover:shadow-luxury transition-all duration-300">
          <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">{rate.label}</span>
          <span className={`text-xl font-bold ${rate.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'}`}>
            ₹{rate.value}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-500 ml-1">{rate.unit}</span>
        </div>
      ))}
    </div>
  </div>
)}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b-2 border-gray-200 dark:border-slate-700 overflow-x-auto">
          <button
            onClick={() => !editMode && setActiveTab('gold')}
            disabled={editMode}
            className={`group px-6 py-4 font-semibold transition-all duration-300 whitespace-nowrap ${
              activeTab === 'gold'
                ? 'border-b-4 border-yellow-500 text-yellow-600 dark:text-yellow-400 -mb-0.5'
                : 'text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400'
            } ${editMode ? 'opacity-50 cursor-not-allowed' : 'hover:bg-yellow-50/50 dark:hover:bg-slate-800/50'}`}
          >
            <div className="flex items-center gap-2">
              <DollarSign size={18} className={activeTab === 'gold' ? 'text-yellow-500' : ''} />
              {t('rateTable.tabs.gold')}
            </div>
          </button>
          <button
            onClick={() => !editMode && setActiveTab('silver')}
            disabled={editMode}
            className={`group px-6 py-4 font-semibold transition-all duration-300 whitespace-nowrap ${
              activeTab === 'silver'
                ? 'border-b-4 border-gray-400 text-gray-600 dark:text-gray-300 -mb-0.5'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-500 dark:hover:text-gray-300'
            } ${editMode ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50/50 dark:hover:bg-slate-800/50'}`}
          >
            <div className="flex items-center gap-2">
              <DollarSign size={18} className={activeTab === 'silver' ? 'text-gray-400' : ''} />
              {t('rateTable.tabs.silver')}
            </div>
          </button>
        </div>

        {/* Value Per Gram Section */}
        {displayTable && (
          <div className={`glass-effect rounded-2xl p-6 mb-6 border shadow-luxury transition-all duration-300 ${
            editMode 
              ? 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-300 dark:border-amber-700' 
              : canSeeFormulas 
                ? 'bg-white/80 dark:bg-slate-800/80 border-gray-200 dark:border-slate-700' 
                : 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700'
          }`}>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {/* {t('rateTable.formula.valuePerGram')} {displayTable.valuePerGram} {displayTable.valuePerGram === 1 ? t('rateTable.formula.gram') : t('rateTable.formula.grams')} */}
              {t('rateTable.formula.valuePerGram')} 

            </label>
            {editMode ? (
              <div className="space-y-2">
                <input
                  type="number"
                  value={editingTable.valuePerGram || 1}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEditingTable({
                      ...editingTable,
                      valuePerGram: value === '' ? '' : parseFloat(value) || 0
                    });
                  }}
                  onBlur={(e) => {
                    if (!e.target.value || parseFloat(e.target.value) <= 0) {
                      setEditingTable({
                        ...editingTable,
                        valuePerGram: 1
                      });
                    }
                  }}
                  className="w-full md:w-64 px-4 py-3 border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all"
                  min="0.001"
                  step="0.001"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t('rateTable.formula.baseFormula')} {activeTab === 'gold' ? t('rateTable.formula.goldDivisor') : t('rateTable.formula.silverDivisor')} {t('rateTable.formula.formulaRest')}
                </p>
              </div>
            ) : canSeeFormulas ? (
              <div className="space-y-2">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {displayTable.valuePerGram} {displayTable.valuePerGram === 1 ? t('rateTable.formula.gram') : t('rateTable.formula.grams')}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t('rateTable.formula.baseFormula')} {activeTab === 'gold' ? t('rateTable.formula.goldDivisor') : t('rateTable.formula.silverDivisor')} {t('rateTable.formula.formulaRest')}
                </p>
              </div>
            ) : (
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {displayTable.valuePerGram} {displayTable.valuePerGram === 1 ? t('rateTable.formula.gram') : t('rateTable.formula.grams')}
              </p>
            )}
          </div>
        )}

        {/* Add Row/Column Buttons */}
        {editMode && (
          <div className="flex flex-wrap gap-3 mb-6 animate-slide-up">
            <button
              onClick={addRow}
              className="glass-effect px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-luxury transition-all duration-300 flex items-center gap-2 group"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform" />
              <span className="font-medium">{t('rateTable.buttons.addRow')}</span>
            </button>
            <button
              onClick={addColumn}
              className="glass-effect px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-luxury transition-all duration-300 flex items-center gap-2 group"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform" />
              <span className="font-medium">{t('rateTable.buttons.addColumn')}</span>
            </button>
          </div>
        )}

        {/* Table */}
        {displayTable && displayTable.rows.length > 0 && displayTable.columns.length > 0 ? (
          <div className="glass-effect bg-white dark:bg-slate-800 rounded-2xl shadow-luxury-lg overflow-hidden border border-gray-200 dark:border-slate-700 animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`bg-gradient-to-r ${
                  activeTab === 'gold' 
                    ? 'from-gold-100 to-amber-100 dark:from-gold-900/20 dark:to-amber-900/20' 
                    : 'from-silver-100 to-slate-100 dark:from-silver-900/20 dark:to-slate-800/20'
                }`}>
                  <tr>
                    <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider border-b-2 ${
                      activeTab === 'gold'
                        ? 'text-gold-700 dark:text-gold-300 border-gold-200 dark:border-gold-900/30'
                        : 'text-silver-700 dark:text-silver-300 border-silver-300 dark:border-silver-800/30'
                    }`}>
                      {t('rateTable.table.rowColumn')}
                    </th>
                    {displayTable.columns.map((col) => (
                      <th key={col.colIndex} className={`px-6 py-4 text-left min-w-[200px] border-b-2 ${
                        activeTab === 'gold'
                          ? 'border-gold-200 dark:border-gold-900/30'
                          : 'border-silver-300 dark:border-silver-800/30'
                      }`}>
                        {editMode ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={col.title}
                                onChange={(e) => updateColumnTitle(col.colIndex, e.target.value)}
                                className={`flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-900 border-2 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg transition-all focus:ring-2 ${
                                activeTab === 'gold'
                                  ? 'focus:ring-gold-500'
                                  : 'focus:ring-silver-500'
                              }`}
                                placeholder="Column title"
                              />
                              <button
                                onClick={() => removeColumn(col.colIndex)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                aria-label="Delete column"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            
                            <div className="space-y-2 text-xs">
                              <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={col.roundingEnabled}
                                  onChange={(e) => updateColumnRounding(col.colIndex, { roundingEnabled: e.target.checked })}
                                  className={`rounded border-gray-300 focus:ring-2 ${
                                    activeTab === 'gold'
                                      ? 'text-gold-600 focus:ring-gold-500'
                                      : 'text-silver-600 focus:ring-silver-500'
                                  }`}
                                />
                                <span className={`text-gray-700 dark:text-gray-300 font-medium transition-colors ${
                                  activeTab === 'gold'
                                    ? 'group-hover:text-gold-600 dark:group-hover:text-gold-400'
                                    : 'group-hover:text-silver-600 dark:group-hover:text-silver-400'
                                }`}>
                                  {t('rateTable.table.rounding')}
                                </span>
                              </label>
                              
                              {col.roundingEnabled && (
                                <div className={`space-y-2 pl-6 border-l-2 ${
                                  activeTab === 'gold'
                                    ? 'border-gold-200 dark:border-gold-800'
                                    : 'border-silver-200 dark:border-silver-700'
                                }`}>
                                  <select
                                    value={col.roundDirection}
                                    onChange={(e) => updateColumnRounding(col.colIndex, { roundDirection: e.target.value })}
                                    className={`w-full px-3 py-2 bg-white dark:bg-slate-900 border-2 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg text-xs transition-all focus:ring-2 ${
                                      activeTab === 'gold'
                                        ? 'focus:ring-gold-500'
                                        : 'focus:ring-silver-500'
                                    }`}
                                  >
                                    <option value="high">{t('rateTable.table.roundHigh')}</option>
                                    <option value="low">{t('rateTable.table.roundLow')}</option>
                                  </select>
                                  
                                  <select
                                    value={col.roundingType}
                                    onChange={(e) => updateColumnRounding(col.colIndex, { roundingType: e.target.value })}
                                    className={`w-full px-3 py-2 bg-white dark:bg-slate-900 border-2 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg text-xs transition-all focus:ring-2 ${
                                      activeTab === 'gold'
                                        ? 'focus:ring-gold-500'
                                        : 'focus:ring-silver-500'
                                    }`}
                                  >
                                    <option value="decimals">{t('rateTable.table.decimalsOnly')}</option>
                                    <option value="nearest_5_0">{t('rateTable.table.nearest50')}</option>
                                    <option value="last_digit_0">{t('rateTable.table.lastDigit0')}</option>
                                  </select>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : canSeeFormulas ? (
                          <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">{col.title}</div>
                            {col.roundingEnabled && (
                              <div className={`text-xs text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-1`}>
                                <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                                  activeTab === 'gold' ? 'bg-gold-500' : 'bg-silver-500'
                                }`}></span>
                                {t('rateTable.table.roundDirection')}: {col.roundDirection} - {col.roundingType.replace(/_/g, ' ')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm font-bold text-gray-900 dark:text-white">{col.title}</div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {displayTable.rows.map((row, rowIdx) => (
                    <tr 
                      key={row.rowIndex} 
                      className={`transition-all duration-200 ${
                        rowIdx % 2 === 0 
                          ? 'bg-white dark:bg-slate-800' 
                          : 'bg-gray-50/50 dark:bg-slate-800/50'
                      } ${
                        activeTab === 'gold'
                          ? 'hover:bg-gold-50/30 dark:hover:bg-gold-900/10'
                          : 'hover:bg-silver-50/30 dark:hover:bg-silver-900/10'
                      }`}
                    >
                      <td className="px-6 py-4">
                        {editMode ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={row.title}
                              onChange={(e) => updateRowTitle(row.rowIndex, e.target.value)}
                              className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-900 border-2 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-gold-500 transition-all"
                              placeholder="Row title"
                            />
                            <button
                              onClick={() => removeRow(row.rowIndex)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                              aria-label="Delete row"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{row.title}</span>
                        )}
                      </td>
                      {displayTable.columns.map((col) => {
                        const cellConfig = getCellConfig(row.rowIndex, col.colIndex, displayTable);
                        return (
                          <td key={col.colIndex} className="px-6 py-4">
                            {editMode ? (
                              <div className="space-y-3">
                                <select
                                  value={cellConfig?.useRate || 'buying'}
                                  onChange={(e) => updateCellConfig(row.rowIndex, col.colIndex, { useRate: e.target.value })}
                                  className={`w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border-2 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg transition-all focus:ring-2 ${
                                    activeTab === 'gold'
                                      ? 'focus:ring-gold-500'
                                      : 'focus:ring-silver-500'
                                  }`}
                                >
                                  <option value="buying">{t('rateTable.table.buying')}</option>
                                  <option value="selling">{t('rateTable.table.selling')}</option>
                                </select>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={cellConfig?.percentage ?? 100}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      updateCellConfig(row.rowIndex, col.colIndex, { 
                                        percentage: value === '' ? '' : parseFloat(value) || 0 
                                      });
                                    }}
                                    onBlur={(e) => {
                                      if (!e.target.value || parseFloat(e.target.value) <= 0) {
                                        updateCellConfig(row.rowIndex, col.colIndex, { percentage: 100 });
                                      }
                                    }}
                                    className={`flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-900 border-2 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg transition-all focus:ring-2 ${
                                      activeTab === 'gold'
                                        ? 'focus:ring-gold-500'
                                        : 'focus:ring-silver-500'
                                    }`}
                                    min="0.001"
                                    step="0.1"
                                  />
                                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">%</span>
                                </div>
                              </div>
                            ) : canSeeFormulas ? (
                              <div>
                                <div className={`text-xl font-bold ${
                                  activeTab === 'gold'
                                    ? 'bg-gradient-gold bg-clip-text text-transparent'
                                    : 'bg-gradient-silver bg-clip-text text-transparent'
                                }`}>
                                  {getCellValue(row.rowIndex, col.colIndex)}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
                                  <span className={`inline-block w-1 h-1 rounded-full ${
                                    activeTab === 'gold' ? 'bg-gold-500' : 'bg-silver-500'
                                  }`}></span>
                                  {cellConfig?.useRate === 'buying' ? t('rateTable.table.buy') : t('rateTable.table.sell')} × {cellConfig?.percentage}%
                                </div>
                              </div>
                            ) : (
                              <div className={`text-xl font-bold ${
                                activeTab === 'gold'
                                  ? 'text-gold-600 dark:text-gold-400'
                                  : 'text-silver-600 dark:text-silver-400'
                              }`}>
                                {getCellValue(row.rowIndex, col.colIndex)}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="glass-effect bg-white dark:bg-slate-800 rounded-2xl shadow-luxury-lg p-12 md:p-16 text-center border border-gray-200 dark:border-slate-700 animate-fade-in">
            <div className="max-w-md mx-auto">
              <div className="relative mb-6">
                <AlertCircle className="w-20 h-20 text-gray-400 dark:text-gray-600 mx-auto" />
                <div className="absolute inset-0 blur-2xl bg-gold-500/10 dark:bg-gold-500/5"></div>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t('rateTable.table.noTableData')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                {canEdit ? t('rateTable.table.adminCreateTable') : t('rateTable.table.adminNeeded')}
              </p>
              {canEdit && !editMode && (
                <button
                  onClick={enterEditMode}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-gold text-white rounded-xl hover:shadow-gold transition-all duration-300 font-semibold group"
                >
                  <Edit2 size={20} className="group-hover:rotate-12 transition-transform" />
                  {t('rateTable.buttons.createTable')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Formula Info */}
        {!editMode && canSeeFormulas && (
          <div className="mt-8 glass-effect bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 shadow-luxury animate-slide-up">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded-lg">
                  <AlertCircle className="text-white" size={20} />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-white mb-3 text-lg">
                  {t('rateTable.formula.title')}
                </p>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                    <span>{t('rateTable.formula.baseFormula')} {activeTab === 'gold' ? t('rateTable.formula.goldDivisor') : t('rateTable.formula.silverDivisor')} {t('rateTable.formula.formulaRest')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                    <span>{t('rateTable.formula.roundingRule')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                    <span>{t('rateTable.formula.roundingDisplay')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                    <span>{t('rateTable.formula.autoUpdate')}</span>
                  </li>
                  {canEdit && (
                    <li className="flex items-start gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold-500 mt-1.5 flex-shrink-0"></span>
                      <span className="font-semibold text-gold-600 dark:text-gold-400">{t('rateTable.formula.adminEdit')}</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RateTables;
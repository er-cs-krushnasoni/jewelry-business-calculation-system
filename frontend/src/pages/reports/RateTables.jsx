import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, TrendingUp, DollarSign, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

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
      toast.success(`${data.metalType.charAt(0).toUpperCase() + data.metalType.slice(1)} ${t('rateTable.table.noTableData')}`);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">{t('rateTable.subtitle')}</p>
        </div>
      </div>
    );
  }

  const displayTable = editMode ? editingTable : activeTable?.table;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('rateTable.title')}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {canEdit ? t('rateTable.subtitle') : canSeeFormulas ? t('rateTable.viewFormulas') : t('rateTable.viewOnly')}
            </p>
          </div>
          
          {canEdit && !editMode && (
            <button
              onClick={enterEditMode}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit2 size={18} />
              {t('rateTable.buttons.edit')}
            </button>
          )}

          {editMode && (
            <div className="flex gap-2">
              <button
                onClick={cancelEdit}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <X size={18} />
                {t('rateTable.buttons.cancel')}
              </button>
              <button
                onClick={saveChanges}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    {t('rateTable.buttons.saving')}
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {t('rateTable.buttons.save')}
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {currentRates && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-blue-600" size={20} />
              <h3 className="font-semibold text-gray-900">{t('rateTable.rates.currentLive')}</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">{t('rateTable.rates.goldBuy')}</span>
                <span className="ml-2 font-semibold text-gray-900">₹{currentRates.goldBuy}{t('rateTable.rates.perGram')}</span>
              </div>
              <div>
                <span className="text-gray-600">{t('rateTable.rates.goldSell')}</span>
                <span className="ml-2 font-semibold text-gray-900">₹{currentRates.goldSell}{t('rateTable.rates.perGram')}</span>
              </div>
              <div>
                <span className="text-gray-600">{t('rateTable.rates.silverBuy')}</span>
                <span className="ml-2 font-semibold text-gray-900">₹{currentRates.silverBuy}{t('rateTable.rates.perKg')}</span>
              </div>
              <div>
                <span className="text-gray-600">{t('rateTable.rates.silverSell')}</span>
                <span className="ml-2 font-semibold text-gray-900">₹{currentRates.silverSell}{t('rateTable.rates.perKg')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => !editMode && setActiveTab('gold')}
          disabled={editMode}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'gold'
              ? 'border-b-2 border-yellow-500 text-yellow-600'
              : 'text-gray-600 hover:text-gray-900'
          } ${editMode ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center gap-2">
            <DollarSign size={18} />
            {t('rateTable.tabs.gold')}
          </div>
        </button>
        <button
          onClick={() => !editMode && setActiveTab('silver')}
          disabled={editMode}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'silver'
              ? 'border-b-2 border-gray-500 text-gray-600'
              : 'text-gray-600 hover:text-gray-900'
          } ${editMode ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center gap-2">
            <DollarSign size={18} />
            {t('rateTable.tabs.silver')}
          </div>
        </button>
      </div>

      {displayTable && (
        <div className={`border rounded-lg p-4 mb-6 ${editMode ? 'bg-yellow-50 border-yellow-200' : canSeeFormulas ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('rateTable.formula.valuePerGram')} {displayTable.valuePerGram} {displayTable.valuePerGram === 1 ? t('rateTable.formula.grams') : t('rateTable.formula.gramPlural')}
          </label>
          {editMode ? (
            <>
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
                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0.001"
                step="0.001"
              />
              <p className="text-xs text-gray-600 mt-1">
                {t('rateTable.formula.baseFormula')} {activeTab === 'gold' ? t('rateTable.formula.goldDivisor') : t('rateTable.formula.silverDivisor')} {t('rateTable.formula.formulaRest')}
              </p>
            </>
          ) : canSeeFormulas ? (
            <>
              <p className="text-lg font-semibold text-gray-900">{displayTable.valuePerGram} {displayTable.valuePerGram === 1 ? t('rateTable.formula.grams') : t('rateTable.formula.gramPlural')}</p>
              <p className="text-xs text-gray-600 mt-1">
                {t('rateTable.formula.baseFormula')} {activeTab === 'gold' ? t('rateTable.formula.goldDivisor') : t('rateTable.formula.silverDivisor')} {t('rateTable.formula.formulaRest')}
              </p>
            </>
          ) : (
            <p className="text-lg font-semibold text-gray-900">{displayTable.valuePerGram} {displayTable.valuePerGram === 1 ? t('rateTable.formula.grams') : t('rateTable.formula.gramPlural')}</p>
          )}
        </div>
      )}

      {editMode && (
        <div className="flex gap-3 mb-4">
          <button
            onClick={addRow}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus size={18} />
            {t('rateTable.buttons.addRow')}
          </button>
          <button
            onClick={addColumn}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            {t('rateTable.buttons.addColumn')}
          </button>
        </div>
      )}

      {displayTable && displayTable.rows.length > 0 && displayTable.columns.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('rateTable.table.rowColumn')}
                  </th>
                  {displayTable.columns.map((col) => (
                    <th key={col.colIndex} className="px-4 py-3 text-left min-w-[200px]">
                      {editMode ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={col.title}
                              onChange={(e) => updateColumnTitle(col.colIndex, e.target.value)}
                              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => removeColumn(col.colIndex)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          
                          <div className="space-y-1 text-xs">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={col.roundingEnabled}
                                onChange={(e) => updateColumnRounding(col.colIndex, { roundingEnabled: e.target.checked })}
                                className="rounded"
                              />
                              <span className="text-gray-700">{t('rateTable.table.rounding')}</span>
                            </label>
                            
                            {col.roundingEnabled && (
                              <>
                                <select
                                  value={col.roundDirection}
                                  onChange={(e) => updateColumnRounding(col.colIndex, { roundDirection: e.target.value })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                >
                                  <option value="high">{t('rateTable.table.roundHigh')}</option>
                                  <option value="low">{t('rateTable.table.roundLow')}</option>
                                </select>
                                
                                <select
                                  value={col.roundingType}
                                  onChange={(e) => updateColumnRounding(col.colIndex, { roundingType: e.target.value })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                >
                                  <option value="decimals">{t('rateTable.table.decimalsOnly')}</option>
                                  <option value="nearest_5_0">{t('rateTable.table.nearest50')}</option>
                                  <option value="last_digit_0">{t('rateTable.table.lastDigit0')}</option>
                                </select>
                              </>
                            )}
                          </div>
                        </div>
                      ) : canSeeFormulas ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{col.title}</div>
                          {col.roundingEnabled && (
                            <div className="text-xs text-gray-500 mt-1">
                              {t('rateTable.table.roundDirection')}: {col.roundDirection} - {col.roundingType.replace(/_/g, ' ')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-gray-900">{col.title}</div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayTable.rows.map((row) => (
                  <tr key={row.rowIndex} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {editMode ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={row.title}
                            onChange={(e) => updateRowTitle(row.rowIndex, e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => removeRow(row.rowIndex)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-gray-900">{row.title}</span>
                      )}
                    </td>
                    {displayTable.columns.map((col) => {
                      const cellConfig = getCellConfig(row.rowIndex, col.colIndex, displayTable);
                      return (
                        <td key={col.colIndex} className="px-4 py-3">
                          {editMode ? (
                            <div className="space-y-2">
                              <select
                                value={cellConfig?.useRate || 'buying'}
                                onChange={(e) => updateCellConfig(row.rowIndex, col.colIndex, { useRate: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              >
                                <option value="buying">{t('rateTable.table.buying')}</option>
                                <option value="selling">{t('rateTable.table.selling')}</option>
                              </select>
                              <div className="flex items-center gap-1">
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
                                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                  min="0.001"
                                  step="0.1"
                                />
                                <span className="text-xs text-gray-500">%</span>
                              </div>
                            </div>
                          ) : canSeeFormulas ? (
                            <div>
                              <div className="text-lg font-semibold text-gray-900">
                                {getCellValue(row.rowIndex, col.colIndex)}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {cellConfig?.useRate === 'buying' ? t('rateTable.table.buy') : t('rateTable.table.sell')} × {cellConfig?.percentage}%
                              </div>
                            </div>
                          ) : (
                            <div className="text-lg font-semibold text-gray-900">
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
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('rateTable.table.noTableData')}</h3>
          <p className="text-gray-600 mb-6">
            {canEdit ? t('rateTable.table.adminCreateTable') : t('rateTable.table.adminNeeded')}
          </p>
          {canEdit && !editMode && (
            <button
              onClick={enterEditMode}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit2 size={18} />
              {t('rateTable.buttons.createTable')}
            </button>
          )}
        </div>
      )}

      {!editMode && canSeeFormulas && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-1">{t('rateTable.formula.title')}</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>{t('rateTable.formula.baseFormula')} {activeTab === 'gold' ? t('rateTable.formula.goldDivisor') : t('rateTable.formula.silverDivisor')} {t('rateTable.formula.formulaRest')}</li>
                <li>{t('rateTable.formula.roundingRule')}</li>
                <li>{t('rateTable.formula.roundingDisplay')}</li>
                <li>{t('rateTable.formula.autoUpdate')}</li>
                {canEdit && <li>{t('rateTable.formula.adminEdit')}</li>}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RateTables;

import { useState } from 'react';
import { Users, Plus, Trash2, UserCheck } from 'lucide-react';
import { contract, formatAddress } from '../utils/contract';

export default function EmployeeManagement({ account, employees, onEmployeeAdded }) {
  const [inputAddress, setInputAddress] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [recentlyAdded, setRecentlyAdded] = useState(null);

  const handleAddEmployee = async () => {
    if (!inputAddress.trim()) {
      setError('Please enter an address');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(inputAddress.trim())) {
      setError('Invalid Ethereum address format');
      return;
    }

    if (employees.includes(inputAddress.trim().toLowerCase())) {
      setError('Employee already exists');
      return;
    }

    setIsAdding(true);
    setError('');

    try {
      await contract.addEmployee(inputAddress.trim().toLowerCase());
      setRecentlyAdded(inputAddress.trim().toLowerCase());
      setTimeout(() => setRecentlyAdded(null), 2000);
      onEmployeeAdded(inputAddress.trim().toLowerCase());
      setInputAddress('');
    } catch (err) {
      setError('Failed to add employee');
    } finally {
      setIsAdding(false);
    }
  };

  const handleClearInput = () => {
    setInputAddress('');
    setError('');
  };

  return (
    <div className="border-glow rounded-xl p-6 bg-surface/50 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-accent/20">
          <Users className="w-5 h-5 text-accent" />
        </div>
        <h2 className="text-xl font-semibold text-text-primary">Employee Management</h2>
      </div>

      {account && (
        <>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputAddress}
                onChange={(e) => {
                  setInputAddress(e.target.value);
                  setError('');
                }}
                placeholder="0x..."
                className="flex-1 py-2.5 px-3 rounded-lg bg-card border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-primary font-mono text-sm transition-colors"
              />
              <button
                onClick={handleClearInput}
                className="px-3 py-2 rounded-lg bg-card border border-border hover:border-highlight text-highlight transition-colors text-sm"
                title="Clear input"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={handleAddEmployee}
                disabled={isAdding || !inputAddress.trim()}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isAdding ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Adding
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add
                  </>
                )}
              </button>
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-text-muted mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Employee List ({employees.length})
            </h3>

            {employees.length === 0 ? (
              <div className="p-4 rounded-lg bg-card/50 border border-dashed border-border text-center">
                <p className="text-text-muted text-sm">No employees added yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {employees.map((addr, index) => (
                  <div
                    key={addr}
                    className={`p-3 rounded-lg bg-card border transition-all ${
                      recentlyAdded === addr
                        ? 'border-success animate-pulse-glow'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium">
                          {index + 1}
                        </span>
                        <span className="font-mono text-sm text-accent">
                          {formatAddress(addr)}
                        </span>
                      </div>
                      <span className="text-xs text-success">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {!account && (
        <div className="p-4 rounded-lg bg-card/50 border border-dashed border-border text-center">
          <p className="text-text-muted text-sm">Connect wallet to manage employees</p>
        </div>
      )}
    </div>
  );
}
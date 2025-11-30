'use client';

import { useState } from 'react';
import { useAuth, Tenant } from '@/contexts/AuthContext';
import { 
  Building2, 
  ChevronDown, 
  Check, 
  Plus,
  LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface RestaurantSwitcherProps {
  showAllOption?: boolean;
}

export default function RestaurantSwitcher({ showAllOption = true }: RestaurantSwitcherProps) {
  const { tenants, selectedTenant, selectTenant, hasMultipleTenants } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');

  // Don't show if only one tenant
  if (!hasMultipleTenants && tenants.length <= 1) {
    return null;
  }

  const handleSelectTenant = (tenant: Tenant) => {
    selectTenant(tenant);
    setViewMode('single');
    setIsOpen(false);
  };

  const handleViewAll = () => {
    setViewMode('all');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 min-w-[200px] justify-between"
      >
        <div className="flex items-center gap-2">
          {viewMode === 'all' ? (
            <LayoutGrid className="h-4 w-4 text-indigo-500" />
          ) : (
            <Building2 className="h-4 w-4 text-indigo-500" />
          )}
          <span className="truncate max-w-[150px]">
            {viewMode === 'all' ? 'All Restaurants' : selectedTenant?.name || 'Select Restaurant'}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <Card className="absolute top-full left-0 mt-2 w-72 z-50 shadow-lg border">
            <div className="p-2">
              <p className="text-xs font-medium text-gray-500 px-2 py-1 mb-1">
                Your Restaurants ({tenants.length})
              </p>
              
              {/* View All Option */}
              {showAllOption && tenants.length > 1 && (
                <button
                  onClick={handleViewAll}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    viewMode === 'all'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                    <LayoutGrid className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">All Restaurants</p>
                    <p className="text-xs text-gray-500">Combined view</p>
                  </div>
                  {viewMode === 'all' && (
                    <Check className="h-4 w-4 text-indigo-600" />
                  )}
                </button>
              )}

              <div className="border-t my-2" />

              {/* Individual Restaurants */}
              <div className="max-h-64 overflow-y-auto">
                {tenants.map((tenant) => (
                  <button
                    key={tenant.tenant_id}
                    onClick={() => handleSelectTenant(tenant)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      viewMode === 'single' && selectedTenant?.tenant_id === tenant.tenant_id
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">{tenant.name}</p>
                      <p className="text-xs text-gray-500">{tenant.domain || 'No domain'}</p>
                    </div>
                    {viewMode === 'single' && selectedTenant?.tenant_id === tenant.tenant_id && (
                      <Check className="h-4 w-4 text-indigo-600" />
                    )}
                    {tenant.status !== 'active' && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">
                        {tenant.status}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// Compact version for sidebar
export function RestaurantSwitcherCompact() {
  const { tenants, selectedTenant, selectTenant, hasMultipleTenants } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!hasMultipleTenants) {
    return null;
  }

  return (
    <div className="relative px-3 py-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
      >
        <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
          <Building2 className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="font-medium text-sm truncate">{selectedTenant?.name}</p>
          <p className="text-xs text-gray-500 truncate">{tenants.length} restaurants</p>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-3 right-3 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border z-50 max-h-64 overflow-y-auto">
            {tenants.map((tenant) => (
              <button
                key={tenant.tenant_id}
                onClick={() => {
                  selectTenant(tenant);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  selectedTenant?.tenant_id === tenant.tenant_id ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
                }`}
              >
                <Building2 className="h-4 w-4 text-indigo-500" />
                <span className="flex-1 text-left text-sm truncate">{tenant.name}</span>
                {selectedTenant?.tenant_id === tenant.tenant_id && (
                  <Check className="h-4 w-4 text-indigo-600" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

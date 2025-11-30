'use client';

// admin/src/app/menu/page.tsx

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_ENDPOINTS } from '@/config/api';
import { TENANT_ID } from '@/config/constants';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, RefreshCw } from 'lucide-react';

interface MenuCategorySummary {
  id: string | number;
  name: string;
  itemsCount?: number;
}

interface MenuSummary {
  id: string | number;
  name: string;
  description?: string;
  categories?: MenuCategorySummary[];
}

export default function MenuPage() {
  const router = useRouter();
  const [menus, setMenus] = useState<MenuSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMenus = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(API_ENDPOINTS.MENUS.LIST, {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': TENANT_ID,
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Failed to load menus');
      }

      const data = await res.json();
      const items: MenuSummary[] = Array.isArray(data) ? data : data.menus || [];
      setMenus(items);
    } catch (err: any) {
      setError(err.message || 'Failed to load menus');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Menu</CardTitle>
          <CardDescription>Manage your restaurant menus and categories from the backend API.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={loadMenus}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => router.push('/menu/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add item
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : menus.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No menus found.
          </div>
        ) : (
          <div className="space-y-4">
            {menus.map((menu) => (
              <Card key={menu.id} className="border border-gray-200 dark:border-gray-800">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{menu.name}</CardTitle>
                      {menu.description && (
                        <CardDescription>{menu.description}</CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {menu.categories && menu.categories.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead>Items</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {menu.categories.map((cat) => (
                            <TableRow
                              key={cat.id}
                              className="cursor-pointer"
                              onClick={() => router.push(`/menu/categories?menuId=${menu.id}&categoryId=${cat.id}`)}
                            >
                              <TableCell className="font-medium flex items-center gap-2">
                                {cat.name}
                                {typeof cat.itemsCount === 'number' && (
                                  <Badge variant="outline" className="text-xs">
                                    {cat.itemsCount} items
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {typeof cat.itemsCount === 'number' ? cat.itemsCount : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No categories loaded for this menu.
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

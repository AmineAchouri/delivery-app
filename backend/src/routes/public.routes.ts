import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const router = Router();

// GET /public/tenant/config - Get tenant configuration by domain or identifier
router.get('/tenant/config', async (req: Request, res: Response) => {
  try {
    const { domain, identifier } = req.query;

    if (!domain && !identifier) {
      return res.status(400).json({ message: 'Domain or identifier required' });
    }

    let tenant;

    if (domain) {
      // Find by domain
      tenant = await prisma.tenant.findFirst({
        where: { domain: domain as string },
        include: {
          features: {
            include: {
              feature: true
            }
          }
        }
      });
    } else if (identifier) {
      // Find by tenant name (slug-like identifier)
      tenant = await prisma.tenant.findFirst({
        where: {
          OR: [
            { tenant_id: identifier as string },
            { name: { contains: identifier as string, mode: 'insensitive' } }
          ]
        },
        include: {
          features: {
            include: {
              feature: true
            }
          }
        }
      });
    }

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Format response for PWA
    const config = {
      tenantId: tenant.tenant_id,
      name: tenant.name,
      domain: tenant.domain,
      logo: '/default-logo.png',
      primaryColor: '#FF6B35',
      backgroundColor: '#FFFFFF',
      currency: tenant.currency_code,
      currencySymbol: getCurrencySymbol(tenant.currency_code),
      features: tenant.features
        .filter((f: any) => f.is_enabled)
        .map((f: any) => f.feature.feature_key),
      status: tenant.status
    };

    res.json(config);
  } catch (error) {
    console.error('Error fetching tenant config:', error);
    res.status(500).json({ message: 'Failed to fetch tenant configuration' });
  }
});

// GET /public/tenant/menu - Get public menu for a tenant
router.get('/tenant/menu', async (req: Request, res: Response) => {
  try {
    const { tenantId, domain } = req.query;

    if (!tenantId && !domain) {
      return res.status(400).json({ message: 'Tenant ID or domain required' });
    }

    // Find tenant
    let tenant;
    if (domain) {
      tenant = await prisma.tenant.findFirst({
        where: { domain: domain as string }
      });
    } else {
      tenant = await prisma.tenant.findUnique({
        where: { tenant_id: tenantId as string }
      });
    }

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Get menu with categories and items
    const menus = await prisma.menu.findMany({
      where: {
        tenant_id: tenant.tenant_id,
        is_active: true
      },
      include: {
        categories: {
          orderBy: { order_index: 'asc' },
          include: {
            items: {
              orderBy: { name: 'asc' }
            }
          }
        }
      }
    });

    // Calculate menu version (for caching)
    const lastUpdate = await prisma.menuItem.findFirst({
      where: { tenant_id: tenant.tenant_id },
      orderBy: { created_at: 'desc' },
      select: { created_at: true }
    });

    const response = {
      tenantId: tenant.tenant_id,
      tenantName: tenant.name,
      currency: tenant.currency_code,
      menus: menus.map((menu: any) => ({
        menuId: menu.menu_id,
        name: menu.name,
        description: menu.description,
        categories: menu.categories.map((cat: any) => ({
          categoryId: cat.category_id,
          name: cat.name,
          items: cat.items.map((item: any) => ({
            itemId: item.item_id,
            name: item.name,
            description: item.description,
            price: parseFloat(item.price.toString()),
            image: null,
            isAvailable: item.is_available
          }))
        }))
      })),
      version: lastUpdate?.created_at.getTime() || Date.now(),
      lastUpdate: lastUpdate?.created_at || new Date()
    };

    // Cache for 5 minutes
    res.set('Cache-Control', 'public, max-age=300');
    res.json(response);
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ message: 'Failed to fetch menu' });
  }
});

// GET /public/tenant/categories - Get categories only (lightweight)
router.get('/tenant/categories', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    const categories = await prisma.menuCategory.findMany({
      where: {
        menu: { tenant_id: tenantId as string }
      },
      orderBy: { order_index: 'asc' },
      select: {
        category_id: true,
        name: true
      }
    });

    res.set('Cache-Control', 'public, max-age=300');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

// Helper function to get currency symbol
function getCurrencySymbol(currencyCode: string): string {
  const symbols: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CAD': 'CA$',
    'AUD': 'A$',
    'CHF': 'CHF',
    'CNY': '¥',
    'INR': '₹'
  };
  return symbols[currencyCode] || currencyCode;
}

export default router;

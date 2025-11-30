// admin/src/components/RecentOrders.tsx
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RecentOrders() {
  const orders = [
    {
      id: "ORD-001",
      customer: "John Doe",
      items: "Pizza, Coke",
      status: "preparing",
      time: "5 min ago"
    },
    {
      id: "ORD-002",
      customer: "Jane Smith",
      items: "Burger, Fries",
      status: "ready",
      time: "12 min ago"
    },
    {
      id: "ORD-003",
      customer: "Mike Johnson",
      items: "Pasta, Garlic Bread",
      status: "delivered",
      time: "23 min ago"
    },
    {
      id: "ORD-004",
      customer: "Sarah Wilson",
      items: "Salad, Iced Tea",
      status: "preparing",
      time: "35 min ago"
    },
    {
      id: "ORD-005",
      customer: "David Brown",
      items: "Sushi, Miso Soup",
      status: "on-the-way",
      time: "42 min ago"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'on-the-way':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'preparing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">
              {order.id} • {order.customer}
            </p>
            <p className="text-sm text-muted-foreground">
              {order.items}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {getStatusIcon(order.status)}
              <span className="capitalize">{order.status.replace('-', ' ')}</span>
            </div>
            <Button variant="ghost" size="sm">
              View
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
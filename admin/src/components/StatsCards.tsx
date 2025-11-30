// admin/src/components/StatsCards.tsx
import { Clock, Users, Package, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function StatsCards() {
  const stats = [
    {
      title: "Today's Orders",
      value: "124",
      icon: Package,
      change: "+12% from yesterday"
    },
    {
      title: "Active Customers",
      value: "856",
      icon: Users,
      change: "+5% from last week"
    },
    {
      title: "Average Preparation",
      value: "23 min",
      icon: Clock,
      change: "-2 min from last month"
    },
    {
      title: "Revenue (Today)",
      value: "$2,845",
      icon: DollarSign,
      change: "+8% from yesterday"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
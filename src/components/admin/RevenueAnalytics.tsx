import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Smartphone
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

// Mock data - replace with real Stripe/Apple data when integrated
const monthlyRevenueData = [
  { month: "Jul", stripe: 2400, apple: 1200 },
  { month: "Aug", stripe: 3100, apple: 1800 },
  { month: "Sep", stripe: 2800, apple: 2100 },
  { month: "Oct", stripe: 4200, apple: 2400 },
  { month: "Nov", stripe: 5100, apple: 3200 },
  { month: "Dec", stripe: 6800, apple: 4100 },
];

const planDistribution = [
  { name: "Free", value: 245, color: "hsl(var(--muted))" },
  { name: "New to Dating", value: 89, color: "hsl(var(--primary))" },
  { name: "Dating Often", value: 156, color: "hsl(var(--secondary))" },
  { name: "Dating More", value: 67, color: "hsl(var(--accent))" },
];

const recentTransactions = [
  { id: 1, user: "Sarah M.", plan: "Dating Often", amount: 19.99, platform: "stripe", date: "2 hours ago" },
  { id: 2, user: "Alex K.", plan: "New to Dating", amount: 9.99, platform: "apple", date: "5 hours ago" },
  { id: 3, user: "Jordan P.", plan: "Dating More", amount: 29.99, platform: "stripe", date: "1 day ago" },
  { id: 4, user: "Taylor R.", plan: "Dating Often", amount: 19.99, platform: "apple", date: "1 day ago" },
  { id: 5, user: "Morgan L.", plan: "New to Dating", amount: 9.99, platform: "stripe", date: "2 days ago" },
];

const chartConfig = {
  stripe: {
    label: "Stripe",
    color: "hsl(var(--primary))",
  },
  apple: {
    label: "Apple",
    color: "hsl(var(--secondary))",
  },
};

export const RevenueAnalytics = () => {
  const totalRevenue = 10900; // Mock total
  const stripeRevenue = 6800;
  const appleRevenue = 4100;
  const activeSubscribers = 312;
  const revenueGrowth = 23.5;
  const subscriberGrowth = 12.3;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-green-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Revenue Analytics</h2>
            <p className="text-xs text-muted-foreground">Stripe & App Store earnings</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          <Calendar className="w-3 h-3 mr-1" />
          Last 6 months
        </Badge>
      </div>

      {/* Revenue Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-green-500">${totalRevenue.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">/mo</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-500">
              <ArrowUpRight className="w-3 h-3" />
              <span>+{revenueGrowth}% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Stripe Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">${stripeRevenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-primary">
              <ArrowUpRight className="w-3 h-3" />
              <span>62% of total</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              App Store Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">${appleRevenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-secondary-foreground">
              <ArrowUpRight className="w-3 h-3" />
              <span>38% of total</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Active Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{activeSubscribers}</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-500">
              <ArrowUpRight className="w-3 h-3" />
              <span>+{subscriberGrowth}% this month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart data={monthlyRevenueData}>
                <defs>
                  <linearGradient id="stripeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="appleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="stripe" 
                  stroke="hsl(var(--primary))" 
                  fill="url(#stripeGradient)"
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="apple" 
                  stroke="hsl(var(--secondary))" 
                  fill="url(#appleGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">Stripe</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-secondary" />
                <span className="text-xs text-muted-foreground">App Store</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Subscription Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="h-[200px] w-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={planDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {planDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {planDistribution.map((plan) => (
                  <div key={plan.name} className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: plan.color }}
                    />
                    <div>
                      <p className="text-sm font-medium">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">{plan.value} users</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div 
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    tx.platform === 'stripe' ? 'bg-primary/10' : 'bg-secondary/10'
                  }`}>
                    {tx.platform === 'stripe' ? (
                      <CreditCard className="w-4 h-4 text-primary" />
                    ) : (
                      <Smartphone className="w-4 h-4 text-secondary-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{tx.user}</p>
                    <p className="text-xs text-muted-foreground">{tx.plan}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-500">+${tx.amount}</p>
                  <p className="text-xs text-muted-foreground">{tx.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integration Status */}
      <Card className="border-dashed border-2">
        <CardContent className="py-6">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-4">
              <Badge variant="outline" className="text-muted-foreground">
                <CreditCard className="w-3 h-3 mr-1" />
                Stripe: Not Connected
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                <Smartphone className="w-3 h-3 mr-1" />
                App Store: Not Connected
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Connect payment providers to see real revenue data
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import { useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  date: string;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface ExpenseChartsProps {
  transactions: Transaction[];
  categories: Category[];
}

const COLORS = [
  "hsl(172, 66%, 50%)",  // primary teal
  "hsl(200, 70%, 50%)",  // blue
  "hsl(280, 70%, 55%)",  // purple
  "hsl(45, 80%, 50%)",   // yellow
  "hsl(0, 70%, 55%)",    // red
  "hsl(140, 60%, 45%)",  // green
  "hsl(320, 70%, 55%)",  // pink
  "hsl(190, 80%, 50%)",  // cyan
];

const ExpenseCharts = ({ transactions, categories }: ExpenseChartsProps) => {
  const isMobile = useIsMobile();
  const expensesByCategory = useMemo(() => {
    const expenses = transactions.filter(t => t.type === "expense");
    const categoryMap = new Map<string, number>();
    
    expenses.forEach(expense => {
      const categoryId = expense.category_id || "sem-categoria";
      const current = categoryMap.get(categoryId) || 0;
      categoryMap.set(categoryId, current + Number(expense.amount));
    });

    const result = Array.from(categoryMap.entries()).map(([categoryId, total]) => {
      const category = categories.find(c => c.id === categoryId);
      return {
        name: category?.name || "Sem Categoria",
        value: total,
        color: category?.color || COLORS[0],
      };
    });

    return result.sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  const incomeVsExpense = useMemo(() => {
    const income = transactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = transactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return [
      { name: "Receitas", value: income, fill: "hsl(172, 66%, 50%)" },
      { name: "Despesas", value: expense, fill: "hsl(0, 70%, 55%)" },
    ];
  }, [transactions]);

  const dailyExpenses = useMemo(() => {
    const expenses = transactions.filter(t => t.type === "expense");
    const dayMap = new Map<string, number>();
    
    expenses.forEach(expense => {
      const day = new Date(expense.date).toLocaleDateString("pt-BR", { weekday: "short" });
      const current = dayMap.get(day) || 0;
      dayMap.set(day, current + Number(expense.amount));
    });

    return Array.from(dayMap.entries()).map(([day, total]) => ({
      day,
      total,
    }));
  }, [transactions]);

  if (transactions.length === 0) {
    return null;
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-foreground font-medium">{payload[0].name || payload[0].payload.name}</p>
          <p className="text-primary font-bold">
            R$ {payload[0].value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Pie Chart - Gastos por Categoria */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-4 sm:p-6 border-glow"
      >
        <h3 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4">Gastos por Categoria</h3>
        {expensesByCategory.length > 0 ? (
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={isMobile ? 35 : 50}
                  outerRadius={isMobile ? 60 : 80}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={isMobile ? false : ({ name, percent }) => 
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {expensesByCategory.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color || COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                {isMobile && <Legend wrapperStyle={{ fontSize: '12px' }} />}
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 sm:h-64 flex items-center justify-center text-muted-foreground text-sm sm:text-base">
            Sem despesas neste período
          </div>
        )}
      </motion.div>

      {/* Bar Chart - Receitas vs Despesas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-xl p-4 sm:p-6 border-glow"
      >
        <h3 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4">Receitas vs Despesas</h3>
        <div className="h-48 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={incomeVsExpense} layout="vertical">
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={isMobile ? 60 : 80}
                tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: isMobile ? 10 : 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                radius={[0, 8, 8, 0]}
                barSize={isMobile ? 30 : 40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Bar Chart - Gastos Diários */}
      {dailyExpenses.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-4 sm:p-6 border-glow lg:col-span-2"
        >
          <h3 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4">Gastos por Dia</h3>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyExpenses}>
                <XAxis 
                  dataKey="day" 
                  tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: isMobile ? 10 : 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: isMobile ? 10 : 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `R$${value}`}
                  width={isMobile ? 50 : 60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="total" 
                  fill="hsl(172, 66%, 50%)" 
                  radius={[8, 8, 0, 0]}
                  name="Total"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ExpenseCharts;

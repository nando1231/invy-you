import { useState } from "react";
import { motion } from "framer-motion";
import {
  Home,
  Car,
  Wifi,
  Zap,
  Droplet,
  CreditCard,
  ShoppingCart,
  Fuel,
  GraduationCap,
  Heart,
  Briefcase,
  DollarSign,
  Repeat,
  Plus,
  Trash2,
  Check,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RecurringTransaction,
  useRecurringTransactions,
} from "@/hooks/useRecurringTransactions";

const PRESET_ITEMS = [
  { description: "Salário", icon: "briefcase", type: "income" as const },
  { description: "Freelance", icon: "dollar-sign", type: "income" as const },
  { description: "Aluguel", icon: "home", type: "expense" as const },
  { description: "Carro", icon: "car", type: "expense" as const },
  { description: "Combustível", icon: "fuel", type: "expense" as const },
  { description: "Internet", icon: "wifi", type: "expense" as const },
  { description: "Luz", icon: "zap", type: "expense" as const },
  { description: "Água", icon: "droplet", type: "expense" as const },
  { description: "Cartão", icon: "credit-card", type: "expense" as const },
  { description: "Mercado", icon: "shopping-cart", type: "expense" as const },
  { description: "Educação", icon: "graduation-cap", type: "expense" as const },
  { description: "Saúde", icon: "heart", type: "expense" as const },
];

const iconMap: Record<string, React.ReactNode> = {
  home: <Home className="w-4 h-4" />,
  car: <Car className="w-4 h-4" />,
  fuel: <Fuel className="w-4 h-4" />,
  wifi: <Wifi className="w-4 h-4" />,
  zap: <Zap className="w-4 h-4" />,
  droplet: <Droplet className="w-4 h-4" />,
  "credit-card": <CreditCard className="w-4 h-4" />,
  "shopping-cart": <ShoppingCart className="w-4 h-4" />,
  "graduation-cap": <GraduationCap className="w-4 h-4" />,
  heart: <Heart className="w-4 h-4" />,
  briefcase: <Briefcase className="w-4 h-4" />,
  "dollar-sign": <DollarSign className="w-4 h-4" />,
  wallet: <Repeat className="w-4 h-4" />,
};

interface RecurringTransactionsProps {
  recurring: RecurringTransaction[];
  onAdd: (item: {
    type: "income" | "expense";
    amount: number;
    description: string;
    day_of_month: number;
    icon?: string;
  }) => void;
  onRemove: (id: string) => void;
}

const RecurringTransactions = ({
  recurring,
  onAdd,
  onRemove,
}: RecurringTransactionsProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<
    (typeof PRESET_ITEMS)[0] | null
  >(null);
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("1");
  const [customDesc, setCustomDesc] = useState("");
  const [customType, setCustomType] = useState<"income" | "expense">("expense");

  const handleSelectPreset = (preset: (typeof PRESET_ITEMS)[0]) => {
    setSelectedPreset(preset);
    setAmount("");
    setDay("5");
    setDialogOpen(true);
  };

  const handleAddCustom = () => {
    setSelectedPreset(null);
    setCustomDesc("");
    setCustomType("expense");
    setAmount("");
    setDay("5");
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    const desc = selectedPreset?.description || customDesc;
    const type = selectedPreset?.type || customType;
    if (!desc || !amount) return;

    onAdd({
      type,
      amount: parseFloat(amount),
      description: desc,
      day_of_month: parseInt(day),
      icon: selectedPreset?.icon || "wallet",
    });
    setDialogOpen(false);
  };

  // Filter out presets that are already added
  const existingDescs = new Set(recurring.map((r) => r.description));
  const availablePresets = PRESET_ITEMS.filter(
    (p) => !existingDescs.has(p.description)
  );

  return (
    <>
      <div className="glass rounded-xl border-glow p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-foreground text-sm">
              Fixos do Mês
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddCustom}
            className="text-primary text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Personalizado
          </Button>
        </div>

        {/* Active recurring items */}
        {recurring.length > 0 && (
          <div className="space-y-2">
            {recurring.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-2.5 bg-secondary/50 rounded-lg"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-1.5 rounded-lg ${
                      item.type === "income"
                        ? "bg-primary/10"
                        : "bg-destructive/10"
                    }`}
                  >
                    {iconMap[item.icon] || <Repeat className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {item.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Dia {item.day_of_month} • Todo mês
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-bold ${
                      item.type === "income"
                        ? "text-primary"
                        : "text-destructive"
                    }`}
                  >
                    {item.type === "income" ? "+" : "-"}R${" "}
                    {Number(item.amount).toLocaleString("pt-BR", {
                      minimumFractionDigits: 0,
                    })}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(item.id)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Quick add presets */}
        {availablePresets.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              Adicionar fixo:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {availablePresets.map((preset) => (
                <button
                  key={preset.description}
                  onClick={() => handleSelectPreset(preset)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    preset.type === "income"
                      ? "border-primary/30 text-primary hover:bg-primary/10"
                      : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {iconMap[preset.icon]}
                  {preset.description}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Monthly summary */}
        {recurring.length > 0 && (
          <div className="pt-3 border-t border-border flex justify-between text-xs">
            <div className="flex items-center gap-1 text-primary">
              <TrendingUp className="w-3 h-3" />
              <span className="font-medium">
                +R${" "}
                {recurring
                  .filter((r) => r.type === "income")
                  .reduce((s, r) => s + Number(r.amount), 0)
                  .toLocaleString("pt-BR")}
              </span>
            </div>
            <div className="flex items-center gap-1 text-destructive">
              <TrendingDown className="w-3 h-3" />
              <span className="font-medium">
                -R${" "}
                {recurring
                  .filter((r) => r.type === "expense")
                  .reduce((s, r) => s + Number(r.amount), 0)
                  .toLocaleString("pt-BR")}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Dialog for adding amount and day */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPreset
                ? iconMap[selectedPreset.icon]
                : <Repeat className="w-4 h-4" />}
              {selectedPreset
                ? `${selectedPreset.description} (${selectedPreset.type === "income" ? "Receita" : "Despesa"})`
                : "Novo Recorrente"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!selectedPreset && (
              <>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    placeholder="Ex: Netflix, Academia..."
                    value={customDesc}
                    onChange={(e) => setCustomDesc(e.target.value)}
                    className="bg-secondary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={customType === "expense" ? "default" : "outline"}
                    onClick={() => setCustomType("expense")}
                    size="sm"
                  >
                    <TrendingDown className="w-3 h-3 mr-1" />
                    Despesa
                  </Button>
                  <Button
                    type="button"
                    variant={customType === "income" ? "default" : "outline"}
                    onClick={() => setCustomType("income")}
                    size="sm"
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Receita
                  </Button>
                </div>
              </>
            )}

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                R$
              </span>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 text-2xl font-bold h-14 bg-secondary"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Dia do mês</Label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger className="bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      Dia {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleConfirm}
              variant="hero"
              className="w-full h-12"
              disabled={
                !amount ||
                parseFloat(amount) <= 0 ||
                (!selectedPreset && !customDesc)
              }
            >
              <Check className="w-4 h-4 mr-2" />
              Adicionar Fixo Mensal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RecurringTransactions;

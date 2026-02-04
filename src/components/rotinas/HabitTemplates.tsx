import { motion } from "framer-motion";
import { 
  Dumbbell, 
  Book, 
  Brain,
  Droplets,
  Moon,
  Apple,
  Pill,
  Languages,
  Pencil,
  Music,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HabitTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const defaultHabits: HabitTemplate[] = [
  { id: "exercise", name: "Exercício", icon: <Dumbbell className="w-4 h-4" /> },
  { id: "reading", name: "Leitura", icon: <Book className="w-4 h-4" /> },
  { id: "meditation", name: "Meditação", icon: <Brain className="w-4 h-4" /> },
  { id: "water", name: "Beber água", icon: <Droplets className="w-4 h-4" /> },
  { id: "sleep", name: "Dormir cedo", icon: <Moon className="w-4 h-4" /> },
  { id: "healthy", name: "Comer saudável", icon: <Apple className="w-4 h-4" /> },
  { id: "vitamins", name: "Tomar vitaminas", icon: <Pill className="w-4 h-4" /> },
  { id: "language", name: "Estudar idioma", icon: <Languages className="w-4 h-4" /> },
  { id: "journal", name: "Escrever diário", icon: <Pencil className="w-4 h-4" /> },
  { id: "music", name: "Praticar música", icon: <Music className="w-4 h-4" /> },
];

interface HabitTemplatesProps {
  onAddHabit: (name: string) => void;
  existingHabits: string[];
}

const HabitTemplates = ({ onAddHabit, existingHabits }: HabitTemplatesProps) => {
  const availableHabits = defaultHabits.filter(
    habit => !existingHabits.some(h => h.toLowerCase().includes(habit.name.toLowerCase().split(" ")[0]))
  );

  if (availableHabits.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Adicionar Hábitos Sugeridos</h3>
      <div className="flex flex-wrap gap-2">
        {availableHabits.slice(0, 6).map((habit, index) => (
          <motion.div
            key={habit.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddHabit(habit.name)}
              className="flex items-center gap-2 h-9 px-3 bg-secondary/50 hover:bg-primary/20 hover:border-primary/50 transition-all"
            >
              {habit.icon}
              <span className="text-xs sm:text-sm">{habit.name}</span>
              <Plus className="w-3 h-3 opacity-50" />
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HabitTemplates;

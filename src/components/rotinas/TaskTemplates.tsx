import { motion } from "framer-motion";
import { 
  Coffee, 
  Dumbbell, 
  Book, 
  Moon, 
  Droplets,
  Apple,
  Brain,
  Clock,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaskTemplate {
  id: string;
  title: string;
  icon: React.ReactNode;
  description?: string;
  priority: "low" | "medium" | "high";
}

const defaultTasks: TaskTemplate[] = [
  { id: "water", title: "Beber 2L de água", icon: <Droplets className="w-4 h-4" />, priority: "high" },
  { id: "exercise", title: "Exercício físico", icon: <Dumbbell className="w-4 h-4" />, priority: "high" },
  { id: "reading", title: "Ler 30 minutos", icon: <Book className="w-4 h-4" />, priority: "medium" },
  { id: "meditation", title: "Meditar 10 minutos", icon: <Brain className="w-4 h-4" />, priority: "medium" },
  { id: "breakfast", title: "Café da manhã saudável", icon: <Coffee className="w-4 h-4" />, priority: "medium" },
  { id: "healthy-food", title: "Alimentação saudável", icon: <Apple className="w-4 h-4" />, priority: "medium" },
  { id: "sleep", title: "Dormir 8 horas", icon: <Moon className="w-4 h-4" />, priority: "high" },
  { id: "focus", title: "Foco no trabalho", icon: <Clock className="w-4 h-4" />, priority: "high" },
];

interface TaskTemplatesProps {
  onAddTask: (title: string, priority: "low" | "medium" | "high") => void;
  existingTasks: string[];
}

const TaskTemplates = ({ onAddTask, existingTasks }: TaskTemplatesProps) => {
  const availableTasks = defaultTasks.filter(
    task => !existingTasks.some(t => t.toLowerCase().includes(task.title.toLowerCase().split(" ")[0]))
  );

  if (availableTasks.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Adicionar Tarefas Diárias</h3>
      <div className="flex flex-wrap gap-2">
        {availableTasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddTask(task.title, task.priority)}
              className="flex items-center gap-2 h-9 px-3 bg-secondary/50 hover:bg-primary/20 hover:border-primary/50 transition-all"
            >
              {task.icon}
              <span className="text-xs sm:text-sm">{task.title}</span>
              <Plus className="w-3 h-3 opacity-50" />
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TaskTemplates;

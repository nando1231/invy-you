
-- Table for recurring monthly transactions (salary, rent, etc.)
CREATE TABLE public.recurring_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'income' or 'expense'
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  day_of_month INTEGER NOT NULL DEFAULT 1, -- which day to generate (1-28)
  icon TEXT DEFAULT 'wallet',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recurring" ON public.recurring_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own recurring" ON public.recurring_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recurring" ON public.recurring_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recurring" ON public.recurring_transactions FOR DELETE USING (auth.uid() = user_id);

-- Table to track which recurring transactions were already generated for which month
CREATE TABLE public.recurring_transaction_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recurring_id UUID NOT NULL REFERENCES public.recurring_transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  generated_for_month TEXT NOT NULL, -- format: '2026-02'
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(recurring_id, generated_for_month)
);

ALTER TABLE public.recurring_transaction_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs" ON public.recurring_transaction_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own logs" ON public.recurring_transaction_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Security constraints: amount validation and achievement key whitelist

-- Transactions: amount must be positive and within a sane range
ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_amount_positive CHECK (amount > 0),
  ADD CONSTRAINT transactions_amount_max CHECK (amount <= 9999999.99);

-- Goals: target and current values must be non-negative
ALTER TABLE public.goals
  ADD CONSTRAINT goals_target_positive CHECK (target_value >= 0),
  ADD CONSTRAINT goals_current_nonneg CHECK (current_value >= 0);

-- Categories: budget_limit must be non-negative
ALTER TABLE public.categories
  ADD CONSTRAINT categories_budget_limit_nonneg CHECK (budget_limit >= 0);

-- Profiles: budget_total must be non-negative
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_budget_total_nonneg CHECK (budget_total >= 0);

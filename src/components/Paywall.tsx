interface PaywallProps {
  children: React.ReactNode;
}

// Free access model - no paywall needed
export const Paywall = ({ children }: PaywallProps) => {
  return <>{children}</>;
};

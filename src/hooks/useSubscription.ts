// Free access model - no subscriptions or trials
export const useSubscription = () => {
  return {
    subscribed: true,
    isTrial: false,
    isFreeTrial: false,
    trialDaysRemaining: null,
    productId: null,
    subscriptionEnd: null,
    loading: false,
    error: null,
    checkSubscription: async () => {},
    createCheckout: async () => {},
    openCustomerPortal: async () => {},
  };
};

import { useAuth } from '../context/AuthContext';

export const useSubscription = () => {
  const auth = useAuth();
  
  // Keep the same interface for backward compatibility
  return {
    ...auth,
    login: auth.loginWithGoogle // existing alias
  };
};

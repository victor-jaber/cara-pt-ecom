import { useQuery } from "@tanstack/react-query";
import { getQueryFn, queryClient } from "@/lib/queryClient";
import { getStoredAuthUser, saveAuthUser, clearStoredAuthUser } from "@/lib/authPersistence";
import type { User } from "@shared/schema";
import { useEffect } from "react";

export function useAuth() {
  // Try to get stored user from localStorage as initial data
  const storedUser = getStoredAuthUser();
  
  const { data: user, isLoading, error, isFetched } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    // Use stored user as initial data so it's available immediately
    initialData: storedUser,
    // Don't consider initialData as "stale" - only refetch on mount
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Sync localStorage with server response
  useEffect(() => {
    if (isFetched) {
      if (user) {
        // User is authenticated, update localStorage
        saveAuthUser(user);
      } else if (!user && storedUser) {
        // Server says not authenticated but we have stored user
        // This means session expired, clear localStorage
        clearStoredAuthUser();
      }
    }
  }, [user, isFetched, storedUser]);

  return {
    user,
    isLoading: isLoading && !storedUser, // Don't show loading if we have stored user
    isAuthenticated: !!user,
    isApproved: user?.status === "approved",
    isPending: user?.status === "pending",
    isRejected: user?.status === "rejected",
    isAdmin: user?.role === "admin",
    error,
  };
}

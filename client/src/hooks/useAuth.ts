import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isApproved: user?.status === "approved",
    isPending: user?.status === "pending",
    isRejected: user?.status === "rejected",
    isAdmin: user?.role === "admin",
    error,
  };
}

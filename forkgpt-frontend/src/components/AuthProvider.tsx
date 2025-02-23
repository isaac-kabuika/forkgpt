import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../client-state/hooks";
import { initializeAuth, setUser } from "../client-state/slices/authSlice";
import { supabase } from "../supabase";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);
  const initialized = useRef(false);

  useEffect(() => {
    async function initAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session && !initialized.current) {
        initialized.current = true;
        dispatch(initializeAuth());
      } else if (session && !initialized.current) {
        initialized.current = true;
        dispatch(setUser(session.user));
      }
    }
    initAuth();
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Connecting to ForkGPT...</p>
      </div>
    );
  }

  return <>{children}</>;
}

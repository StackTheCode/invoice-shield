import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {

    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();


    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/login")
        }
    }, [isAuthenticated, loading, router])







    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center ">
                <div className="text-center">
                    <svg className="animate-spin h-12 w-12 text-slate-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-slate-400">Loading...</p>
                </div>
            </div>
        )
    }

      if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;

}
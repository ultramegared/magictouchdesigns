import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { apiRequest } from "../../services/api";

interface AuthenticatedUser { id: string; username: string; role: string; }
interface AdminRouteProps { children: React.ReactNode; }

function AdminRoute({ children }: AdminRouteProps) {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<AuthenticatedUser | null>(null);

    useEffect(() => {
        const verifyAdministrator = async () => {
            const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
            if (!token) { setLoading(false); return; }
            try {
                const result = await apiRequest<{ status: string; user: AuthenticatedUser }>("/api/user/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (result.user.role === "ADMIN") setUser(result.user);
                else { localStorage.removeItem("auth_token"); localStorage.removeItem("auth_user"); sessionStorage.removeItem("auth_token"); }
            } catch (error) {
                console.error("Administrator verification error:", error);
                localStorage.removeItem("auth_token");
                localStorage.removeItem("auth_user");
                sessionStorage.removeItem("auth_token");
            } finally { setLoading(false); }
        };
        void verifyAdministrator();
    }, []);

    if (loading) return null;
    if (!user) return <Navigate to="/admin-login" replace />;
    return children;
}

export default AdminRoute;

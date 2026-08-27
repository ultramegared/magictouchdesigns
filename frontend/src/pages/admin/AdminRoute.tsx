/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: AdminRoute.tsx
 * Module: Administrator Route Protection
 * Language: TypeScript React
 * Description:
 * Protects administrator-only frontend routes.
 * ================================================================
 */

import {
    useEffect,
    useState,
} from "react";

import {
    Navigate,
} from "react-router-dom";

import {
    apiRequest,
} from "../../services/api";


interface AuthenticatedUser {

    id: string;

    username: string;

    role: string;

}


interface AdminRouteProps {

    children: React.ReactNode;

}


function AdminRoute({
    children,
}: AdminRouteProps) {

    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        user,
        setUser,
    ] = useState<
        AuthenticatedUser | null
    >(
        null
    );


    useEffect(() => {

        const verifyAdministrator =
            async () => {

                const token =
                    localStorage.getItem(
                        "auth_token"
                    );


                if (!token) {

                    setLoading(
                        false
                    );

                    return;

                }


                try {

                    const result =
                        await apiRequest<{
                            status: string;

                            user:
                                AuthenticatedUser;
                        }>(
                            "/api/user/me",
                            {
                                headers: {

                                    Authorization:
                                        `Bearer ${token}`,

                                },

                            }
                        );


                    setUser(
                        result.user
                    );

                } catch (error) {

                    console.error(
                        "Administrator verification error:",
                        error
                    );


                    localStorage.removeItem(
                        "auth_token"
                    );


                    localStorage.removeItem(
                        "auth_user"
                    );

                } finally {

                    setLoading(
                        false
                    );

                }

            };


        verifyAdministrator();

    }, []);


    if (loading) {

        return null;

    }


    if (!user) {

        return (

            <Navigate
                to="/login"
                replace
            />

        );

    }


    if (
        user.role !==
        "ADMIN"
    ) {

        return (

            <Navigate
                to="/account"
                replace
            />

        );

    }


    return children;

}


export default AdminRoute;
/**
 * ===============================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: PublicRoutes.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Public application routes.
 * ===============================================================
 */

import {

    Route

} from "react-router-dom";

import HomePage from "../pages/Home";

function PublicRoutes() {

    return (

        <>

            <Route

                path="/"

                element={

                    <HomePage />

                }

            />

        </>

    );

}

export default PublicRoutes;
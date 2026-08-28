/**
 * ================================================================
 * Project: Magic Touch Designs
 * Author: ultramegared
 * File: AdminSettings.tsx
 * Module: Administrator Panel
 * Language: TypeScript React
 * Description:
 * Administrative settings management page.
 * ================================================================
 */

import {
    useEffect,
    useState,
} from "react";

import {
    Bell,
    Building2,
    Globe,
    Mail,
    Save,
    Settings,
} from "lucide-react";

import AdminSidebar from "./AdminSidebar";

import {
    apiRequest,
} from "../../services/api";

import "./AdminSettings.css";


/* ===============================================================
   TYPES
================================================================ */

interface CurrentUser {

    username: string;

}


/* ===============================================================
   COMPONENT
================================================================ */

function AdminSettings() {

    const [
        currentUser,
        setCurrentUser,
    ] = useState<CurrentUser | null>(
        null
    );


    const [
        storeName,
        setStoreName,
    ] = useState(
        "Magic Touch Designs"
    );


    const [
        supportEmail,
        setSupportEmail,
    ] = useState(
        ""
    );


    const [
        notificationsEnabled,
        setNotificationsEnabled,
    ] = useState(
        true
    );


    const [
        saving,
        setSaving,
    ] = useState(
        false
    );


    const [
        message,
        setMessage,
    ] = useState<string | null>(
        null
    );


    /* ============================================================
       LOAD CURRENT USER
    ============================================================ */

    useEffect(() => {

        const loadCurrentUser =
            async () => {

                try {

                    const result =
                        await apiRequest<{
                            status: string;

                            user: CurrentUser;
                        }>(
                            "/api/user/me"
                        );


                    setCurrentUser(
                        result.user
                    );

                } catch (error) {

                    console.error(
                        "Unable to load administrator:",
                        error
                    );

                }

            };


        loadCurrentUser();

    }, []);


    /* ============================================================
       SAVE SETTINGS
    ============================================================ */

    const handleSave =
        async () => {

            try {

                setSaving(
                    true
                );


                setMessage(
                    null
                );


                /*
                 * Settings API will be connected
                 * when the backend configuration
                 * endpoint is created.
                 */


                await new Promise(
                    (
                        resolve
                    ) => {

                        setTimeout(
                            resolve,
                            500
                        );

                    }
                );


                setMessage(
                    "Settings saved successfully."
                );

            } catch (error) {

                console.error(
                    "Unable to save settings:",
                    error
                );


                setMessage(
                    "Unable to save settings."
                );

            } finally {

                setSaving(
                    false
                );

            }

        };


    return (

        <div
            className="admin-layout"
        >


            {/* ======================================================
                SIDEBAR
               ====================================================== */}

            <AdminSidebar
                username={
                    currentUser?.username
                        || "Administrator"
                }
            />


            {/* ======================================================
                MAIN
               ====================================================== */}

            <main
                className="admin-settings"
            >


                {/* ==================================================
                    HERO
                   ================================================== */}

                <section
                    className="admin-settings__hero"
                >

                    <div
                        className="admin-settings__hero-content"
                    >

                        <div>

                            <span
                                className="admin-settings__eyebrow"
                            >

                                ADMINISTRATION

                            </span>


                            <h1>

                                Settings

                            </h1>


                            <p>

                                Manage your store preferences
                                and administrative settings.

                            </p>

                        </div>


                        <div
                            className="admin-settings__hero-icon"
                        >

                            <Settings
                                size={42}
                            />

                        </div>

                    </div>

                </section>


                {/* ==================================================
                    CONTENT
                   ================================================== */}

                <section
                    className="admin-settings__container"
                >


                    {/* ==============================================
                        STORE SETTINGS
                       ============================================== */}

                    <section
                        className="admin-settings__section"
                    >

                        <div
                            className="admin-settings__section-header"
                        >

                            <div
                                className="admin-settings__section-title"
                            >

                                <div
                                    className="admin-settings__section-icon"
                                >

                                    <Building2
                                        size={22}
                                    />

                                </div>


                                <div>

                                    <span>

                                        BUSINESS

                                    </span>


                                    <h2>

                                        Store Settings

                                    </h2>

                                </div>

                            </div>

                        </div>


                        <div
                            className="admin-settings__card"
                        >


                            <div
                                className="admin-settings__field"
                            >

                                <label
                                    htmlFor="store-name"
                                >

                                    Store Name

                                </label>


                                <div
                                    className="admin-settings__input-wrapper"
                                >

                                    <Building2
                                        size={18}
                                    />


                                    <input
                                        id="store-name"
                                        type="text"
                                        value={
                                            storeName
                                        }
                                        onChange={
                                            (
                                                event
                                            ) =>

                                                setStoreName(
                                                    event.target.value
                                                )
                                        }
                                    />

                                </div>

                            </div>


                            <div
                                className="admin-settings__field"
                            >

                                <label
                                    htmlFor="support-email"
                                >

                                    Support Email

                                </label>


                                <div
                                    className="admin-settings__input-wrapper"
                                >

                                    <Mail
                                        size={18}
                                    />


                                    <input
                                        id="support-email"
                                        type="email"
                                        placeholder="support@example.com"
                                        value={
                                            supportEmail
                                        }
                                        onChange={
                                            (
                                                event
                                            ) =>

                                                setSupportEmail(
                                                    event.target.value
                                                )
                                        }
                                    />

                                </div>

                            </div>

                        </div>

                    </section>


                    {/* ==============================================
                        WEBSITE SETTINGS
                       ============================================== */}

                    <section
                        className="admin-settings__section"
                    >

                        <div
                            className="admin-settings__section-header"
                        >

                            <div
                                className="admin-settings__section-title"
                            >

                                <div
                                    className="admin-settings__section-icon"
                                >

                                    <Globe
                                        size={22}
                                    />

                                </div>


                                <div>

                                    <span>

                                        WEBSITE

                                    </span>


                                    <h2>

                                        Website Preferences

                                    </h2>

                                </div>

                            </div>

                        </div>


                        <div
                            className="admin-settings__card"
                        >

                            <div
                                className="admin-settings__preference"
                            >

                                <div>

                                    <h3>

                                        Customer Notifications

                                    </h3>


                                    <p>

                                        Enable notifications
                                        for important customer
                                        activity.

                                    </p>

                                </div>


                                <button
                                    type="button"
                                    className={
                                        notificationsEnabled

                                            ? "admin-settings__toggle admin-settings__toggle--active"

                                            : "admin-settings__toggle"
                                    }
                                    onClick={() =>

                                        setNotificationsEnabled(
                                            (
                                                currentValue
                                            ) =>

                                                !currentValue
                                        )
                                    }
                                    aria-pressed={
                                        notificationsEnabled
                                    }
                                >

                                    <span />

                                </button>

                            </div>


                            <div
                                className="admin-settings__preference-icon"
                            >

                                <Bell
                                    size={20}
                                />

                            </div>

                        </div>

                    </section>


                    {/* ==============================================
                        SAVE
                       ============================================== */}

                    <div
                        className="admin-settings__footer"
                    >

                        {message && (

                            <span
                                className="admin-settings__message"
                            >

                                {message}

                            </span>

                        )}


                        <button
                            type="button"
                            className="admin-settings__save"
                            onClick={
                                handleSave
                            }
                            disabled={
                                saving
                            }
                        >

                            <Save
                                size={19}
                            />


                            {
                                saving

                                    ? "Saving..."

                                    : "Save Settings"
                            }

                        </button>

                    </div>

                </section>

            </main>

        </div>

    );

}


export default AdminSettings;ñ
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
    Image,
    Mail,
    Save,
    Settings,
    Type,
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

    /* ============================================================
       CURRENT USER
    ============================================================ */

    const [
        currentUser,
        setCurrentUser,
    ] = useState<CurrentUser | null>(
        null
    );


    /* ============================================================
       BUSINESS SETTINGS
    ============================================================ */

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


    /* ============================================================
       WEBSITE SETTINGS
    ============================================================ */

    const [
        websiteName,
        setWebsiteName,
    ] = useState(
        "Magic Touch Designs"
    );


    const [
        browserTitle,
        setBrowserTitle,
    ] = useState(
        "Magic Touch Designs | Personalized Gifts & Designs"
    );


    const [
        logoUrl,
        setLogoUrl,
    ] = useState(
        ""
    );


    /* ============================================================
       NOTIFICATIONS
    ============================================================ */

    const [
        notificationsEnabled,
        setNotificationsEnabled,
    ] = useState(
        true
    );


    /* ============================================================
       UI STATE
    ============================================================ */

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


                /*
                 * Temporary browser title preview.
                 * The permanent value will later
                 * come from the backend settings.
                 */

                document.title =
                    browserTitle;


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

                                Manage your store preferences,
                                website identity and
                                administrative settings.

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


                            {/* STORE NAME */}

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


                            {/* SUPPORT EMAIL */}

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
                        WEBSITE IDENTITY
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

                                        Website Identity

                                    </h2>

                                </div>

                            </div>

                        </div>


                        <div
                            className="admin-settings__card"
                        >


                            {/* WEBSITE NAME */}

                            <div
                                className="admin-settings__field"
                            >

                                <label
                                    htmlFor="website-name"
                                >

                                    Website Name

                                </label>


                                <div
                                    className="admin-settings__input-wrapper"
                                >

                                    <Type
                                        size={18}
                                    />


                                    <input
                                        id="website-name"
                                        type="text"
                                        value={
                                            websiteName
                                        }
                                        onChange={
                                            (
                                                event
                                            ) =>

                                                setWebsiteName(
                                                    event.target.value
                                                )
                                        }
                                    />

                                </div>

                            </div>


                            {/* BROWSER TITLE */}

                            <div
                                className="admin-settings__field"
                            >

                                <label
                                    htmlFor="browser-title"
                                >

                                    Browser Title

                                </label>


                                <div
                                    className="admin-settings__input-wrapper"
                                >

                                    <Globe
                                        size={18}
                                    />


                                    <input
                                        id="browser-title"
                                        type="text"
                                        value={
                                            browserTitle
                                        }
                                        onChange={
                                            (
                                                event
                                            ) =>

                                                setBrowserTitle(
                                                    event.target.value
                                                )
                                        }
                                    />

                                </div>

                            </div>


                            {/* WEBSITE LOGO */}

                            <div
                                className="admin-settings__field"
                            >

                                <label
                                    htmlFor="website-logo"
                                >

                                    Website Logo

                                </label>


                                <div
                                    className="admin-settings__input-wrapper"
                                >

                                    <Image
                                        size={18}
                                    />


                                    <input
                                        id="website-logo"
                                        type="url"
                                        placeholder="https://example.com/logo.png"
                                        value={
                                            logoUrl
                                        }
                                        onChange={
                                            (
                                                event
                                            ) =>

                                                setLogoUrl(
                                                    event.target.value
                                                )
                                        }
                                    />

                                </div>

                            </div>


                            {/* LOGO PREVIEW */}

                            {logoUrl && (

                                <div
                                    className="admin-settings__logo-preview"
                                >

                                    <span>

                                        Logo Preview

                                    </span>


                                    <img
                                        src={
                                            logoUrl
                                        }
                                        alt={
                                            websiteName
                                        }
                                    />

                                </div>

                            )}

                        </div>

                    </section>


                    {/* ==============================================
                        WEBSITE PREFERENCES
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

                                    <Bell
                                        size={22}
                                    />

                                </div>


                                <div>

                                    <span>

                                        PREFERENCES

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

                                        Enable administrative
                                        notifications for important
                                        customer activity.

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


export default AdminSettings;
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
    useRef,
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
    Upload,
    Trash2,
    LoaderCircle,
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


interface SettingsData {

    websiteName:
        string;

    browserTitle:
        string;

    slogan:
        string;

    logoUrl:
        string | null;

    supportEmail:
        string;

    notificationsEnabled:
        boolean;

}


interface UploadResponse {

    status:
        string;

    message:
        string;

    image_url:
        string;

}


/* ===============================================================
   COMPONENT
================================================================ */

function AdminSettings() {

    /* ============================================================
       REFERENCES
    ============================================================ */

    const fileInputRef =
        useRef<HTMLInputElement>(
            null
        );


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
        uploadingLogo,
        setUploadingLogo,
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
       LOAD SETTINGS
    ============================================================ */

    useEffect(() => {

        const loadSettings =
            async () => {

                try {

                    const result =
                        await apiRequest<{
                            status: string;

                            settings:
                                SettingsData;
                        }>(
                            "/api/settings"
                        );


                    const settings =
                        result.settings;


                    setStoreName(
                        settings.websiteName
                    );


                    setWebsiteName(
                        settings.websiteName
                    );


                    setBrowserTitle(
                        settings.browserTitle
                    );


                    setLogoUrl(
                        settings.logoUrl
                        ?? ""
                    );


                    setSupportEmail(
                        settings.supportEmail
                    );


                    setNotificationsEnabled(
                        settings.notificationsEnabled
                    );


                    document.title =
                        settings.browserTitle;

                } catch (error) {

                    console.error(
                        "Unable to load settings:",
                        error
                    );

                }

            };


        loadSettings();

    }, []);


    /* ============================================================
       LOGO UPLOAD
    ============================================================ */

    const handleLogoUpload =
        async (
            event:
                React.ChangeEvent<HTMLInputElement>
        ) => {

            const file =
                event.target.files?.[0];


            if (!file) {

                return;

            }


            try {

                setUploadingLogo(
                    true
                );


                setMessage(
                    null
                );


                const formData =
                    new FormData();


                formData.append(
                    "image",
                    file
                );


                const result =
                    await apiRequest<UploadResponse>(
                        "/api/upload",
                        {

                            method:
                                "POST",

                            body:
                                formData,

                        }
                    );


                setLogoUrl(
                    result.image_url
                );


                setMessage(
                    "Logo uploaded successfully. Click Save Settings to apply it."
                );

            } catch (error) {

                console.error(
                    "Unable to upload logo:",
                    error
                );


                setMessage(
                    error instanceof Error

                        ? error.message

                        : "Unable to upload logo."
                );

            } finally {

                setUploadingLogo(
                    false
                );


                if (
                    fileInputRef.current
                ) {

                    fileInputRef.current.value =
                        "";

                }

            }

        };


    /* ============================================================
       REMOVE LOGO
    ============================================================ */

    const handleRemoveLogo =
        () => {

            setLogoUrl(
                ""
            );


            setMessage(
                "Logo removed. Click Save Settings to apply the change."
            );

        };


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


                const result =
                    await apiRequest<{
                        status: string;

                        message:
                            string;

                        settings:
                            SettingsData;
                    }>(
                        "/api/settings",
                        {

                            method:
                                "PUT",

                            body:
                                JSON.stringify({

                                    websiteName,

                                    browserTitle,

                                    logoUrl:
                                        logoUrl
                                        || null,

                                    supportEmail,

                                    notificationsEnabled,

                                }),

                        }
                    );


                const settings =
                    result.settings;


                setStoreName(
                    settings.websiteName
                );


                setWebsiteName(
                    settings.websiteName
                );


                setBrowserTitle(
                    settings.browserTitle
                );


                setLogoUrl(
                    settings.logoUrl
                    ?? ""
                );


                setSupportEmail(
                    settings.supportEmail
                );


                setNotificationsEnabled(
                    settings.notificationsEnabled
                );


                document.title =
                    settings.browserTitle;


                setMessage(
                    result.message
                    || "Settings saved successfully."
                );

            } catch (error) {

                console.error(
                    "Unable to save settings:",
                    error
                );


                setMessage(
                    error instanceof Error

                        ? error.message

                        : "Unable to save settings."
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

            <AdminSidebar
                username={
                    currentUser?.username
                        || "Administrator"
                }
            />


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
                                            event => {

                                                const value =
                                                    event.target.value;


                                                setStoreName(
                                                    value
                                                );


                                                setWebsiteName(
                                                    value
                                                );

                                            }
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
                                            event =>

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
                                            event => {

                                                const value =
                                                    event.target.value;


                                                setWebsiteName(
                                                    value
                                                );


                                                setStoreName(
                                                    value
                                                );

                                            }
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
                                            event =>

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


                                <input
                                    ref={
                                        fileInputRef
                                    }
                                    id="website-logo"
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={
                                        handleLogoUpload
                                    }
                                    hidden
                                />


                                <button
                                    type="button"
                                    className="admin-settings__logo-upload"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    disabled={
                                        uploadingLogo
                                    }
                                >

                                    {

                                        uploadingLogo

                                            ? (

                                                <LoaderCircle
                                                    size={19}
                                                />

                                            )

                                            : (

                                                <Upload
                                                    size={19}
                                                />

                                            )

                                    }


                                    <span>

                                        {

                                            uploadingLogo

                                                ? "Uploading logo..."

                                                : "Choose Logo from Device"

                                        }

                                    </span>

                                </button>


                                <small
                                    className="admin-settings__field-help"
                                >

                                    PNG, JPG or WEBP.
                                    Maximum size: 5 MB.

                                </small>

                            </div>


                            {/* LOGO PREVIEW */}

                            {logoUrl && (

                                <div
                                    className="admin-settings__logo-preview"
                                >

                                    <div
                                        className="admin-settings__logo-preview-header"
                                    >

                                        <span>

                                            Logo Preview

                                        </span>


                                        <button
                                            type="button"
                                            onClick={
                                                handleRemoveLogo
                                            }
                                            aria-label="Remove logo"
                                        >

                                            <Trash2
                                                size={17}
                                            />

                                        </button>

                                    </div>


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
                                            currentValue =>

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
                                || uploadingLogo
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
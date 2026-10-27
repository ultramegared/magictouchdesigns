import { useCallback, useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import { apiRequest } from "../../services/api";
import "./AdminCleanup.css";

type PendingRequest = {
  id: string;
  request_code: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
};

type OrphanAsset = {
  public_id: string;
  secure_url: string;
  bytes: number;
  created_at: string;
  folder: string;
  reason: string;
};

type ModalKind = "requests" | "email" | "cloudinary" | null;

const formatBytes = (bytes: number) => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
};

const formatDate = (value: string) => {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

export default function AdminCleanup() {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [orphans, setOrphans] = useState<OrphanAsset[]>([]);
  const [orphanTotal, setOrphanTotal] = useState<number | null>(null);
  const [orphanReferenced, setOrphanReferenced] = useState<number | null>(null);
  const [selectedOrphans, setSelectedOrphans] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState<ModalKind>(null);
  const [busy, setBusy] = useState(false);

  const loadRequests = useCallback(async () => {
    const response = await apiRequest<{ requests: PendingRequest[] }>(
      "/api/admin/cleanup/custom-requests"
    );
    setRequests(response.requests || []);
  }, []);

  const loadOrphans = useCallback(async () => {
    try {
      const response = await apiRequest<{
        total: number;
        referenced: number;
        orphans: OrphanAsset[];
      }>("/api/admin/cleanup/cloudinary/orphans");
      setOrphanTotal(response.total);
      setOrphanReferenced(response.referenced);
      setOrphans(response.orphans || []);
    } catch (err) {
      setOrphans([]);
      setOrphanTotal(null);
      setOrphanReferenced(null);
      setError(
        err instanceof Error
          ? `Cloudinary scan unavailable: ${err.message}`
          : "Cloudinary scan unavailable."
      );
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await loadRequests();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load pending requests."
      );
    }
    await loadOrphans();
    setLoading(false);
  }, [loadRequests, loadOrphans]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const toggleInSet = (set: Set<string>, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };

  const confirmRequestsDelete = async () => {
    setBusy(true);
    try {
      const ids = [...selectedRequests];
      const result = await apiRequest<{
        deleted: number;
        deletedCodes: string[];
        skipped: Array<{ id: string; reason: string }>;
      }>("/api/admin/cleanup/custom-requests/delete", {
        method: "POST",
        body: JSON.stringify({ ids }),
      });
      setNotice(
        `Deleted ${result.deleted} pending custom request(s)` +
          (result.deletedCodes.length
            ? ` (${result.deletedCodes.join(", ")})`
            : "") +
          (result.skipped.length
            ? `. Skipped ${result.skipped.length} (not pending or not found).`
            : ".")
      );
      setSelectedRequests(new Set());
      await loadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete requests.");
    } finally {
      setBusy(false);
      setModal(null);
    }
  };

  const confirmEmailPurge = async () => {
    setBusy(true);
    try {
      const result = await apiRequest<{ deleted: number }>(
        "/api/admin/cleanup/email-logs/purge-90d",
        { method: "POST" }
      );
      setNotice(`Deleted ${result.deleted} email log(s) older than 90 days.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to purge email logs.");
    } finally {
      setBusy(false);
      setModal(null);
    }
  };

  const confirmCloudinaryDelete = async () => {
    setBusy(true);
    try {
      const publicIds = [...selectedOrphans];
      const result = await apiRequest<{
        deleted: Array<{ public_id: string; verified: boolean }>;
        failed: Array<{ public_id: string; detail: string }>;
        skipped: Array<{ public_id: string; reason: string }>;
      }>("/api/admin/cleanup/cloudinary/delete", {
        method: "POST",
        body: JSON.stringify({ public_ids: publicIds }),
      });
      const verified = result.deleted.filter((item) => item.verified).length;
      setNotice(
        `Cloudinary: deleted ${result.deleted.length} asset(s), ${verified} verified gone via the Admin API` +
          (result.failed.length ? `, ${result.failed.length} failed` : "") +
          (result.skipped.length
            ? `, ${result.skipped.length} skipped (still referenced or outside store folders).`
            : ".")
      );
      setSelectedOrphans(new Set());
      await loadOrphans();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete Cloudinary assets."
      );
    } finally {
      setBusy(false);
      setModal(null);
    }
  };

  const modalTitle =
    modal === "requests"
      ? `Delete ${selectedRequests.size} pending custom request(s)?`
      : modal === "email"
        ? "Delete all email logs older than 90 days?"
        : modal === "cloudinary"
          ? `Delete ${selectedOrphans.size} Cloudinary orphan(s)?`
          : "";
  const modalBody =
    modal === "requests"
      ? "Only requests still in status 'pending' will be deleted. Paid or cancelled requests are protected by the server and will be skipped. This cannot be undone."
      : modal === "email"
        ? "Only email log rows older than 90 days will be deleted (server-side date filter). Recent logs are untouched. This cannot be undone."
        : modal === "cloudinary"
          ? "Only the selected assets will be deleted, and only if they are still unreferenced at delete time. Referenced assets are refused by the server. Each deletion is verified via the Cloudinary Admin API. This cannot be undone."
          : "";

  return (
    <div className="admin-layout cleanup-page">
      <AdminSidebar />
      <main className="admin-settings cleanup-main">
        <section className="admin-settings__hero">
          <div>
            <h1>Cleanup</h1>
            <p>
              Remove test leftovers and unreferenced files. Paid orders, real
              customers, real reviews, subscribers and live-referenced images
              are never touched here.
            </p>
          </div>
          <button type="button" className="btn" onClick={() => void loadAll()} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </section>

        <section className="admin-settings__container">
          {error && <div className="admin-settings__message">{error}</div>}
          {notice && <div className="admin-settings__message">{notice}</div>}

          <h2>Pending custom requests</h2>
          <p>
            Requests still awaiting payment. Select test or stale rows and
            delete them. Paid requests never appear here.
          </p>
          {requests.length === 0 ? (
            <div className="cleanup-empty">No pending custom requests.</div>
          ) : (
            <>
              <div className="cleanup-table-wrap">
                <table className="cleanup-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          aria-label="Select all pending requests"
                          checked={
                            requests.length > 0 &&
                            selectedRequests.size === requests.length
                          }
                          onChange={() =>
                            setSelectedRequests(
                              selectedRequests.size === requests.length
                                ? new Set()
                                : new Set(requests.map((item) => item.id))
                            )
                          }
                        />
                      </th>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`Select ${item.request_code}`}
                            checked={selectedRequests.has(item.id)}
                            onChange={() =>
                              setSelectedRequests(toggleInSet(selectedRequests, item.id))
                            }
                          />
                        </td>
                        <td><strong>{item.request_code}</strong></td>
                        <td>{item.name}</td>
                        <td>{item.email}</td>
                        <td>{formatDate(item.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                className="btn danger"
                disabled={selectedRequests.size === 0 || busy}
                onClick={() => setModal("requests")}
              >
                Delete selected ({selectedRequests.size})
              </button>
            </>
          )}

          <h2>Email logs older than 90 days</h2>
          <p>
            One action, no selection: the server deletes only rows older than
            90 days. There is no delete control for recent logs.
          </p>
          <button
            type="button"
            className="btn danger"
            disabled={busy}
            onClick={() => setModal("email")}
          >
            Purge logs older than 90 days
          </button>

          <h2>Cloudinary orphans</h2>
          <p>
            {orphanTotal === null
              ? "The Cloudinary scan could not run (check the message above)."
              : `${orphanTotal} image asset(s) under magic-touch-designs/, ${orphanReferenced} public_id(s) referenced by live content, ${orphans.length} orphan(s) found.`}{" "}
            An orphan means no live product, review, portfolio item or site
            setting references it. The server re-checks every id before
            deleting.
          </p>
          {orphans.length === 0 ? (
            <div className="cleanup-empty">No Cloudinary orphans found.</div>
          ) : (
            <>
              <div className="cleanup-table-wrap">
                <table className="cleanup-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          aria-label="Select all orphans"
                          checked={
                            orphans.length > 0 &&
                            selectedOrphans.size === orphans.length
                          }
                          onChange={() =>
                            setSelectedOrphans(
                              selectedOrphans.size === orphans.length
                                ? new Set()
                                : new Set(orphans.map((item) => item.public_id))
                            )
                          }
                        />
                      </th>
                      <th>Preview</th>
                      <th>Public ID</th>
                      <th>Size</th>
                      <th>Created</th>
                      <th>Why unreferenced</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orphans.map((item) => (
                      <tr key={item.public_id}>
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`Select ${item.public_id}`}
                            checked={selectedOrphans.has(item.public_id)}
                            onChange={() =>
                              setSelectedOrphans(toggleInSet(selectedOrphans, item.public_id))
                            }
                          />
                        </td>
                        <td>
                          <img
                            src={item.secure_url}
                            alt=""
                            className="cleanup-thumb"
                            loading="lazy"
                          />
                        </td>
                        <td><code>{item.public_id}</code></td>
                        <td>{formatBytes(item.bytes)}</td>
                        <td>{formatDate(item.created_at)}</td>
                        <td>{item.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                className="btn danger"
                disabled={selectedOrphans.size === 0 || busy}
                onClick={() => setModal("cloudinary")}
              >
                Delete selected orphans ({selectedOrphans.size})
              </button>
            </>
          )}
        </section>

        {modal && (
          <div className="cleanup-modal-overlay" role="dialog" aria-modal="true">
            <div className="cleanup-modal">
              <h3>{modalTitle}</h3>
              <p>{modalBody}</p>
              <div className="cleanup-modal-actions">
                <button
                  type="button"
                  className="btn danger"
                  disabled={busy}
                  onClick={() => {
                    if (modal === "requests") void confirmRequestsDelete();
                    else if (modal === "email") void confirmEmailPurge();
                    else void confirmCloudinaryDelete();
                  }}
                >
                  {busy ? "Deleting..." : "Yes, delete"}
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

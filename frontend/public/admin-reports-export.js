(() => {
  const REPORT_PATH = "/admin/reports";
  let attached = false;

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const money = (value, currency = "USD") => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

  const dateText = (value) => new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));

  const dateTimeText = (value) => new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

  const csvEscape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

  async function getJson(url) {
    const response = await fetch(url, { credentials: "include", cache: "no-store" });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json();
  }

  function currentRange() {
    const dates = [...document.querySelectorAll('input[type="date"]')];
    return {
      start: dates[0]?.value || "",
      end: dates[1]?.value || "",
    };
  }

  function buildQuery(range) {
    const params = new URLSearchParams();
    if (range.start) params.set("start", range.start);
    if (range.end) params.set("end", range.end);
    return params.toString();
  }

  function addButton() {
    if (attached || !location.pathname.includes(REPORT_PATH)) return;
    const original = [...document.querySelectorAll("button")].find((button) => /export csv/i.test(button.textContent || ""));
    if (!original || !original.parentElement) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = original.className;
    button.style.marginLeft = "8px";
    button.innerHTML = "<span aria-hidden=\"true\">▣</span> Export PDF";
    button.title = "Create a complete branded PDF-ready report";
    button.addEventListener("click", exportPdf);
    original.parentElement.appendChild(button);
    attached = true;
  }

  async function exportPdf() {
    const button = [...document.querySelectorAll("button")].find((item) => /export pdf/i.test(item.textContent || ""));
    if (button) {
      button.disabled = true;
      button.dataset.originalText = button.textContent || "";
      button.textContent = "Building PDF…";
    }

    try {
      const range = currentRange();
      const query = buildQuery(range);
      const [report, settingsResponse] = await Promise.all([
        getJson(`/api/admin/reports${query ? `?${query}` : ""}`),
        getJson(`/api/settings?settings_refresh=${Date.now()}`),
      ]);

      const settings = settingsResponse.settings || {};
      const config = settings.config || {};
      const companyName = settings.websiteName || "Magic Touch Designs";
      const phone = config.businessPhone || "";
      const address = config.businessAddress || "";
      const email = settings.supportEmail || "";
      const slogan = config.slogan?.en || config.slogan?.es || "";
      const logoUrl = settings.logoUrl || "";
      const currency = report.currency || "USD";
      const generated = dateTimeText(report.generated_at);

      const paidRate = report.summary.orders ? (Number(report.summary.paid_orders) / Number(report.summary.orders)) * 100 : 0;
      const monthlyRows = (report.monthly || []).map((item) => `
        <tr><td>${escapeHtml(item.month)}</td><td>${item.orders}</td><td>${money(item.sales, currency)}</td><td>${money(item.tax, currency)}</td></tr>`).join("");
      const productRows = (report.products || []).map((item, index) => `
        <tr><td>${index + 1}</td><td>${escapeHtml(item.product_name)}</td><td>${item.quantity}</td><td>${money(item.sales, currency)}</td></tr>`).join("");
      const paymentRows = (report.payments || []).map((item) => `
        <tr><td>${escapeHtml(item.provider || "Unknown")}</td><td>${escapeHtml(item.method || "Unknown")}</td><td>${item.orders}</td><td>${money(item.sales, currency)}</td></tr>`).join("");
      const leadRows = (report.recent_leads || []).map((lead) => `
        <tr><td>${escapeHtml(lead.email)}</td><td>${lead.is_active ? "Active" : "Inactive"}</td><td>${escapeHtml(lead.language || "")}</td><td>${dateText(String(lead.created_at).slice(0, 10))}</td></tr>`).join("");
      const transactionRows = (report.transactions || []).map((order) => `
        <tr><td>${escapeHtml(order.order_code)}</td><td>${dateTimeText(order.created_at)}</td><td>${escapeHtml(`${order.customer_first_name || ""} ${order.customer_last_name || ""}`.trim() || "—")}</td><td>${escapeHtml(order.customer_email || "")}</td><td>${order.item_count}</td><td>${money(order.total, order.currency || currency)}</td><td>${escapeHtml(order.payment_status || "")}</td><td>${escapeHtml(order.status || "")}</td></tr>`).join("");

      const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(companyName)} — Reports</title><style>
        *{box-sizing:border-box}body{margin:0;background:#fff;color:#18202b;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.45}.page{max-width:1100px;margin:0 auto;padding:34px 38px}.header{display:flex;justify-content:space-between;gap:30px;border-bottom:3px solid #18202b;padding-bottom:18px;margin-bottom:20px}.brand{display:flex;gap:16px;align-items:center}.logo{width:72px;height:72px;object-fit:contain}.company h1{font-size:24px;margin:0 0 3px}.company p{margin:2px 0;color:#5f6977}.meta{text-align:right;color:#4e5967}.meta strong{display:block;color:#18202b;font-size:13px;margin-bottom:4px}.title h2{font-size:20px;margin:0}.title p{margin:3px 0 18px;color:#596474}.cards{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin:14px 0 22px}.card{border:1px solid #dfe4ea;border-radius:8px;padding:12px;background:#f8fafc}.card span{display:block;color:#697384;font-size:9px;text-transform:uppercase;font-weight:700;letter-spacing:.05em}.card strong{display:block;font-size:17px;margin-top:5px}.section{margin:24px 0;break-inside:avoid}.section h3{font-size:14px;margin:0 0 9px;padding-bottom:6px;border-bottom:1px solid #d9dee5}.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.note{padding:10px 12px;border-left:3px solid #7b8794;background:#f5f7f9;color:#596474}.summary-list{display:grid;grid-template-columns:1fr 1fr;gap:6px 20px}.summary-list div{display:flex;justify-content:space-between;border-bottom:1px dotted #d9dee5;padding:5px 0}.summary-list strong{color:#18202b}table{width:100%;border-collapse:collapse;margin-top:5px}th,td{padding:6px 7px;border-bottom:1px solid #e5e8ec;text-align:left;vertical-align:top}th{font-size:9px;text-transform:uppercase;letter-spacing:.04em;background:#f1f4f7;color:#4f5966}td:last-child,th:last-child{text-align:right}.footer{border-top:1px solid #d9dee5;margin-top:30px;padding-top:12px;color:#697384;display:flex;justify-content:space-between;gap:20px}.legal{font-size:9px;color:#7a8491;margin-top:12px}.wide td:nth-child(4){word-break:break-word}@media print{body{font-size:9.5px}.page{max-width:none;padding:14mm 12mm}.section{break-inside:auto}table{break-inside:auto}tr{break-inside:avoid;break-after:auto}.header{break-inside:avoid}.cards{grid-template-columns:repeat(5,1fr)}@page{size:Letter;margin:8mm} }
      </style></head><body><div class="page">
        <header class="header"><div class="brand">${logoUrl ? `<img class="logo" src="${escapeHtml(logoUrl)}" alt="Logo">` : ""}<div class="company"><h1>${escapeHtml(companyName)}</h1>${slogan ? `<p>${escapeHtml(slogan)}</p>` : ""}${address ? `<p>${escapeHtml(address)}</p>` : ""}${phone || email ? `<p>${escapeHtml([phone, email].filter(Boolean).join(" · "))}</p>` : ""}</div></div><div class="meta"><strong>BUSINESS REPORT</strong><div>Period: ${dateText(report.start)} — ${dateText(report.end)}</div><div>Generated: ${escapeHtml(generated)}</div><div>Timezone: ${escapeHtml(report.timezone || "UTC")}</div></div></header>
        <div class="title"><h2>Financial & Business Intelligence Report</h2><p>Prepared from recorded store transactions, customers and newsletter leads. This report organizes business records for management and accounting review.</p></div>
        <section class="cards"><div class="card"><span>Total Sales</span><strong>${money(report.summary.gross_sales, currency)}</strong></div><div class="card"><span>Total Orders</span><strong>${report.summary.orders}</strong></div><div class="card"><span>Paid Orders</span><strong>${report.summary.paid_orders}</strong></div><div class="card"><span>Customers</span><strong>${report.summary.unique_customers}</strong></div><div class="card"><span>Tax Collected</span><strong>${money(report.summary.tax_collected, currency)}</strong></div></section>
        <section class="section"><h3>Executive Summary</h3><div class="grid"><div class="summary-list"><div><span>Product sales</span><strong>${money(report.summary.product_sales, currency)}</strong></div><div><span>Shipping collected</span><strong>${money(report.summary.shipping_collected, currency)}</strong></div><div><span>Average order value</span><strong>${money(report.summary.average_order_value, currency)}</strong></div><div><span>Unpaid orders</span><strong>${report.summary.unpaid_orders}</strong></div><div><span>Paid rate</span><strong>${paidRate.toFixed(1)}%</strong></div><div><span>Leads in period</span><strong>${report.leads.total}</strong></div><div><span>New customers</span><strong>${report.customers.new_customers}</strong></div><div><span>Returning customers</span><strong>${report.customers.returning_customers}</strong></div></div><div class="note">Tax figures represent tax recorded on store orders. They are not a legal tax filing or a determination of deductible expenses.</div></div></section>
        <section class="section"><h3>Sales by Month</h3><table><thead><tr><th>Month</th><th>Paid Orders</th><th>Total Sales</th><th>Tax</th></tr></thead><tbody>${monthlyRows || '<tr><td colspan="4">No monthly sales recorded.</td></tr>'}</tbody></table></section>
        <section class="section grid"><div><h3>Payment Methods</h3><table><thead><tr><th>Provider</th><th>Method</th><th>Orders</th><th>Sales</th></tr></thead><tbody>${paymentRows || '<tr><td colspan="4">No paid transactions.</td></tr>'}</tbody></table></div><div><h3>Top Products</h3><table><thead><tr><th>#</th><th>Product</th><th>Units</th><th>Sales</th></tr></thead><tbody>${productRows || '<tr><td colspan="4">No product sales.</td></tr>'}</tbody></table></div></section>
        <section class="section"><h3>Customers & Leads</h3><div class="grid"><div class="summary-list"><div><span>Customers who purchased</span><strong>${report.customers.customers}</strong></div><div><span>New customers</span><strong>${report.customers.new_customers}</strong></div><div><span>Returning customers</span><strong>${report.customers.returning_customers}</strong></div><div><span>New customer orders</span><strong>${report.customers.new_customer_orders}</strong></div><div><span>Active leads</span><strong>${report.leads.active}</strong></div><div><span>Inactive leads</span><strong>${report.leads.inactive}</strong></div></div><div class="note">Lead attribution and lead-to-order conversion are not currently recorded in the store database.</div></div></section>
        <section class="section"><h3>Recent Leads</h3><table><thead><tr><th>Email</th><th>Status</th><th>Language</th><th>Created</th></tr></thead><tbody>${leadRows || '<tr><td colspan="4">No leads recorded in this period.</td></tr>'}</tbody></table></section>
        <section class="section"><h3>Order Transaction Ledger</h3><table class="wide"><thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Email</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead><tbody>${transactionRows || '<tr><td colspan="8">No transactions recorded in this period.</td></tr>'}</tbody></table></section>
        <footer class="footer"><span>${escapeHtml(companyName)} — Internal business report</span><span>Generated ${escapeHtml(generated)}</span></footer><p class="legal">This document is an operational/accounting report generated from the store's recorded data. Review with your accountant or tax professional before using it for tax filing.</p>
      </div><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),500));</script></body></html>`;

      const printWindow = window.open("", "_blank");
      if (!printWindow) throw new Error("The browser blocked the report window. Allow pop-ups for the admin site and try again.");
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to create the PDF report.");
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = button.dataset.originalText || "Export PDF";
      }
    }
  }

  function install() {
    attached = false;
    addButton();
  }

  const observer = new MutationObserver(() => addButton());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("popstate", install);
  install();
})();

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./admin.module.css";

const reservationStatuses = [
  { value: "all", label: "Tất cả" },
  { value: "new", label: "Mới" },
  { value: "contacted", label: "Đã liên hệ" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "arrived", label: "Đã tới" },
  { value: "cancelled", label: "Đã hủy" }
];

const voucherStatuses = [
  { value: "all", label: "Tất cả" },
  { value: "new", label: "Mới" },
  { value: "qualified", label: "Đủ điều kiện" },
  { value: "used", label: "Đã dùng" },
  { value: "closed", label: "Đã chốt" }
];

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function matchesSearch(item, query, fields) {
  if (!query) return true;
  const normalized = query.toLowerCase();
  return fields.some((field) => String(item[field] || "").toLowerCase().includes(normalized));
}

function sortByCreatedDesc(items) {
  return [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export default function AdminDashboard({
  initialReservations,
  initialVouchers,
  initialIntegrations,
  initialSyncLogs,
  adminUsername
}) {
  const router = useRouter();
  const [tab, setTab] = useState("reservations");
  const [reservations, setReservations] = useState(sortByCreatedDesc(initialReservations));
  const [vouchers, setVouchers] = useState(sortByCreatedDesc(initialVouchers));
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [syncLogs, setSyncLogs] = useState(initialSyncLogs);
  const [reservationQuery, setReservationQuery] = useState("");
  const [reservationStatus, setReservationStatus] = useState("all");
  const [voucherQuery, setVoucherQuery] = useState("");
  const [voucherStatus, setVoucherStatus] = useState("all");
  const [selectedReservationId, setSelectedReservationId] = useState(initialReservations[0]?.id || "");
  const [selectedVoucherId, setSelectedVoucherId] = useState(initialVouchers[0]?.id || "");
  const [selectedIntegrationId, setSelectedIntegrationId] = useState(initialIntegrations[0]?.id || "");
  const [reservationSaving, setReservationSaving] = useState(false);
  const [voucherSaving, setVoucherSaving] = useState(false);
  const [integrationSaving, setIntegrationSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    name: "",
    phone: "",
    guests: "2",
    datetime: "",
    selectedOffer: "",
    notes: "",
    assignedTo: ""
  });

  const reservationStats = useMemo(() => {
    const total = reservations.length;
    const pending = reservations.filter((item) => ["new", "contacted"].includes(item.status)).length;
    const confirmed = reservations.filter((item) => item.status === "confirmed").length;
    const arrived = reservations.filter((item) => item.status === "arrived").length;
    const cancelled = reservations.filter((item) => item.status === "cancelled").length;
    return { total, pending, confirmed, arrived, cancelled };
  }, [reservations]);

  const voucherStats = useMemo(() => {
    const total = vouchers.length;
    const fresh = vouchers.filter((item) => item.status === "new").length;
    const qualified = vouchers.filter((item) => item.status === "qualified").length;
    const used = vouchers.filter((item) => item.status === "used").length;
    return { total, fresh, qualified, used };
  }, [vouchers]);

  const integrationStats = useMemo(() => {
    const active = integrations.filter((item) => item.enabled && item.endpoint).length;
    const auto = integrations.filter((item) => item.syncMode === "auto" && item.enabled).length;
    const pos = integrations.filter((item) => item.category === "pos").length;
    const pms = integrations.filter((item) => item.category === "pms").length;
    return { active, auto, pos, pms };
  }, [integrations]);

  const filteredReservations = useMemo(
    () =>
      reservations.filter((item) => {
        const statusMatch = reservationStatus === "all" || item.status === reservationStatus;
        const searchMatch = matchesSearch(item, reservationQuery, [
          "name",
          "phone",
          "selectedOffer",
          "notes",
          "assignedTo"
        ]);
        return statusMatch && searchMatch;
      }),
    [reservations, reservationQuery, reservationStatus]
  );

  const filteredVouchers = useMemo(
    () =>
      vouchers.filter((item) => {
        const statusMatch = voucherStatus === "all" || item.status === voucherStatus;
        const searchMatch = matchesSearch(item, voucherQuery, ["phone", "notes", "source"]);
        return statusMatch && searchMatch;
      }),
    [vouchers, voucherQuery, voucherStatus]
  );

  const selectedReservation =
    reservations.find((item) => item.id === selectedReservationId) || filteredReservations[0] || null;
  const selectedVoucher =
    vouchers.find((item) => item.id === selectedVoucherId) || filteredVouchers[0] || null;
  const selectedIntegration =
    integrations.find((item) => item.id === selectedIntegrationId) || integrations[0] || null;

  const patchReservation = async (id, payload) => {
    setReservationSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error("Không thể cập nhật đặt bàn");
      }
      const data = await response.json();
      setReservations((prev) =>
        sortByCreatedDesc(prev.map((item) => (item.id === id ? data.data : item)))
      );
      setMessage("Đã cập nhật đặt bàn.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setReservationSaving(false);
    }
  };

  const patchVoucher = async (id, payload) => {
    setVoucherSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/vouchers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error("Không thể cập nhật voucher");
      }
      const data = await response.json();
      setVouchers((prev) => sortByCreatedDesc(prev.map((item) => (item.id === id ? data.data : item))));
      setMessage("Đã cập nhật voucher.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setVoucherSaving(false);
    }
  };

  const patchIntegration = async (id, payload) => {
    setIntegrationSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/integrations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error("Không thể cập nhật tích hợp");
      }
      const data = await response.json();
      setIntegrations((prev) => prev.map((item) => (item.id === id ? data.data : item)));
      setMessage("Đã cập nhật cấu hình POS/PMS.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIntegrationSaving(false);
    }
  };

  const syncReservation = async (reservationId, integrationId) => {
    setIntegrationSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/integrations/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId, integrationId })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Không thể đồng bộ");
      }

      const logsResponse = await fetch("/api/admin/integrations/logs");
      const logsData = await logsResponse.json();
      setSyncLogs(logsData.data || []);
      setMessage("Đồng bộ đặt bàn sang POS/PMS thành công.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIntegrationSaving(false);
    }
  };

  const deleteReservation = async (id) => {
    const confirmed = window.confirm("Xóa lead đặt bàn này?");
    if (!confirmed) return;
    const response = await fetch(`/api/admin/reservations/${id}`, { method: "DELETE" });
    if (response.ok) {
      const next = reservations.filter((item) => item.id !== id);
      setReservations(next);
      setSelectedReservationId(next[0]?.id || "");
      setMessage("Đã xóa lead đặt bàn.");
    }
  };

  const deleteVoucher = async (id) => {
    const confirmed = window.confirm("Xóa lead voucher này?");
    if (!confirmed) return;
    const response = await fetch(`/api/admin/vouchers/${id}`, { method: "DELETE" });
    if (response.ok) {
      const next = vouchers.filter((item) => item.id !== id);
      setVouchers(next);
      setSelectedVoucherId(next[0]?.id || "");
      setMessage("Đã xóa lead voucher.");
    }
  };

  const createManualReservation = async (event) => {
    event.preventDefault();
    setReservationSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...manualForm,
          status: "confirmed",
          source: "admin-manual"
        })
      });
      if (!response.ok) {
        throw new Error("Không thể tạo đặt bàn thủ công");
      }
      const data = await response.json();
      const next = sortByCreatedDesc([data.data, ...reservations]);
      setReservations(next);
      setSelectedReservationId(data.data.id);
      setManualOpen(false);
      setManualForm({
        name: "",
        phone: "",
        guests: "2",
        datetime: "",
        selectedOffer: "",
        notes: "",
        assignedTo: ""
      });
      setMessage("Đã thêm khách đặt bàn mới.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setReservationSaving(false);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <main className={styles.dashboardPage}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <div>
            <span className={styles.kicker}>Admin Dashboard</span>
            <h1>Quản lý khách đặt bàn, data marketing và tích hợp POS/PMS</h1>
            <p>
              Theo dõi lead mới, xác nhận đặt bàn, ghi chú CSKH, xử lý voucher và đồng bộ dữ liệu
              sang POS/PMS của khách sạn hoặc hệ vận hành F&amp;B.
            </p>
          </div>
          <div className={styles.topbarActions}>
            <span className={styles.adminBadge}>Đăng nhập: {adminUsername}</span>
            <a className={styles.exportButton} href="/api/admin/export?type=reservations">
              Export đặt bàn
            </a>
            <a className={styles.exportButton} href="/api/admin/export?type=vouchers">
              Export voucher
            </a>
            <button className={styles.logoutButton} type="button" onClick={logout}>
              Đăng xuất
            </button>
          </div>
        </header>

        <section className={styles.statsGrid}>
          <article className={styles.statCard}>
            <span>Tổng đặt bàn</span>
            <strong>{reservationStats.total}</strong>
            <small>{reservationStats.pending} lead đang chờ xử lý</small>
          </article>
          <article className={styles.statCard}>
            <span>Đã xác nhận</span>
            <strong>{reservationStats.confirmed}</strong>
            <small>{reservationStats.arrived} khách đã tới</small>
          </article>
          <article className={styles.statCard}>
            <span>Voucher</span>
            <strong>{voucherStats.total}</strong>
            <small>{voucherStats.fresh} lead mới cần chăm sóc</small>
          </article>
          <article className={styles.statCard}>
            <span>Tích hợp hoạt động</span>
            <strong>{integrationStats.active}</strong>
            <small>
              {integrationStats.auto} auto-sync, {integrationStats.pos} POS / {integrationStats.pms} PMS
            </small>
          </article>
        </section>

        <section className={styles.tabBar}>
          <button
            type="button"
            className={tab === "reservations" ? styles.activeTab : ""}
            onClick={() => setTab("reservations")}
          >
            Đặt bàn
          </button>
          <button
            type="button"
            className={tab === "vouchers" ? styles.activeTab : ""}
            onClick={() => setTab("vouchers")}
          >
            Voucher
          </button>
          <button
            type="button"
            className={tab === "integrations" ? styles.activeTab : ""}
            onClick={() => setTab("integrations")}
          >
            Tích hợp POS/PMS
          </button>
        </section>

        {message ? <p className={styles.feedback}>{message}</p> : null}

        {tab === "reservations" ? (
          <section className={styles.adminGrid}>
            <div className={styles.listPanel}>
              <div className={styles.panelToolbar}>
                <input
                  type="search"
                  placeholder="Tìm theo tên, số điện thoại, combo..."
                  value={reservationQuery}
                  onChange={(event) => setReservationQuery(event.target.value)}
                />
                <select
                  value={reservationStatus}
                  onChange={(event) => setReservationStatus(event.target.value)}
                >
                  {reservationStatuses.map((item) => (
                    <option value={item.value} key={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={() => setManualOpen((prev) => !prev)}>
                  {manualOpen ? "Đóng form" : "Thêm đặt bàn"}
                </button>
              </div>

              {manualOpen ? (
                <form className={styles.inlineForm} onSubmit={createManualReservation}>
                  <input
                    type="text"
                    placeholder="Tên khách"
                    value={manualForm.name}
                    onChange={(event) => setManualForm((prev) => ({ ...prev, name: event.target.value }))}
                    required
                  />
                  <input
                    type="tel"
                    placeholder="SĐT"
                    value={manualForm.phone}
                    onChange={(event) => setManualForm((prev) => ({ ...prev, phone: event.target.value }))}
                    required
                  />
                  <div className={styles.inlineRow}>
                    <input
                      type="text"
                      placeholder="Số khách"
                      value={manualForm.guests}
                      onChange={(event) =>
                        setManualForm((prev) => ({ ...prev, guests: event.target.value }))
                      }
                      required
                    />
                    <input
                      type="datetime-local"
                      value={manualForm.datetime}
                      onChange={(event) =>
                        setManualForm((prev) => ({ ...prev, datetime: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Combo / món quan tâm"
                    value={manualForm.selectedOffer}
                    onChange={(event) =>
                      setManualForm((prev) => ({ ...prev, selectedOffer: event.target.value }))
                    }
                  />
                  <textarea
                    placeholder="Ghi chú"
                    value={manualForm.notes}
                    onChange={(event) => setManualForm((prev) => ({ ...prev, notes: event.target.value }))}
                    rows={3}
                  />
                  <input
                    type="text"
                    placeholder="Người phụ trách"
                    value={manualForm.assignedTo}
                    onChange={(event) =>
                      setManualForm((prev) => ({ ...prev, assignedTo: event.target.value }))
                    }
                  />
                  <button type="submit" disabled={reservationSaving}>
                    {reservationSaving ? "Đang lưu..." : "Lưu đặt bàn"}
                  </button>
                </form>
              ) : null}

              <div className={styles.tableWrap}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Khách</th>
                      <th>SĐT</th>
                      <th>Thời gian</th>
                      <th>Số khách</th>
                      <th>Ưu tiên</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReservations.map((item) => (
                      <tr
                        key={item.id}
                        className={item.id === selectedReservation?.id ? styles.activeRow : ""}
                        onClick={() => setSelectedReservationId(item.id)}
                      >
                        <td>
                          <strong>{item.name}</strong>
                          <span>{formatDate(item.createdAt)}</span>
                        </td>
                        <td>{item.phone}</td>
                        <td>{formatDate(item.datetime)}</td>
                        <td>{item.guests}</td>
                        <td>{item.selectedOffer || "-"}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles[`status_${item.status}`]}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.detailPanel}>
              {selectedReservation ? (
                <div key={selectedReservation.id}>
                  <div className={styles.detailHeading}>
                    <div>
                      <span className={styles.kicker}>Chi tiết đặt bàn</span>
                      <h2>{selectedReservation.name}</h2>
                    </div>
                    <button
                      className={styles.deleteButton}
                      type="button"
                      onClick={() => deleteReservation(selectedReservation.id)}
                    >
                      Xóa lead
                    </button>
                  </div>

                  <div className={styles.metaGrid}>
                    <div>
                      <span>SĐT</span>
                      <strong>{selectedReservation.phone}</strong>
                    </div>
                    <div>
                      <span>Số khách</span>
                      <strong>{selectedReservation.guests}</strong>
                    </div>
                    <div>
                      <span>Thời gian</span>
                      <strong>{formatDate(selectedReservation.datetime)}</strong>
                    </div>
                    <div>
                      <span>Nguồn</span>
                      <strong>{selectedReservation.source}</strong>
                    </div>
                  </div>

                  <div className={styles.quickStatusRow}>
                    {reservationStatuses
                      .filter((item) => item.value !== "all")
                      .map((item) => (
                        <button
                          type="button"
                          key={item.value}
                          className={selectedReservation.status === item.value ? styles.quickActive : ""}
                          onClick={() => patchReservation(selectedReservation.id, { status: item.value })}
                        >
                          {item.label}
                        </button>
                      ))}
                  </div>

                  <div className={styles.editGrid}>
                    <label>
                      <span>Combo / món quan tâm</span>
                      <input
                        type="text"
                        defaultValue={selectedReservation.selectedOffer || ""}
                        onBlur={(event) =>
                          patchReservation(selectedReservation.id, {
                            selectedOffer: event.target.value
                          })
                        }
                      />
                    </label>
                    <label>
                      <span>Người phụ trách</span>
                      <input
                        type="text"
                        defaultValue={selectedReservation.assignedTo || ""}
                        onBlur={(event) =>
                          patchReservation(selectedReservation.id, {
                            assignedTo: event.target.value
                          })
                        }
                      />
                    </label>
                    <label>
                      <span>Lần liên hệ gần nhất</span>
                      <input
                        type="datetime-local"
                        defaultValue={selectedReservation.lastContactAt || ""}
                        onBlur={(event) =>
                          patchReservation(selectedReservation.id, {
                            lastContactAt: event.target.value
                          })
                        }
                      />
                    </label>
                    <label>
                      <span>Đổi thời gian bàn</span>
                      <input
                        type="datetime-local"
                        defaultValue={selectedReservation.datetime || ""}
                        onBlur={(event) =>
                          patchReservation(selectedReservation.id, {
                            datetime: event.target.value
                          })
                        }
                      />
                    </label>
                    <label className={styles.fullWidth}>
                      <span>Ghi chú CSKH</span>
                      <textarea
                        rows={7}
                        defaultValue={selectedReservation.notes || ""}
                        onBlur={(event) =>
                          patchReservation(selectedReservation.id, {
                            notes: event.target.value
                          })
                        }
                      />
                    </label>
                  </div>

                  <div className={styles.syncBox}>
                    <div>
                      <span className={styles.kicker}>Sync POS/PMS</span>
                      <p>Đồng bộ lead đặt bàn này sang hệ POS/PMS đã cấu hình.</p>
                    </div>
                    <div className={styles.syncActions}>
                      <select
                        value={selectedIntegrationId}
                        onChange={(event) => setSelectedIntegrationId(event.target.value)}
                      >
                        {integrations.map((item) => (
                          <option value={item.id} key={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => syncReservation(selectedReservation.id, selectedIntegrationId)}
                        disabled={integrationSaving}
                      >
                        {integrationSaving ? "Đang sync..." : "Sync ngay"}
                      </button>
                    </div>
                  </div>

                  <div className={styles.detailFooter}>
                    <small>Tạo lúc: {formatDate(selectedReservation.createdAt)}</small>
                    <small>Cập nhật: {formatDate(selectedReservation.updatedAt)}</small>
                  </div>
                </div>
              ) : (
                <div className={styles.emptyState}>Chưa có lead đặt bàn.</div>
              )}
            </div>
          </section>
        ) : null}

        {tab === "vouchers" ? (
          <section className={styles.adminGrid}>
            <div className={styles.listPanel}>
              <div className={styles.panelToolbar}>
                <input
                  type="search"
                  placeholder="Tìm số điện thoại hoặc ghi chú..."
                  value={voucherQuery}
                  onChange={(event) => setVoucherQuery(event.target.value)}
                />
                <select value={voucherStatus} onChange={(event) => setVoucherStatus(event.target.value)}>
                  {voucherStatuses.map((item) => (
                    <option value={item.value} key={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>SĐT</th>
                      <th>Nguồn</th>
                      <th>Trạng thái</th>
                      <th>Tạo lúc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVouchers.map((item) => (
                      <tr
                        key={item.id}
                        className={item.id === selectedVoucher?.id ? styles.activeRow : ""}
                        onClick={() => setSelectedVoucherId(item.id)}
                      >
                        <td>{item.phone}</td>
                        <td>{item.source}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles[`status_${item.status}`]}`}>
                            {item.status}
                          </span>
                        </td>
                        <td>{formatDate(item.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.detailPanel}>
              {selectedVoucher ? (
                <div key={selectedVoucher.id}>
                  <div className={styles.detailHeading}>
                    <div>
                      <span className={styles.kicker}>Chi tiết voucher</span>
                      <h2>{selectedVoucher.phone}</h2>
                    </div>
                    <button
                      className={styles.deleteButton}
                      type="button"
                      onClick={() => deleteVoucher(selectedVoucher.id)}
                    >
                      Xóa lead
                    </button>
                  </div>

                  <div className={styles.metaGrid}>
                    <div>
                      <span>Nguồn</span>
                      <strong>{selectedVoucher.source}</strong>
                    </div>
                    <div>
                      <span>Tạo lúc</span>
                      <strong>{formatDate(selectedVoucher.createdAt)}</strong>
                    </div>
                  </div>

                  <div className={styles.quickStatusRow}>
                    {voucherStatuses
                      .filter((item) => item.value !== "all")
                      .map((item) => (
                        <button
                          type="button"
                          key={item.value}
                          className={selectedVoucher.status === item.value ? styles.quickActive : ""}
                          onClick={() => patchVoucher(selectedVoucher.id, { status: item.value })}
                        >
                          {item.label}
                        </button>
                      ))}
                  </div>

                  <div className={styles.editGrid}>
                    <label className={styles.fullWidth}>
                      <span>Ghi chú chăm sóc</span>
                      <textarea
                        rows={7}
                        defaultValue={selectedVoucher.notes || ""}
                        onBlur={(event) =>
                          patchVoucher(selectedVoucher.id, {
                            notes: event.target.value
                          })
                        }
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className={styles.emptyState}>Chưa có lead voucher.</div>
              )}
            </div>
          </section>
        ) : null}

        {tab === "integrations" ? (
          <section className={styles.integrationLayout}>
            <div className={styles.integrationList}>
              {integrations.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`${styles.integrationCard} ${
                    item.id === selectedIntegration?.id ? styles.integrationCardActive : ""
                  }`}
                  onClick={() => setSelectedIntegrationId(item.id)}
                >
                  <div className={styles.integrationCardTop}>
                    <strong>{item.name}</strong>
                    <span className={`${styles.statusBadge} ${item.enabled ? styles.status_confirmed : styles.status_cancelled}`}>
                      {item.enabled ? "enabled" : "disabled"}
                    </span>
                  </div>
                  <small>
                    {item.category.toUpperCase()} • {item.market}
                  </small>
                  <p>{item.description}</p>
                  <span className={styles.integrationMeta}>
                    {item.syncMode === "auto" ? "Tự động đồng bộ" : "Đồng bộ thủ công"}
                  </span>
                </button>
              ))}
            </div>

            <div className={styles.integrationDetail}>
              {selectedIntegration ? (
                <div key={selectedIntegration.id} className={styles.detailPanel}>
                  <div className={styles.detailHeading}>
                    <div>
                      <span className={styles.kicker}>Tích hợp POS/PMS</span>
                      <h2>{selectedIntegration.name}</h2>
                    </div>
                  </div>

                  <div className={styles.metaGrid}>
                    <div>
                      <span>Loại hệ thống</span>
                      <strong>{selectedIntegration.category.toUpperCase()}</strong>
                    </div>
                    <div>
                      <span>Thị trường</span>
                      <strong>{selectedIntegration.market}</strong>
                    </div>
                  </div>

                  <div className={styles.editGrid}>
                    <label>
                      <span>Trạng thái</span>
                      <select
                        defaultValue={selectedIntegration.enabled ? "enabled" : "disabled"}
                        onBlur={(event) =>
                          patchIntegration(selectedIntegration.id, {
                            enabled: event.target.value === "enabled"
                          })
                        }
                      >
                        <option value="disabled">disabled</option>
                        <option value="enabled">enabled</option>
                      </select>
                    </label>
                    <label>
                      <span>Chế độ sync</span>
                      <select
                        defaultValue={selectedIntegration.syncMode}
                        onBlur={(event) =>
                          patchIntegration(selectedIntegration.id, {
                            syncMode: event.target.value
                          })
                        }
                      >
                        <option value="manual">manual</option>
                        <option value="auto">auto</option>
                      </select>
                    </label>
                    <label className={styles.fullWidth}>
                      <span>Endpoint</span>
                      <input
                        type="url"
                        defaultValue={selectedIntegration.endpoint}
                        placeholder="https://api-pos.example.com/reservations"
                        onBlur={(event) =>
                          patchIntegration(selectedIntegration.id, {
                            endpoint: event.target.value
                          })
                        }
                      />
                    </label>
                    <label>
                      <span>API key</span>
                      <input
                        type="text"
                        defaultValue={selectedIntegration.apiKey}
                        onBlur={(event) =>
                          patchIntegration(selectedIntegration.id, {
                            apiKey: event.target.value
                          })
                        }
                      />
                    </label>
                    <label>
                      <span>API secret</span>
                      <input
                        type="text"
                        defaultValue={selectedIntegration.apiSecret}
                        onBlur={(event) =>
                          patchIntegration(selectedIntegration.id, {
                            apiSecret: event.target.value
                          })
                        }
                      />
                    </label>
                    <label>
                      <span>Location code</span>
                      <input
                        type="text"
                        defaultValue={selectedIntegration.locationCode}
                        onBlur={(event) =>
                          patchIntegration(selectedIntegration.id, {
                            locationCode: event.target.value
                          })
                        }
                      />
                    </label>
                    <label>
                      <span>Tenant / Property code</span>
                      <input
                        type="text"
                        defaultValue={selectedIntegration.tenantCode}
                        onBlur={(event) =>
                          patchIntegration(selectedIntegration.id, {
                            tenantCode: event.target.value
                          })
                        }
                      />
                    </label>
                    <label>
                      <span>Map tên khách</span>
                      <input
                        type="text"
                        defaultValue={selectedIntegration.mapping.customerNameField}
                        onBlur={(event) =>
                          patchIntegration(selectedIntegration.id, {
                            mapping: { customerNameField: event.target.value }
                          })
                        }
                      />
                    </label>
                    <label>
                      <span>Map SĐT</span>
                      <input
                        type="text"
                        defaultValue={selectedIntegration.mapping.customerPhoneField}
                        onBlur={(event) =>
                          patchIntegration(selectedIntegration.id, {
                            mapping: { customerPhoneField: event.target.value }
                          })
                        }
                      />
                    </label>
                    <label>
                      <span>Map số khách</span>
                      <input
                        type="text"
                        defaultValue={selectedIntegration.mapping.guestCountField}
                        onBlur={(event) =>
                          patchIntegration(selectedIntegration.id, {
                            mapping: { guestCountField: event.target.value }
                          })
                        }
                      />
                    </label>
                    <label>
                      <span>Map thời gian</span>
                      <input
                        type="text"
                        defaultValue={selectedIntegration.mapping.bookingTimeField}
                        onBlur={(event) =>
                          patchIntegration(selectedIntegration.id, {
                            mapping: { bookingTimeField: event.target.value }
                          })
                        }
                      />
                    </label>
                    <label className={styles.fullWidth}>
                      <span>Ghi chú tích hợp</span>
                      <textarea
                        rows={5}
                        defaultValue={selectedIntegration.notes}
                        onBlur={(event) =>
                          patchIntegration(selectedIntegration.id, {
                            notes: event.target.value
                          })
                        }
                      />
                    </label>
                  </div>
                </div>
              ) : null}

              <div className={styles.detailPanel}>
                <div className={styles.detailHeading}>
                  <div>
                    <span className={styles.kicker}>Nhật ký đồng bộ</span>
                    <h2>Lịch sử sync gần đây</h2>
                  </div>
                </div>

                <div className={styles.logList}>
                  {syncLogs.length ? (
                    syncLogs.slice(0, 12).map((log) => (
                      <article key={log.id} className={styles.logItem}>
                        <div className={styles.logHead}>
                          <strong>{log.integrationName}</strong>
                          <span className={`${styles.statusBadge} ${log.ok ? styles.status_confirmed : styles.status_cancelled}`}>
                            {log.ok ? `OK ${log.status}` : `ERR ${log.status}`}
                          </span>
                        </div>
                        <small>Reservation: {log.reservationId || "-"}</small>
                        <small>{formatDate(log.createdAt)}</small>
                        <p>{log.responsePreview || "Không có nội dung phản hồi."}</p>
                      </article>
                    ))
                  ) : (
                    <div className={styles.emptyState}>Chưa có log đồng bộ POS/PMS.</div>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

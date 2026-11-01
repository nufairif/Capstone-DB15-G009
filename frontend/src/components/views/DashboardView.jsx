import React from "react";
import MetricCards from "../dashboard/MetricCards";
import BarChartCard from "../dashboard/BarChartCard";
import OrderHistoryTable from "../dashboard/OrderHistoryTable";
import StatusPanel from "../dashboard/StatusPanel";

export default function DashboardView({
  totalPcsCount,
  totalOrdersCount,
  datasetInfo,
  setActiveTab,
  fetchDatasetOverview,
  chartMode,
  setChartMode,
  selectedBarIdx,
  setSelectedBarIdx,
  activeBars,
  orders,
  handleStartEditOrder,
  inProgressCount,
  progressPercent,
  isProduksi,
  setEditingOrderId,
  handleAdvanceStatus,
  handleCopyText,
  copiedId,
  ragResult,
  handleAskRAG,
}) {
  return (
    <div className="page-transition grid grid-cols-12 gap-7 items-start">
      {/* LEFT 8 COLUMNS: 3 Metric Cards + Bar Chart + Order History Table */}
      <div className="col-span-12 xl:col-span-8 space-y-7">
        <MetricCards
          totalPcsCount={totalPcsCount}
          totalOrdersCount={totalOrdersCount}
          datasetInfo={datasetInfo}
          setActiveTab={setActiveTab}
          fetchDatasetOverview={fetchDatasetOverview}
        />

        <BarChartCard
          chartMode={chartMode}
          setChartMode={setChartMode}
          selectedBarIdx={selectedBarIdx}
          setSelectedBarIdx={setSelectedBarIdx}
          activeBars={activeBars}
        />

        <OrderHistoryTable
          orders={orders}
          setActiveTab={setActiveTab}
          handleStartEditOrder={handleStartEditOrder}
        />
      </div>

      {/* RIGHT 4 COLUMNS: Black Status Card + To Do List + Greeting/RAG */}
      <StatusPanel
        inProgressCount={inProgressCount}
        progressPercent={progressPercent}
        isProduksi={isProduksi}
        setActiveTab={setActiveTab}
        setEditingOrderId={setEditingOrderId}
        orders={orders}
        handleAdvanceStatus={handleAdvanceStatus}
        handleCopyText={handleCopyText}
        copiedId={copiedId}
        ragResult={ragResult}
        handleAskRAG={handleAskRAG}
      />
    </div>
  );
}


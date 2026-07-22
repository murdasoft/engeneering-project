import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#131d1d",
    backgroundColor: "#ffffff",
    padding: 40,
  },
  coverPage: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#ffffff",
    backgroundColor: "#004349",
    padding: 60,
    minHeight: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#004349",
  },
  logo: {
    fontSize: 18,
    fontWeight: 700,
    color: "#004349",
  },
  coverTitle: {
    fontSize: 36,
    fontWeight: 700,
    color: "#ffffff",
    marginBottom: 10,
    lineHeight: 1.2,
  },
  coverSubtitle: {
    fontSize: 14,
    color: "#90d1d9",
    marginBottom: 40,
  },
  coverInfo: {
    fontSize: 11,
    color: "#aceef6",
    lineHeight: 1.8,
  },
  coverFooter: {
    position: "absolute",
    bottom: 60,
    left: 60,
    right: 60,
    fontSize: 9,
    color: "#90d1d9",
    borderTopWidth: 1,
    borderTopColor: "#0f5c63",
    paddingTop: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#004349",
    marginBottom: 12,
    marginTop: 20,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#bfc8c9",
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: "#0f5c63",
    marginBottom: 8,
    marginTop: 12,
  },
  text: {
    fontSize: 10,
    lineHeight: 1.6,
    marginBottom: 6,
  },
  label: {
    fontSize: 8,
    fontWeight: 600,
    color: "#6f797a",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
    marginBottom: 16,
  },
  infoItem: {
    width: "48%",
  },
  infoValue: {
    fontSize: 11,
    fontWeight: 600,
    color: "#131d1d",
  },
  kpiRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "#f0fcfb",
    borderWidth: 1,
    borderColor: "#bfc8c9",
    padding: 12,
    borderRadius: 4,
  },
  kpiLabel: {
    fontSize: 7,
    fontWeight: 600,
    color: "#6f797a",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: 700,
    color: "#004349",
  },
  kpiSub: {
    fontSize: 8,
    color: "#3c637b",
    marginTop: 2,
  },
  imageCard: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#bfc8c9",
    borderRadius: 4,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 220,
    objectFit: "cover",
  },
  imageInfo: {
    padding: 10,
    backgroundColor: "#f0fcfb",
  },
  imageFilename: {
    fontSize: 10,
    fontWeight: 600,
    marginBottom: 2,
  },
  imageMeta: {
    fontSize: 8,
    color: "#6f797a",
  },
  findingRow: {
    flexDirection: "row",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#bfc8c9",
    borderRadius: 4,
  },
  findingSeverity: {
    width: 80,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  findingContent: {
    flex: 1,
    padding: 10,
  },
  findingName: {
    fontSize: 11,
    fontWeight: 600,
    marginBottom: 2,
  },
  findingDesc: {
    fontSize: 9,
    color: "#3f484a",
    lineHeight: 1.4,
  },
  findingMeta: {
    fontSize: 8,
    color: "#6f797a",
    marginTop: 4,
  },
  severityCritical: { backgroundColor: "#ba1a1a" },
  severityHigh: { backgroundColor: "#e85d04" },
  severityMedium: { backgroundColor: "#fbbc59" },
  severityLow: { backgroundColor: "#d9e5e4" },
  severityTextLight: { color: "#ffffff", fontSize: 9, fontWeight: 700, textTransform: "uppercase" },
  severityTextDark: { color: "#131d1d", fontSize: 9, fontWeight: 700, textTransform: "uppercase" },
  table: {
    borderWidth: 1,
    borderColor: "#bfc8c9",
    borderRadius: 4,
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#004349",
    padding: 8,
  },
  tableHeaderText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: 700,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e4f0f0",
  },
  tableCell: {
    fontSize: 9,
    color: "#131d1d",
  },
  recommendation: {
    backgroundColor: "#f0fcfb",
    borderWidth: 1,
    borderColor: "#bfc8c9",
    borderRadius: 4,
    padding: 12,
    marginBottom: 10,
  },
  recommendationTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#004349",
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: "#3f484a",
  },
  disclaimer: {
    backgroundColor: "#fff8e1",
    borderWidth: 1,
    borderColor: "#fbbc59",
    borderRadius: 4,
    padding: 12,
    marginTop: 20,
  },
  disclaimerTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#533600",
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 8,
    lineHeight: 1.5,
    color: "#533600",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#6f797a",
    borderTopWidth: 1,
    borderTopColor: "#bfc8c9",
    paddingTop: 8,
  },
  pageNumbers: {
    fontSize: 8,
    color: "#6f797a",
  },
  spacer: { height: 10 },
  badge: {
    fontSize: 7,
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: 2,
    textTransform: "uppercase",
  },
});

interface ReportData {
  project: {
    name: string;
    siteId: string | null;
    objectType: string | null;
    address: string | null;
    description: string | null;
    status: string;
    createdAt: Date;
  };
  user: {
    name: string | null;
    email: string;
  };
  assets: Array<{
    id: string;
    filename: string;
    blobUrl: string;
    dataUrl?: string | null;
    mimeType: string;
    fileSize: number;
    createdAt: Date;
  }>;
  analyses: Array<{
    id: string;
    status: string;
    confidence: number | null;
    modelVersion: string | null;
    createdAt: Date;
    asset: { filename: string; blobUrl: string };
    findings: Array<{
      id: string;
      className: string;
      confidence: number;
      severity: string;
      reviewStatus: string;
      widthMm: number | null;
      heightMm: number | null;
      areaMm2: number | null;
      reviewerNote: string | null;
    }>;
  }>;
  stats: {
    totalAssets: number;
    totalAnalyses: number;
    totalFindings: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    confirmedCount: number;
    pendingCount: number;
    rejectedCount: number;
  };
}

function severityStyle(sev: string) {
  switch (sev) {
    case "CRITICAL": return styles.severityCritical;
    case "HIGH": return styles.severityHigh;
    case "MEDIUM": return styles.severityMedium;
    default: return styles.severityLow;
  }
}

function severityTextStyle(sev: string) {
  return sev === "LOW" || sev === "MEDIUM" ? styles.severityTextDark : styles.severityTextLight;
}

function severityDesc(sev: string): string {
  switch (sev) {
    case "CRITICAL": return "Immediate engineering assessment required. Structural integrity may be compromised.";
    case "HIGH": return "Significant defect requiring scheduled repair within 30 days.";
    case "MEDIUM": return "Moderate defect. Monitor and schedule repair during next maintenance cycle.";
    case "LOW": return "Minor defect. Document and monitor for progression.";
    default: return "No action required at this time.";
  }
}

export function createReportDocument(data: ReportData) {
  const reportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const reportId = `RPT-${Date.now().toString(36).toUpperCase()}`;

  return (
    <Document>
      {/* COVER PAGE */}
      <Page size="A4" style={styles.coverPage}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 60 }}>
            <View style={{ width: 40, height: 40, backgroundColor: "#ffffff", borderRadius: 6, justifyContent: "center", alignItems: "center" }}>
              <Text style={{ fontSize: 20, fontWeight: 800, color: "#004349" }}>I</Text>
            </View>
            <Text style={{ fontSize: 22, fontWeight: 800, color: "#ffffff" }}>InspectAI</Text>
          </View>

          <Text style={{ fontSize: 9, color: "#90d1d9", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
            ENGINEERING INSPECTION REPORT
          </Text>
          <Text style={styles.coverTitle}>{data.project.name}</Text>
          <Text style={styles.coverSubtitle}>
            Structural Defect Detection & Engineering Analysis
          </Text>

          <View style={{ marginTop: 30, padding: 20, backgroundColor: "rgba(15, 92, 99, 0.4)", borderRadius: 8 }}>
            <View style={{ flexDirection: "row", marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 8, color: "#90d1d9", textTransform: "uppercase", marginBottom: 3 }}>Report ID</Text>
                <Text style={{ fontSize: 12, fontWeight: 600, color: "#ffffff" }}>{reportId}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 8, color: "#90d1d9", textTransform: "uppercase", marginBottom: 3 }}>Date</Text>
                <Text style={{ fontSize: 12, fontWeight: 600, color: "#ffffff" }}>{reportDate}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 8, color: "#90d1d9", textTransform: "uppercase", marginBottom: 3 }}>Site ID</Text>
                <Text style={{ fontSize: 12, fontWeight: 600, color: "#ffffff" }}>{data.project.siteId ?? "—"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 8, color: "#90d1d9", textTransform: "uppercase", marginBottom: 3 }}>Object Type</Text>
                <Text style={{ fontSize: 12, fontWeight: 600, color: "#ffffff" }}>{data.project.objectType ?? "—"}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 8, color: "#90d1d9", textTransform: "uppercase", marginBottom: 3 }}>Inspected By</Text>
                <Text style={{ fontSize: 12, fontWeight: 600, color: "#ffffff" }}>{data.user.name ?? data.user.email}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 8, color: "#90d1d9", textTransform: "uppercase", marginBottom: 3 }}>Project Status</Text>
                <Text style={{ fontSize: 12, fontWeight: 600, color: "#ffffff" }}>{data.project.status}</Text>
              </View>
            </View>
          </View>

          <View style={{ marginTop: 30 }}>
            <Text style={{ fontSize: 8, color: "#90d1d9", textTransform: "uppercase", marginBottom: 8 }}>KEY FINDINGS</Text>
            <View style={{ flexDirection: "row", gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 28, fontWeight: 800, color: "#ffffff" }}>{data.stats.totalFindings}</Text>
                <Text style={{ fontSize: 8, color: "#90d1d9" }}>TOTAL DEFECTS</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 28, fontWeight: 800, color: "#ffdad6" }}>{data.stats.criticalCount}</Text>
                <Text style={{ fontSize: 8, color: "#90d1d9" }}>CRITICAL</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 28, fontWeight: 800, color: "#fbbc59" }}>{data.stats.highCount}</Text>
                <Text style={{ fontSize: 8, color: "#90d1d9" }}>HIGH</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 28, fontWeight: 800, color: "#aceef6" }}>{data.stats.totalAssets}</Text>
                <Text style={{ fontSize: 8, color: "#90d1d9" }}>PHOTOS</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.coverFooter}>
          <Text>© 2025 InspectAI — AI-Powered Structural Defect Detection</Text>
          <Text>Generated: {reportDate}</Text>
        </View>
      </Page>

      {/* EXECUTIVE SUMMARY */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>InspectAI</Text>
          <Text style={{ fontSize: 8, color: "#6f797a" }}>{reportId} · {reportDate}</Text>
        </View>

        <Text style={styles.sectionTitle}>1. Executive Summary</Text>
        <Text style={styles.text}>
          This report presents the findings of an AI-powered structural defect inspection conducted on
          the {data.project.name} project. The inspection utilized YOLOv8-based computer vision models
          to detect and classify surface defects including cracks, spalling, and corrosion from
          photographic documentation.
        </Text>

        {data.project.description && (
          <Text style={styles.text}>
            <Text style={{ fontWeight: 600 }}>Project Description: </Text>
            {data.project.description}
          </Text>
        )}

        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Photos Analyzed</Text>
            <Text style={styles.kpiValue}>{data.stats.totalAssets}</Text>
            <Text style={styles.kpiSub}>{data.stats.totalAnalyses} AI analyses</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total Defects</Text>
            <Text style={styles.kpiValue}>{data.stats.totalFindings}</Text>
            <Text style={styles.kpiSub}>{data.stats.confirmedCount} confirmed</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Critical Issues</Text>
            <Text style={styles.kpiValue}>{data.stats.criticalCount}</Text>
            <Text style={styles.kpiSub}>Immediate attention</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>High Severity</Text>
            <Text style={styles.kpiValue}>{data.stats.highCount}</Text>
            <Text style={styles.kpiSub}>Repair within 30 days</Text>
          </View>
        </View>

        <Text style={styles.subsectionTitle}>Severity Distribution</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Critical</Text>
            <Text style={styles.infoValue}>{data.stats.criticalCount} findings</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>High</Text>
            <Text style={styles.infoValue}>{data.stats.highCount} findings</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Medium</Text>
            <Text style={styles.infoValue}>{data.stats.mediumCount} findings</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Low</Text>
            <Text style={styles.infoValue}>{data.stats.lowCount} findings</Text>
          </View>
        </View>

        <Text style={styles.subsectionTitle}>Review Status</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Confirmed</Text>
            <Text style={styles.infoValue}>{data.stats.confirmedCount} findings</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Pending Review</Text>
            <Text style={styles.infoValue}>{data.stats.pendingCount} findings</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Rejected</Text>
            <Text style={styles.infoValue}>{data.stats.rejectedCount} findings</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>2. Project Information</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Project Name</Text>
            <Text style={styles.infoValue}>{data.project.name}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Site ID</Text>
            <Text style={styles.infoValue}>{data.project.siteId ?? "—"}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Object Type</Text>
            <Text style={styles.infoValue}>{data.project.objectType ?? "—"}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.infoValue}>{data.project.address ?? "—"}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Inspected By</Text>
            <Text style={styles.infoValue}>{data.user.name ?? data.user.email}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Project Created</Text>
            <Text style={styles.infoValue}>{data.project.createdAt.toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>InspectAI — Engineering Inspection Report</Text>
          <Text style={styles.pageNumbers}>Page 2</Text>
        </View>
      </Page>

      {/* PHOTOGRAPHIC EVIDENCE */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>InspectAI</Text>
          <Text style={{ fontSize: 8, color: "#6f797a" }}>{reportId} · {reportDate}</Text>
        </View>

        <Text style={styles.sectionTitle}>3. Photographic Evidence</Text>
        <Text style={styles.text}>
          The following {data.stats.totalAssets} photographs were submitted for AI-powered defect detection analysis.
          Each image was processed through an ensemble of YOLOv8 models trained on crack segmentation datasets.
        </Text>

        {data.assets.length === 0 ? (
          <Text style={styles.text}>No photographs were uploaded for this project.</Text>
        ) : (
          data.assets.map((asset, i) => (
            <View key={asset.id} style={styles.imageCard} wrap={false}>
              {asset.dataUrl ? (
                <Image src={asset.dataUrl} style={styles.image} />
              ) : (
                <View style={{ ...styles.image, backgroundColor: "#e4f0f0", justifyContent: "center", alignItems: "center" }}>
                  <Text style={{ color: "#6f797a", fontSize: 9 }}>Image not available</Text>
                </View>
              )}
              <View style={styles.imageInfo}>
                <Text style={styles.imageFilename}>
                  Photo {i + 1}: {asset.filename}
                </Text>
                <Text style={styles.imageMeta}>
                  {(asset.fileSize / 1024 / 1024).toFixed(2)} MB · {asset.mimeType} ·
                  Uploaded {asset.createdAt.toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))
        )}

        <View style={styles.footer}>
          <Text>InspectAI — Engineering Inspection Report</Text>
          <Text style={styles.pageNumbers}>Page 3</Text>
        </View>
      </Page>

      {/* DETAILED FINDINGS */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>InspectAI</Text>
          <Text style={{ fontSize: 8, color: "#6f797a" }}>{reportId} · {reportDate}</Text>
        </View>

        <Text style={styles.sectionTitle}>4. Detailed Findings</Text>
        <Text style={styles.text}>
          AI-detected defects are listed below with severity classification, confidence scores, and
          engineering assessment. All findings have been reviewed by a qualified engineer.
        </Text>

        {data.analyses.length === 0 ? (
          <Text style={styles.text}>No analyses were performed for this project.</Text>
        ) : (
          data.analyses.map((analysis, ai) => (
            <View key={analysis.id} wrap={false}>
              <Text style={styles.subsectionTitle}>
                Analysis #{ai + 1} — {analysis.asset.filename}
              </Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.label}>Status</Text>
                  <Text style={styles.infoValue}>{analysis.status}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.label}>AI Confidence</Text>
                  <Text style={styles.infoValue}>
                    {analysis.confidence ? `${(analysis.confidence * 100).toFixed(1)}%` : "—"}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.label}>Model Version</Text>
                  <Text style={styles.infoValue}>{analysis.modelVersion ?? "YOLOv8 Ensemble"}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.label}>Date</Text>
                  <Text style={styles.infoValue}>{analysis.createdAt.toLocaleDateString()}</Text>
                </View>
              </View>

              {analysis.findings.length === 0 ? (
                <Text style={{ ...styles.text, color: "#6f797a" }}>No defects detected in this image.</Text>
              ) : (
                analysis.findings.map((finding, fi) => (
                  <View key={finding.id} style={styles.findingRow} wrap={false}>
                    <View style={{ ...styles.findingSeverity, ...severityStyle(finding.severity) }}>
                      <Text style={severityTextStyle(finding.severity)}>{finding.severity}</Text>
                    </View>
                    <View style={styles.findingContent}>
                      <Text style={styles.findingName}>
                        Finding #{fi + 1}: {finding.className}
                      </Text>
                      <Text style={styles.findingDesc}>{severityDesc(finding.severity)}</Text>
                      <Text style={styles.findingMeta}>
                        Confidence: {(finding.confidence * 100).toFixed(1)}% ·
                        Review: {finding.reviewStatus}
                        {finding.widthMm && ` · Width: ${finding.widthMm.toFixed(1)}mm`}
                        {finding.heightMm && ` · Height: ${finding.heightMm.toFixed(1)}mm`}
                        {finding.areaMm2 && ` · Area: ${finding.areaMm2.toFixed(0)}mm²`}
                      </Text>
                      {finding.reviewerNote && (
                        <Text style={{ ...styles.findingMeta, fontStyle: "italic" }}>
                          Engineer's Note: {finding.reviewerNote}
                        </Text>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          ))
        )}

        <View style={styles.footer}>
          <Text>InspectAI — Engineering Inspection Report</Text>
          <Text style={styles.pageNumbers}>Page 4</Text>
        </View>
      </Page>

      {/* FINDINGS SUMMARY TABLE */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>InspectAI</Text>
          <Text style={{ fontSize: 8, color: "#6f797a" }}>{reportId} · {reportDate}</Text>
        </View>

        <Text style={styles.sectionTitle}>5. Findings Summary Table</Text>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.tableHeaderText, width: 30 }}>#</Text>
            <Text style={{ ...styles.tableHeaderText, width: 120 }}>Defect Type</Text>
            <Text style={{ ...styles.tableHeaderText, width: 60 }}>Severity</Text>
            <Text style={{ ...styles.tableHeaderText, width: 60 }}>Confidence</Text>
            <Text style={{ ...styles.tableHeaderText, width: 70 }}>Dimensions</Text>
            <Text style={{ ...styles.tableHeaderText, width: 60 }}>Review</Text>
          </View>
          {data.analyses.flatMap((a) => a.findings).map((f, i) => (
            <View key={f.id} style={styles.tableRow}>
              <Text style={{ ...styles.tableCell, width: 30 }}>{i + 1}</Text>
              <Text style={{ ...styles.tableCell, width: 120 }}>{f.className}</Text>
              <Text style={{ ...styles.tableCell, width: 60 }}>{f.severity}</Text>
              <Text style={{ ...styles.tableCell, width: 60 }}>{(f.confidence * 100).toFixed(0)}%</Text>
              <Text style={{ ...styles.tableCell, width: 70 }}>
                {f.widthMm ? `${f.widthMm.toFixed(0)}×${f.heightMm?.toFixed(0) ?? "?"}mm` : "—"}
              </Text>
              <Text style={{ ...styles.tableCell, width: 60 }}>{f.reviewStatus}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>6. Recommendations</Text>

        {data.stats.criticalCount > 0 && (
          <View style={styles.recommendation}>
            <Text style={styles.recommendationTitle}>⚠ CRITICAL — Immediate Action Required</Text>
            <Text style={styles.recommendationText}>
              {data.stats.criticalCount} critical defect(s) identified. Recommend immediate on-site
              structural assessment by a licensed structural engineer within 48 hours. Consider
              temporary shoring or load restriction until assessment is complete. Critical cracks
              may indicate structural overload or foundation settlement requiring urgent intervention.
            </Text>
          </View>
        )}

        {data.stats.highCount > 0 && (
          <View style={styles.recommendation}>
            <Text style={styles.recommendationTitle}>⚠ HIGH — Schedule Repair</Text>
            <Text style={styles.recommendationText}>
              {data.stats.highCount} high-severity defect(s) identified. Recommend scheduling repair
              work within 30 days. High-severity defects include structural cracks wider than 2mm,
              significant spalling, or active corrosion. Repairs should follow ACI 562-16 or
              equivalent local standards.
            </Text>
          </View>
        )}

        {data.stats.mediumCount > 0 && (
          <View style={styles.recommendation}>
            <Text style={styles.recommendationTitle}>○ MEDIUM — Monitor & Plan</Text>
            <Text style={styles.recommendationText}>
              {data.stats.mediumCount} medium-severity defect(s) identified. Recommend documenting
              current condition with follow-up inspection in 6 months. Plan repair during next
              scheduled maintenance cycle. Medium defects include hairline cracks, surface staining,
              and minor joint deterioration.
            </Text>
          </View>
        )}

        {data.stats.lowCount > 0 && (
          <View style={styles.recommendation}>
            <Text style={styles.recommendationTitle}>○ LOW — Document & Monitor</Text>
            <Text style={styles.recommendationText}>
              {data.stats.lowCount} low-severity defect(s) identified. No immediate action required.
              Document for baseline reference and monitor during routine inspections. Low-severity
              items include surface efflorescence, minor biological growth, and cosmetic blemishes.
            </Text>
          </View>
        )}

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>⚠ DISCLAIMER</Text>
          <Text style={styles.disclaimerText}>
            This report was generated using AI-powered computer vision models as a preliminary
            screening tool. The analysis is based on photographic evidence only and does not
            constitute a substitute for professional engineering assessment. All findings must be
            verified by a qualified structural engineer. This report is prepared in accordance with
            GOST 31937-2011 "Buildings and structures — Rules for inspection and monitoring."
            InspectAI assumes no liability for decisions made solely on the basis of this report.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>InspectAI — Engineering Inspection Report</Text>
          <Text style={styles.pageNumbers}>Page 5 — End of Report</Text>
        </View>
      </Page>
    </Document>
  );
}

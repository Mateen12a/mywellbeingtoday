import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Loader2, FileText } from "lucide-react";
import { Link } from "wouter";
import api from "@/lib/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportData {
  overallScore: number;
  wellbeingLevel: string;
  analysisSummary?: string;
  recommendations?: string[];
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  moodAnalysis?: {
    averageScore?: number;
    trend?: string;
    dominantMood?: string;
    totalLogs?: number;
    highestScore?: number;
    lowestScore?: number;
  };
  activityAnalysis?: {
    totalActivities?: number;
    topCategories?: string[];
    averageDuration?: number;
    mostActiveDay?: string;
  };
  sleepAnalysis?: {
    averageHours?: number;
    quality?: string;
    consistency?: string;
  };
  stressAnalysis?: {
    averageLevel?: number;
    trend?: string;
    triggers?: string[];
  };
}

function getWellbeingLevelColor(level: string): [number, number, number] {
  const lowerLevel = level?.toLowerCase() || "";
  if (lowerLevel.includes("excellent") || lowerLevel.includes("great")) {
    return [34, 197, 94];
  } else if (lowerLevel.includes("good") || lowerLevel.includes("moderate")) {
    return [245, 158, 11];
  } else {
    return [239, 68, 68];
  }
}

function formatDateTime(dateString?: string): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const LOGO_BASE64 = "data:image/png;base64,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";

function generatePDFReport(report: ReportData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 22;
  let yPosition = margin;

  const brandTeal: [number, number, number] = [13, 148, 136];
  const softTeal: [number, number, number] = [94, 186, 180];
  const textColor: [number, number, number] = [55, 65, 81];
  const subtleGray: [number, number, number] = [107, 114, 128];
  const lightGray: [number, number, number] = [156, 163, 175];
  const veryLightBg: [number, number, number] = [250, 251, 252];
  const levelColor = getWellbeingLevelColor(report.wellbeingLevel);

  try {
    doc.addImage(LOGO_BASE64, "PNG", margin, 14, 16, 16);
  } catch (e) {
    console.log("Could not add logo to PDF");
  }

  doc.setTextColor(...textColor);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("mywellbeingtoday", margin + 22, 22);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...subtleGray);
  doc.text("Your Personal Wellbeing Report", margin + 22, 30);

  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(margin, 42, pageWidth - margin, 42);

  doc.setFontSize(9);
  doc.setTextColor(...lightGray);
  doc.setFont("helvetica", "italic");
  doc.text("Supporting your wellness journey", pageWidth - margin, 52, { align: "right" });

  yPosition = 62;

  const scoreBoxX = margin;
  const scoreBoxWidth = pageWidth - 2 * margin;
  const scoreBoxHeight = 50;

  doc.setFillColor(...veryLightBg);
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.roundedRect(scoreBoxX, yPosition, scoreBoxWidth, scoreBoxHeight, 4, 4, "FD");

  doc.setFontSize(42);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...levelColor);
  doc.text(String(report.overallScore), pageWidth / 2, yPosition + 26, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(...subtleGray);
  doc.setFont("helvetica", "normal");
  doc.text("Overall Wellbeing Score (out of 100)", pageWidth / 2, yPosition + 36, { align: "center" });

  doc.setFillColor(...levelColor);
  const badgeText = report.wellbeingLevel;
  doc.setFontSize(8);
  const badgeWidth = doc.getTextWidth(badgeText) + 14;
  doc.roundedRect((pageWidth - badgeWidth) / 2, yPosition + 40, badgeWidth, 7, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text(badgeText, pageWidth / 2, yPosition + 45, { align: "center" });

  yPosition += scoreBoxHeight + 18;

  const addSectionTitle = (title: string, _emoji: string) => {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...textColor);
    doc.text(title, margin, yPosition);
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition + 4, pageWidth - margin, yPosition + 4);
    yPosition += 14;
  };

  const addText = (text: string, indent = 0) => {
    if (yPosition > pageHeight - 20) {
      doc.addPage();
      yPosition = margin;
    }
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textColor);
    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin - indent);
    doc.text(lines, margin + indent, yPosition);
    yPosition += lines.length * 5 + 3;
  };

  const addKeyValue = (key: string, value: string | number, unit = "") => {
    if (yPosition > pageHeight - 20) {
      doc.addPage();
      yPosition = margin;
    }
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...subtleGray);
    doc.text(`${key}: `, margin + 4, yPosition);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textColor);
    const valueText = `${value}${unit}`;
    doc.text(valueText, margin + 4 + doc.getTextWidth(`${key}: `), yPosition);
    yPosition += 8;
  };

  addSectionTitle("Report Period", "");
  const generatedAt = formatDateTime(report.createdAt || new Date().toISOString());
  if (report.startDate && report.endDate) {
    addKeyValue("Period", `${formatDateTime(report.startDate)} - ${formatDateTime(report.endDate)}`);
  }
  addKeyValue("Report Generated", generatedAt);
  yPosition += 5;

  if (report.analysisSummary) {
    addSectionTitle("Analysis Summary", "");
    addText(report.analysisSummary);
    yPosition += 5;
  }

  if (report.moodAnalysis) {
    addSectionTitle("Mood Analysis", "");
    const mood = report.moodAnalysis;
    
    const moodData: [string, string][] = [];
    if (mood.averageScore !== undefined) {
      moodData.push(["Average Mood Score", `${mood.averageScore.toFixed(2)} / 5.0`]);
    }
    if (mood.highestScore !== undefined) {
      moodData.push(["Highest Score", `${mood.highestScore} / 5`]);
    }
    if (mood.lowestScore !== undefined) {
      moodData.push(["Lowest Score", `${mood.lowestScore} / 5`]);
    }
    if (mood.totalLogs !== undefined) {
      moodData.push(["Total Mood Entries", String(mood.totalLogs)]);
    }
    if (mood.trend) {
      moodData.push(["Trend", mood.trend]);
    }
    if (mood.dominantMood) {
      moodData.push(["Dominant Mood", mood.dominantMood]);
    }

    if (moodData.length > 0) {
      autoTable(doc, {
        startY: yPosition,
        head: [["Metric", "Value"]],
        body: moodData,
        margin: { left: margin, right: margin },
        headStyles: { fillColor: [245, 247, 250], textColor: textColor, fontStyle: "bold", lineWidth: 0.1, lineColor: [229, 231, 235] },
        bodyStyles: { textColor: textColor },
        alternateRowStyles: { fillColor: [252, 253, 254] },
        styles: { fontSize: 9, cellPadding: 5, lineWidth: 0.1, lineColor: [229, 231, 235] },
        tableLineWidth: 0.1,
        tableLineColor: [229, 231, 235],
      });
      yPosition = (doc as any).lastAutoTable.finalY + 14;
    }
  }

  if (report.activityAnalysis) {
    addSectionTitle("Activity Analysis", "");
    const activity = report.activityAnalysis;
    
    const activityData: [string, string][] = [];
    if (activity.totalActivities !== undefined) {
      activityData.push(["Total Activities Logged", String(activity.totalActivities)]);
    }
    if (activity.averageDuration !== undefined) {
      activityData.push(["Average Duration", `${activity.averageDuration} minutes`]);
    }
    if (activity.mostActiveDay) {
      activityData.push(["Most Active Day", activity.mostActiveDay]);
    }
    if (activity.topCategories && activity.topCategories.length > 0) {
      activityData.push(["Top Categories", activity.topCategories.join(", ")]);
    }

    if (activityData.length > 0) {
      autoTable(doc, {
        startY: yPosition,
        head: [["Metric", "Value"]],
        body: activityData,
        margin: { left: margin, right: margin },
        headStyles: { fillColor: [245, 247, 250], textColor: textColor, fontStyle: "bold", lineWidth: 0.1, lineColor: [229, 231, 235] },
        bodyStyles: { textColor: textColor },
        alternateRowStyles: { fillColor: [252, 253, 254] },
        styles: { fontSize: 9, cellPadding: 5, lineWidth: 0.1, lineColor: [229, 231, 235] },
        tableLineWidth: 0.1,
        tableLineColor: [229, 231, 235],
      });
      yPosition = (doc as any).lastAutoTable.finalY + 14;
    }
  }

  if (report.sleepAnalysis) {
    addSectionTitle("Sleep Analysis", "");
    const sleep = report.sleepAnalysis;
    
    const sleepData: [string, string][] = [];
    if (sleep.averageHours !== undefined) {
      sleepData.push(["Average Sleep Duration", `${sleep.averageHours.toFixed(1)} hours`]);
    }
    if (sleep.quality) {
      sleepData.push(["Sleep Quality", sleep.quality]);
    }
    if (sleep.consistency) {
      sleepData.push(["Sleep Consistency", sleep.consistency]);
    }

    if (sleepData.length > 0) {
      autoTable(doc, {
        startY: yPosition,
        head: [["Metric", "Value"]],
        body: sleepData,
        margin: { left: margin, right: margin },
        headStyles: { fillColor: [245, 247, 250], textColor: textColor, fontStyle: "bold", lineWidth: 0.1, lineColor: [229, 231, 235] },
        bodyStyles: { textColor: textColor },
        alternateRowStyles: { fillColor: [252, 253, 254] },
        styles: { fontSize: 9, cellPadding: 5, lineWidth: 0.1, lineColor: [229, 231, 235] },
        tableLineWidth: 0.1,
        tableLineColor: [229, 231, 235],
      });
      yPosition = (doc as any).lastAutoTable.finalY + 14;
    }
  }

  if (report.stressAnalysis) {
    addSectionTitle("Stress Analysis", "");
    const stress = report.stressAnalysis;
    
    const stressData: [string, string][] = [];
    if (stress.averageLevel !== undefined) {
      stressData.push(["Average Stress Level", `${stress.averageLevel.toFixed(1)} / 10`]);
    }
    if (stress.trend) {
      stressData.push(["Stress Trend", stress.trend]);
    }
    if (stress.triggers && stress.triggers.length > 0) {
      stressData.push(["Common Triggers", stress.triggers.join(", ")]);
    }

    if (stressData.length > 0) {
      autoTable(doc, {
        startY: yPosition,
        head: [["Metric", "Value"]],
        body: stressData,
        margin: { left: margin, right: margin },
        headStyles: { fillColor: [245, 247, 250], textColor: textColor, fontStyle: "bold", lineWidth: 0.1, lineColor: [229, 231, 235] },
        bodyStyles: { textColor: textColor },
        alternateRowStyles: { fillColor: [252, 253, 254] },
        styles: { fontSize: 9, cellPadding: 5, lineWidth: 0.1, lineColor: [229, 231, 235] },
        tableLineWidth: 0.1,
        tableLineColor: [229, 231, 235],
      });
      yPosition = (doc as any).lastAutoTable.finalY + 14;
    }
  }

  const recommendations = report.recommendations || [];
  if (recommendations.length > 0) {
    addSectionTitle("Personalized Recommendations", "");
    
    const recData = recommendations.map((rec: any, index: number) => {
      const recText = typeof rec === 'string' 
        ? rec 
        : rec.title 
          ? `${rec.title}${rec.description ? ': ' + rec.description : ''}`
          : rec.description || rec.recommendation || String(rec);
      return [`${index + 1}`, recText];
    });
    
    autoTable(doc, {
      startY: yPosition,
      head: [["#", "Recommendation"]],
      body: recData,
      margin: { left: margin, right: margin },
      headStyles: { fillColor: [245, 247, 250], textColor: textColor, fontStyle: "bold", lineWidth: 0.1, lineColor: [229, 231, 235] },
      bodyStyles: { textColor: textColor, fillColor: [255, 255, 255] },
      columnStyles: { 0: { cellWidth: 15, halign: "center" } },
      styles: { fontSize: 9, cellPadding: 6, lineWidth: 0.1, lineColor: [229, 231, 235] },
      tableLineWidth: 0.1,
      tableLineColor: [229, 231, 235],
    });
    yPosition = (doc as any).lastAutoTable.finalY + 14;
  }

  const footerY = pageHeight - 22;
  
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6);
  
  doc.setFontSize(7);
  doc.setTextColor(...lightGray);
  doc.setFont("helvetica", "normal");
  doc.text(
    "This report is for personal reference only and does not constitute medical advice.",
    pageWidth / 2,
    footerY,
    { align: "center" }
  );
  doc.text(
    "For health concerns, please consult a healthcare professional.",
    pageWidth / 2,
    footerY + 4,
    { align: "center" }
  );
  doc.setFont("helvetica", "italic");
  doc.text(
    `Built by Airfns  •  ${formatDateTime(new Date().toISOString())}`,
    pageWidth / 2,
    footerY + 10,
    { align: "center" }
  );

  return doc;
}

function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(filename);
}

interface ReportDownloadButtonProps {
  variant?: "default" | "outline" | "ghost" | "secondary" | "calm";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function ReportDownloadButton({
  variant = "outline",
  size = "default",
  className = "",
}: ReportDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showNoReportDialog, setShowNoReportDialog] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const response = await api.getLatestReport();
      const report = response.data?.report;

      if (!report) {
        setShowNoReportDialog(true);
        return;
      }

      const pdfDoc = generatePDFReport(report);
      const date = new Date().toISOString().split("T")[0];
      const time = new Date().toTimeString().split(" ")[0].replace(/:/g, "-");
      downloadPDF(pdfDoc, `wellbeing-report-${date}_${time}.pdf`);
    } catch (error) {
      console.error("Error fetching report:", error);
      setShowNoReportDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleDownload}
        disabled={isLoading}
        className={className}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        <span>{isLoading ? "Generating..." : "Download PDF Report"}</span>
      </Button>

      <Dialog open={showNoReportDialog} onOpenChange={setShowNoReportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              No Report Available
            </DialogTitle>
            <DialogDescription>
              You don't have a wellbeing report yet. Generate your first report
              to get personalized insights about your wellbeing journey.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowNoReportDialog(false)}
            >
              Cancel
            </Button>
            <Link href="/history">
              <Button onClick={() => setShowNoReportDialog(false)}>
                Generate Report
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ReportDownloadButton;

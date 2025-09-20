import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { GroundwaterData } from './groundwaterApi';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface PDFExportOptions {
  groundwaterData: GroundwaterData | null;
  userLocation: { lat: number; lon: number; name?: string };
  exportDate: Date;
}

export class PDFExportService {
  private doc: jsPDF;
  private currentY: number = 20;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  private addHeader(title: string, subtitle?: string): void {
    // Header background
    this.doc.setFillColor(59, 130, 246); // Blue-500
    this.doc.rect(0, 0, this.pageWidth, 30, 'F');

    // Logo/Icon
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(24);
    this.doc.text('🌊', 15, 20);

    // Title
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, 30, 20);

    // Subtitle
    if (subtitle) {
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(subtitle, 30, 25);
    }

    // Export date
    this.doc.setFontSize(8);
    this.doc.text(`Generated on: ${new Date().toLocaleString()}`, this.pageWidth - 60, 25);

    this.currentY = 40;
  }

  private addSection(title: string, content: () => void): void {
    // Section title
    this.doc.setTextColor(31, 41, 55); // Gray-800
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 8;

    // Section content
    content();

    this.currentY += 10;
  }

  private addTable(headers: string[], data: string[][], title?: string): void {
    if (title) {
      this.doc.setTextColor(75, 85, 99); // Gray-600
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(title, this.margin, this.currentY);
      this.currentY += 5;
    }

    this.doc.autoTable({
      head: [headers],
      body: data,
      startY: this.currentY,
      margin: { left: this.margin, right: this.margin },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak',
        halign: 'left',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [59, 130, 246], // Blue-500
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251], // Gray-50
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 60 },
      },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  private addKeyValuePair(key: string, value: string, color: number[] = [31, 41, 55]): void {
    this.doc.setTextColor(75, 85, 99); // Gray-600
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(key + ':', this.margin, this.currentY);

    this.doc.setTextColor(color[0], color[1], color[2]);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(value, this.margin + 40, this.currentY);

    this.currentY += 5;
  }

  private addChartPlaceholder(title: string): void {
    // Chart placeholder box
    this.doc.setDrawColor(209, 213, 219); // Gray-300
    this.doc.setFillColor(249, 250, 251); // Gray-50
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 40, 'FD');

    // Chart title
    this.doc.setTextColor(75, 85, 99); // Gray-600
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin + 5, this.currentY + 8);

    // Placeholder text
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Visual representation of groundwater levels', this.margin + 5, this.currentY + 15);
    this.doc.text('and aquifer characteristics', this.margin + 5, this.currentY + 22);

    this.currentY += 50;
  }

  private checkPageBreak(requiredSpace: number = 20): void {
    if (this.currentY + requiredSpace > this.pageHeight - 20) {
      this.doc.addPage();
      this.currentY = 20;
    }
  }

  public generateGroundwaterReport(options: PDFExportOptions): void {
    const { groundwaterData, userLocation, exportDate } = options;

    // Header
    this.addHeader(
      'Groundwater Analysis Report',
      'Comprehensive groundwater, soil, and aquifer data analysis'
    );

    // Location Information
    this.addSection('📍 Location Information', () => {
      this.addKeyValuePair('Location Name', userLocation.name || groundwaterData?.location?.name || 'Demo Location');
      this.addKeyValuePair('Coordinates', `${userLocation.lat.toFixed(4)}°N, ${userLocation.lon.toFixed(4)}°E`);
      this.addKeyValuePair('Country', groundwaterData?.location?.country || 'India');
      this.addKeyValuePair('Data Source', groundwaterData?.metadata?.data_source || 'India WRIS (Primary)');
      this.addKeyValuePair('Last Updated', new Date(groundwaterData?.groundwater?.last_updated || new Date()).toLocaleString());
    });

    this.checkPageBreak();

    // Groundwater Data
    this.addSection('💧 Groundwater Information', () => {
      const groundwaterTable = [
        ['Parameter', 'Value', 'Unit'],
        ['Water Level', (groundwaterData?.groundwater?.level_m || 12.5).toFixed(1), 'meters'],
        ['Depth to Water', (groundwaterData?.groundwater?.depth_m || 15.8).toFixed(1), 'meters'],
        ['Water Quality', groundwaterData?.groundwater?.quality || 'Good', 'rating'],
        ['Last Updated', new Date(groundwaterData?.groundwater?.last_updated || new Date()).toLocaleString(), ''],
        ['Data Source', groundwaterData?.groundwater?.source || 'API', ''],
      ];

      this.addTable(
        ['Parameter', 'Value'], // Headers
        groundwaterTable.slice(1).map(row => row.slice(0, 2)), // Body data without header row
        'Current groundwater status and measurements'
      );
    });

    this.checkPageBreak();

    // Aquifer Information
    this.addSection('🏔️ Aquifer Characteristics', () => {
      const aquiferTable = [
        ['Parameter', 'Value'],
        ['Aquifer Type', groundwaterData?.aquifer?.type || 'Unconfined'],
        ['Material Composition', groundwaterData?.aquifer?.material || 'Alluvial'],
        ['Thickness', `${(groundwaterData?.aquifer?.thickness_m || 20.0).toFixed(1)} meters`],
        ['Permeability', `${(groundwaterData?.aquifer?.permeability || 0.001).toExponential(2)} m/s`],
        ['Porosity', `${((groundwaterData?.aquifer?.porosity || 0.3) * 100).toFixed(1)}%`],
        ['Recharge Rate', `${(groundwaterData?.aquifer?.recharge_rate || 0.5).toFixed(2)} mm/year`],
      ];

      this.addTable(
        ['Parameter', 'Value'], // Headers
        aquiferTable.slice(1).map(row => row.slice(0, 2)), // Body data without header row
        'Physical and hydraulic properties of the aquifer'
      );
    });

    this.checkPageBreak();

    // Soil Information
    this.addSection('🌱 Soil Properties', () => {
      const soilTable = [
        ['Parameter', 'Value'],
        ['Soil Type', groundwaterData?.soil?.type || 'Clay Loam'],
        ['Texture', groundwaterData?.soil?.texture || 'Medium'],
        ['Depth', `${(groundwaterData?.soil?.depth_m || 2.0).toFixed(1)} meters`],
        ['Permeability', `${(groundwaterData?.soil?.permeability || 0.0001).toExponential(2)} m/s`],
        ['Water Holding Capacity', `${((groundwaterData?.soil?.water_holding_capacity || 0.4) * 100).toFixed(1)}%`],
        ['Color', groundwaterData?.soil?.color || '#A0522D'],
      ];

      this.addTable(
        ['Parameter', 'Value'], // Headers
        soilTable.slice(1).map(row => row.slice(0, 2)), // Body data without header row
        'Physical and chemical properties of soil layers'
      );
    });

    this.checkPageBreak();

    // Visual Representation
    this.addSection('📊 Visual Analysis', () => {
      this.addChartPlaceholder('Groundwater Level Visualization');
    });

    this.checkPageBreak();

    // Historical Data
    this.addSection('📈 Historical Trends', () => {
      const historicalData = [
        ['Period', 'Change', 'Trend'],
        ['Last 7 days', '+2.3m', 'Rising'],
        ['Last 30 days', '+5.1m', 'Rising'],
        ['Last 3 months', '-1.2m', 'Declining'],
        ['Last year', '+8.7m', 'Rising'],
      ];

      this.addTable(
        ['Period', 'Change'], // Headers
        historicalData.slice(1).map(row => row.slice(0, 2)), // Body data without header row
        'Water level changes over different time periods'
      );
    });

    this.checkPageBreak();

    // Recommendations
    this.addSection('💡 Recommendations', () => {
      this.doc.setTextColor(75, 85, 99); // Gray-600
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      
      const recommendations = [
        '• Monitor groundwater levels regularly to track seasonal variations',
        '• Implement water conservation practices to maintain aquifer sustainability',
        '• Consider rainwater harvesting to supplement groundwater recharge',
        '• Regular water quality testing is recommended for safe consumption',
        '• Consult with local hydrogeologists for detailed aquifer management',
      ];

      recommendations.forEach((rec, index) => {
        this.doc.text(rec, this.margin, this.currentY);
        this.currentY += 5;
      });
    });

    // Footer
    this.addFooter();
  }

  private addFooter(): void {
    const footerY = this.pageHeight - 15;
    
    // Footer line
    this.doc.setDrawColor(209, 213, 219); // Gray-300
    this.doc.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);

    // Footer text
    this.doc.setTextColor(107, 114, 128); // Gray-500
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Generated by RTRWH - Real-Time Rainwater Harvesting System', this.margin, footerY);
    this.doc.text('For technical support, contact: support@rtrwh.com', this.pageWidth - 80, footerY);
  }

  public download(filename: string = 'groundwater-report.pdf'): void {
    this.doc.save(filename);
  }
}

export const generateGroundwaterPDF = (groundwaterData: GroundwaterData | null, userLocation: { lat: number; lon: number; name?: string }) => {
  try {
    console.log('Starting PDF generation...');
    console.log('Input data:', { groundwaterData, userLocation });
    
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;
    
    // Color scheme
    const primaryColor = [37, 99, 235]; // Blue-600
    const secondaryColor = [6, 182, 212]; // Cyan-600
    const accentColor = [16, 185, 129]; // Emerald-500
    const textColor = [31, 41, 55]; // Gray-800
    const lightTextColor = [75, 85, 99]; // Gray-600
    const backgroundColor = [248, 250, 252]; // Gray-50
    
    // Header with gradient effect
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Water drop icon (using text)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('💧', 15, 22);
    
    // Main title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Groundwater Analysis Report', 35, 22);
    
    // Subtitle
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Comprehensive Hydrogeological Assessment', 35, 28);
    
    // Generation date
    doc.setFontSize(8);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 60, 28);
    
    yPosition = 50;
    
    // Location Information Card
    doc.setFillColor(backgroundColor[0], backgroundColor[1], backgroundColor[2]);
    doc.roundedRect(15, yPosition, pageWidth - 30, 25, 3, 3, 'F');
    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, yPosition, pageWidth - 30, 25, 3, 3, 'S');
    
    // Location icon
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(14);
    doc.text('📍', 20, yPosition + 8);
    
    // Location title
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Location Information', 30, yPosition + 8);
    
    // Location details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
    doc.text(`Location: ${userLocation.name || 'Unknown Location'}`, 20, yPosition + 15);
    doc.text(`Coordinates: ${userLocation.lat.toFixed(4)}°N, ${userLocation.lon.toFixed(4)}°E`, 20, yPosition + 20);
    
    yPosition += 35;
    
    // Groundwater Data Section
    if (groundwaterData?.groundwater) {
      // Section header
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('💧 Groundwater Data', 15, yPosition);
      yPosition += 10;
      
      // Data cards
      const groundwaterCards = [
        { label: 'Water Level', value: `${groundwaterData.groundwater.level_m?.toFixed(1) || 'N/A'}m`, color: secondaryColor },
        { label: 'Depth to Water', value: `${groundwaterData.groundwater.depth_m?.toFixed(1) || 'N/A'}m`, color: accentColor },
        { label: 'Quality', value: groundwaterData.groundwater.quality || 'N/A', color: primaryColor },
        { label: 'Last Updated', value: new Date(groundwaterData.groundwater.last_updated || new Date()).toLocaleString(), color: lightTextColor }
      ];
      
      groundwaterCards.forEach((card, index) => {
        const x = 15 + (index % 2) * (pageWidth / 2 - 10);
        const y = yPosition + Math.floor(index / 2) * 20;
        
        // Card background
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, y, (pageWidth / 2) - 20, 15, 2, 2, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, (pageWidth / 2) - 20, 15, 2, 2, 'S');
        
        // Card content
        doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
        doc.setFontSize(8);
        doc.text(card.label, x + 3, y + 6);
        
        doc.setTextColor(card.color[0], card.color[1], card.color[2]);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(card.value, x + 3, y + 12);
      });
      
      yPosition += 50;
    }
    
    // Aquifer Properties Section
    if (groundwaterData?.aquifer) {
      // Section header
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('🏔️ Aquifer Properties', 15, yPosition);
      yPosition += 10;
      
      // Aquifer data table
      const aquiferData = [
        ['Type', groundwaterData.aquifer.type || 'N/A'],
        ['Material', groundwaterData.aquifer.material || 'N/A'],
        ['Thickness', `${groundwaterData.aquifer.thickness_m?.toFixed(1) || 'N/A'}m`],
        ['Permeability', `${groundwaterData.aquifer.permeability?.toExponential(2) || 'N/A'} m/s`],
        ['Porosity', `${((groundwaterData.aquifer.porosity || 0) * 100).toFixed(1)}%`],
        ['Recharge Rate', `${groundwaterData.aquifer.recharge_rate?.toFixed(2) || 'N/A'} mm/year`]
      ];
      
      // Table header
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(15, yPosition, pageWidth - 30, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Property', 20, yPosition + 5.5);
      doc.text('Value', (pageWidth / 2) + 10, yPosition + 5.5);
      
      yPosition += 8;
      
      // Table rows
      aquiferData.forEach((row, index) => {
        const bgColor = index % 2 === 0 ? [248, 250, 252] : [255, 255, 255];
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.rect(15, yPosition, pageWidth - 30, 7, 'F');
        
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(row[0], 20, yPosition + 4.5);
        doc.text(row[1], (pageWidth / 2) + 10, yPosition + 4.5);
        
        yPosition += 7;
      });
      
      yPosition += 10;
    }
    
    // Soil Properties Section
    if (groundwaterData?.soil) {
      // Section header
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('🌱 Soil Properties', 15, yPosition);
      yPosition += 10;
      
      // Soil data table
      const soilData = [
        ['Type', groundwaterData.soil.type || 'N/A'],
        ['Texture', groundwaterData.soil.texture || 'N/A'],
        ['Depth', `${groundwaterData.soil.depth_m?.toFixed(1) || 'N/A'}m`],
        ['Permeability', `${groundwaterData.soil.permeability?.toExponential(2) || 'N/A'} m/s`],
        ['Water Capacity', `${((groundwaterData.soil.water_holding_capacity || 0) * 100).toFixed(1)}%`],
        ['Color', groundwaterData.soil.color || 'N/A']
      ];
      
      // Table header
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(15, yPosition, pageWidth - 30, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Property', 20, yPosition + 5.5);
      doc.text('Value', (pageWidth / 2) + 10, yPosition + 5.5);
      
      yPosition += 8;
      
      // Table rows
      soilData.forEach((row, index) => {
        const bgColor = index % 2 === 0 ? [248, 250, 252] : [255, 255, 255];
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.rect(15, yPosition, pageWidth - 30, 7, 'F');
        
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(row[0], 20, yPosition + 4.5);
        doc.text(row[1], (pageWidth / 2) + 10, yPosition + 4.5);
        
        yPosition += 7;
      });
      
      yPosition += 10;
    }
    
    // Data Source Information
    yPosition += 10;
    doc.setFillColor(backgroundColor[0], backgroundColor[1], backgroundColor[2]);
    doc.roundedRect(15, yPosition, pageWidth - 30, 20, 3, 3, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, yPosition, pageWidth - 30, 20, 3, 3, 'S');
    
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 Data Sources & API Information', 20, yPosition + 8);
    
    doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Primary Data Source: ${groundwaterData?.metadata?.data_source || 'India WRIS (Primary)'}`, 20, yPosition + 14);
    doc.text(`Data Confidence: ${((groundwaterData?.metadata?.confidence || 0.5) * 100).toFixed(0)}%`, 20, yPosition + 18);
    
    // Footer
    const footerY = pageHeight - 15;
    doc.setDrawColor(200, 200, 200);
    doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);
    
    doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated by RTRWH - Real-Time Rainwater Harvesting System', 15, footerY);
    doc.text('Powered by Advanced Hydrogeological APIs', pageWidth - 80, footerY);
    
    // Generate filename with location name if available
    const locationSuffix = userLocation.name ? `-${userLocation.name.replace(/[^a-zA-Z0-9]/g, '-')}` : '';
    const filename = `groundwater-analysis${locationSuffix}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    console.log('Downloading PDF with filename:', filename);
    doc.save(filename);
    console.log('PDF download initiated');
  } catch (error) {
    console.error('Error in generateGroundwaterPDF:', error);
    // Fallback: create a simple text file
    try {
      const content = `Groundwater Analysis Report\n\nLocation: ${userLocation.name || 'Unknown'}\nCoordinates: ${userLocation.lat.toFixed(4)}°N, ${userLocation.lon.toFixed(4)}°E\n\nGenerated on: ${new Date().toLocaleString()}\n\nData Source: ${groundwaterData?.metadata?.data_source || 'India WRIS (Primary)'}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `groundwater-analysis-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('Fallback text file downloaded');
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      alert('Error generating report. Please try again.');
    }
  }
};

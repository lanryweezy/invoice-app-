import { Command } from 'commander';
import { ensureAuthenticated, getConfig } from '../lib/config';
import { getDb } from '../lib/firebase-client';
import { formatCurrency, formatDate } from '../utils/formatter';
import { createSpinner, succeed, fail } from '../utils/spinner';
import chalk from 'chalk';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { Invoice } from '../types';

interface TemplateStyles {
  headerColor: string;
  titleColor: string;
  textColor: string;
  sectionColor: string;
  totalColor: string;
  tableHeaderColor: string;
  tableHeaderText: string;
  tableRowEven: string;
  tableRowOdd: string;
  footerColor: string;
}

/**
 * 🔩 Hinge Extension Point: PdfTemplateStrategy
 *
 * Pressure: The PDF generation command had a hardcoded switch statement for styles, meaning any new template format required touching the core pdf generation logic.
 * Contract: Implementors provide a style object conforming to TemplateStyles to define all necessary colors for the PDF document.
 */
export type PdfTemplateStrategy = () => TemplateStyles;

const pdfTemplates = new Map<string, PdfTemplateStrategy>();

export function registerPdfTemplate(name: string, strategy: PdfTemplateStrategy) {
  pdfTemplates.set(name, strategy);
}

registerPdfTemplate('modern', () => ({
  headerColor: '#2c3e50',
  titleColor: '#2c3e50',
  textColor: '#34495e',
  sectionColor: '#2980b9',
  totalColor: '#2980b9',
  tableHeaderColor: '#2980b9',
  tableHeaderText: '#ffffff',
  tableRowEven: '#ecf0f1',
  tableRowOdd: '#ffffff',
  footerColor: '#7f8c8d',
}));

registerPdfTemplate('minimalist', () => ({
  headerColor: '#333333',
  titleColor: '#333333',
  textColor: '#555555',
  sectionColor: '#333333',
  totalColor: '#333333',
  tableHeaderColor: '#f5f5f5',
  tableHeaderText: '#333333',
  tableRowEven: '#ffffff',
  tableRowOdd: '#fafafa',
  footerColor: '#999999',
}));

registerPdfTemplate('formal', () => ({
  headerColor: '#1a1a1a',
  titleColor: '#1a1a1a',
  textColor: '#333333',
  sectionColor: '#1a1a1a',
  totalColor: '#1a1a1a',
  tableHeaderColor: '#1a1a1a',
  tableHeaderText: '#ffffff',
  tableRowEven: '#f9f9f9',
  tableRowOdd: '#ffffff',
  footerColor: '#666666',
}));

function getTemplateStyles(template: string): TemplateStyles {
  const strategy = pdfTemplates.get(template) || pdfTemplates.get('formal')!;
  return strategy();
}

export default function registerPdfCommand(program: Command): void {
  program
    .command('pdf <invoice-number>')
    .description('Generate PDF for invoice')
    .option('-o, --output <directory>', 'Output directory', './')
    .option('-t, --template <template>', 'PDF template (formal|modern|minimalist)', 'formal')
    .option('-l, --logo <path>', 'Path to logo file')
    .action(async (invoiceNumber: string, options) => {
      try {
        const config = ensureAuthenticated();
        const uid = config.userId!;

        const spinner = createSpinner('Loading invoice...');

        try {
          const snapshot = await getDb()
            .collection(`users/${uid}/invoices`)
            .where('invoiceNumber', '==', invoiceNumber)
            .get();

          if (snapshot.empty) {
            fail(spinner, chalk.red(`Invoice ${invoiceNumber} not found`));
            process.exit(1);
          }

          const doc = snapshot.docs[0];
          const invoice = doc.data() as Invoice;

          spinner.text = 'Generating PDF...';

          let logoBuffer: Buffer | null = null;
          const logoPath = options.logo || config.branding?.defaultLogo;

          if (logoPath && fs.existsSync(logoPath)) {
            logoBuffer = await sharp(logoPath)
              .resize({ width: 150, withoutEnlargement: true })
              .toBuffer();
          }

          const styles = getTemplateStyles(options.template);
          const pdfDoc = new PDFDocument({
            size: 'A4',
            margin: 50,
            info: {
              Title: `Invoice ${invoiceNumber}`,
              Author: config.businessName || 'InvoiceApp',
            },
          });

          const outputPath = path.join(options.output, `${invoiceNumber}.pdf`);
          const writeStream = fs.createWriteStream(outputPath);
          pdfDoc.pipe(writeStream);

          let yPosition = 50;

          if (logoBuffer) {
            pdfDoc.image(logoBuffer, 50, yPosition, { width: 150 });
            yPosition += 70;
          }

          pdfDoc
            .fontSize(10)
            .fillColor(styles.headerColor)
            .text(config.businessName || '', 400, 50, { align: 'right' });

          if (config.businessAddress) {
            pdfDoc.text(config.businessAddress, 400, 65, { align: 'right' });
          }

          if (config.businessPhone) {
            pdfDoc.text(config.businessPhone, 400, 80, { align: 'right' });
          }

          pdfDoc
            .fontSize(24)
            .fillColor(styles.titleColor)
            .text('INVOICE', 50, yPosition, { align: 'center' });
          yPosition += 40;

          pdfDoc.fontSize(10).fillColor(styles.textColor);

          pdfDoc.text(`Invoice #: ${invoice.invoiceNumber}`, 50, yPosition);
          pdfDoc.text(`Date: ${formatDate(invoice.issueDate)}`, 50, yPosition + 15);
          pdfDoc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 50, yPosition + 30);

          if (invoice.status) {
            pdfDoc.text(`Status: ${invoice.status}`, 50, yPosition + 45);
          }
          yPosition += 70;

          pdfDoc
            .fontSize(12)
            .fillColor(styles.sectionColor)
            .text('Bill To:', 50, yPosition);
          yPosition += 15;

          pdfDoc
            .fontSize(10)
            .fillColor(styles.textColor)
            .text(invoice.client.name, 50, yPosition);
          if (invoice.client.email) {
            pdfDoc.text(invoice.client.email, 50, yPosition + 12);
          }
          if (invoice.client.address) {
            pdfDoc.text(invoice.client.address, 50, yPosition + 24);
          }
          yPosition += 40;

          pdfDoc
            .fontSize(12)
            .fillColor(styles.sectionColor)
            .text('Items:', 50, yPosition);
          yPosition += 20;

          const colPositions = [50, 300, 350, 430];

          pdfDoc
            .fontSize(9)
            .fillColor(styles.tableHeaderColor)
            .rect(50, yPosition, 460, 20)
            .fill();

          pdfDoc
            .fillColor(styles.tableHeaderText)
            .text('Description', colPositions[0], yPosition + 5)
            .text('Qty', colPositions[1], yPosition + 5)
            .text('Rate', colPositions[2], yPosition + 5, { align: 'right' })
            .text('Amount', colPositions[3], yPosition + 5, { align: 'right' });

          yPosition += 25;

          invoice.lineItems.forEach((item, index) => {
            const rowColor = index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd;

            pdfDoc
              .fillColor(rowColor)
              .rect(50, yPosition, 460, 20)
              .fill();

            pdfDoc
              .fillColor(styles.textColor)
              .text(item.description, colPositions[0], yPosition + 5)
              .text(item.quantity.toString(), colPositions[1], yPosition + 5)
              .text(formatCurrency(item.price, invoice.currency), colPositions[2], yPosition + 5, { align: 'right' })
              .text(formatCurrency(item.price * item.quantity, invoice.currency), colPositions[3], yPosition + 5, { align: 'right' });

            yPosition += 20;
          });

          yPosition += 20;
          const totalsX = 350;
          const totalsValueX = 480;

          pdfDoc.fillColor(styles.textColor);

          pdfDoc.text('Subtotal:', totalsX, yPosition, { align: 'right' });
          pdfDoc.text(formatCurrency(invoice.subtotal || 0, invoice.currency), totalsValueX, yPosition, { align: 'right' });
          yPosition += 15;

          pdfDoc.text('Tax:', totalsX, yPosition, { align: 'right' });
          pdfDoc.text(formatCurrency(invoice.tax || 0, invoice.currency), totalsValueX, yPosition, { align: 'right' });
          yPosition += 15;

          if ((invoice.whtAmount || 0) > 0) {
            pdfDoc.text('WHT:', totalsX, yPosition, { align: 'right' });
            pdfDoc.text(formatCurrency(invoice.whtAmount || 0, invoice.currency), totalsValueX, yPosition, { align: 'right' });
            yPosition += 15;
          }

          if ((invoice.discountAmount || 0) > 0) {
            pdfDoc.text('Discount:', totalsX, yPosition, { align: 'right' });
            const discountText =
              invoice.discountType === 'percentage'
                ? `-${invoice.discountRate}%`
                : `-${formatCurrency(invoice.discountAmount || 0, invoice.currency)}`;
            pdfDoc.text(discountText, totalsValueX, yPosition, { align: 'right' });
            yPosition += 15;
          }

          if (invoice.shipping && invoice.shipping > 0) {
            pdfDoc.text('Shipping:', totalsX, yPosition, { align: 'right' });
            pdfDoc.text(formatCurrency(invoice.shipping, invoice.currency), totalsValueX, yPosition, { align: 'right' });
            yPosition += 15;
          }

          pdfDoc.moveTo(totalsX, yPosition).lineTo(totalsValueX, yPosition).stroke();
          yPosition += 5;

          pdfDoc
            .fontSize(12)
            .fillColor(styles.totalColor)
            .text('Total:', totalsX, yPosition, { align: 'right' })
            .text(formatCurrency(invoice.total || 0, invoice.currency), totalsValueX, yPosition, { align: 'right' });
          yPosition += 30;

          if (config.bankName) {
            pdfDoc
              .fontSize(10)
              .fillColor(styles.sectionColor)
              .text('Payment Details:', 50, yPosition);
            yPosition += 15;

            pdfDoc
              .fillColor(styles.textColor)
              .text(`Bank: ${config.bankName}`, 50, yPosition);
            yPosition += 12;
            pdfDoc.text(`Account: ${config.bankAccount}`, 50, yPosition);
            yPosition += 12;
            pdfDoc.text(`Sort Code: ${config.bankSortCode}`, 50, yPosition);
            yPosition += 20;
          }

          if (invoice.notes) {
            pdfDoc
              .fontSize(10)
              .fillColor(styles.sectionColor)
              .text('Notes:', 50, yPosition);
            yPosition += 15;

            pdfDoc
              .fillColor(styles.textColor)
              .text(invoice.notes, 50, yPosition, { width: 400 });
          }

          const footerText = config.branding?.footerText;
          if (footerText) {
            pdfDoc
              .fontSize(8)
              .fillColor(styles.footerColor)
              .text(footerText, 50, 750, { align: 'center', width: 490 });
          }

          pdfDoc.end();

          await new Promise<void>((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
          });

          succeed(spinner, chalk.green(`PDF generated successfully: ${outputPath}`));

          console.log('\nPDF Details:');
          console.log(`  Invoice: ${invoice.invoiceNumber}`);
          console.log(`  Template: ${options.template}`);
          console.log(`  Output: ${chalk.bold(outputPath)}`);
        } catch (error: any) {
          fail(spinner, chalk.red('Failed to generate PDF'));
          console.error(error.message);
          process.exit(1);
        }
      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });
}

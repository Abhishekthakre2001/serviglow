import PDFDocument from "pdfkit";

export const generateInvoicePdf = async (subscription) => {
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
  });

  const buffers = [];
  doc.on("data", buffers.push.bind(buffers));

  // Header Background
  doc.rect(0, 0, doc.page.width, 110)
    .fill("#0F172A");

  doc.fillColor("white")
    .fontSize(28)
    .font("Helvetica-Bold")
    .text("SERVIGLOW", 50, 35);

  doc.fontSize(12)
    .font("Helvetica")
    .text("Premium Home Services Platform", 50, 70);

  doc.fillColor("#111827");

  // Invoice Title
  doc.fontSize(24)
    .font("Helvetica-Bold")
    .text("INVOICE", 400, 40);

  doc.moveDown(4);

  const invoiceNo = `INV-${Date.now()}`;

  // Invoice Info Box
  doc.roundedRect(50, 140, 500, 90, 8)
    .stroke("#D1D5DB");

  doc.fontSize(11)
    .font("Helvetica-Bold")
    .text("Invoice Number:", 70, 160)
    .font("Helvetica")
    .text(invoiceNo, 180, 160);

  doc.font("Helvetica-Bold")
    .text("Issue Date:", 70, 185)
    .font("Helvetica")
    .text(new Date().toLocaleDateString(), 180, 185);

  doc.font("Helvetica-Bold")
    .text("Status:", 320, 160);

  doc.fillColor("#16A34A")
    .text("PAID", 380, 160);

  doc.fillColor("#111827");

  // Customer Section
  doc.fontSize(16)
    .font("Helvetica-Bold")
    .text("Bill To", 50, 270);

  doc.fontSize(11)
    .font("Helvetica")
    .text(subscription.name, 50, 300)
    .text(subscription.email);

  // Table Header
  const tableTop = 380;

  doc.rect(50, tableTop, 500, 30)
    .fill("#F3F4F6");

  doc.fillColor("#111827")
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("Description", 70, tableTop + 10)
    .text("Period", 280, tableTop + 10)
    .text("Amount", 450, tableTop + 10);

  // Table Row
  doc.rect(50, tableTop + 30, 500, 40)
    .stroke("#E5E7EB");

  doc.font("Helvetica")
    .text(`${subscription.plan_key} Subscription`, 70, tableTop + 45)
    .text(
      `${new Date(subscription.start_date).toLocaleDateString()} - ${new Date(subscription.end_date).toLocaleDateString()}`,
      280,
      tableTop + 45
    )
    .text(`$${subscription.price}`, 450, tableTop + 45);

  // Totals
  const totalY = tableTop + 110;

  doc.font("Helvetica")
    .text("Subtotal", 380, totalY)
    .text(`$${subscription.price}`, 470, totalY);

  doc.text("Tax", 380, totalY + 25)
    .text("$0.00", 470, totalY + 25);

  doc.font("Helvetica-Bold")
    .fontSize(14)
    .text("Total", 380, totalY + 60)
    .text(`$${subscription.price}`, 470, totalY + 60);

  // Footer
  doc.moveTo(50, 700)
    .lineTo(550, 700)
    .stroke("#D1D5DB");

  doc.fontSize(10)
    .fillColor("#6B7280")
    .text(
      "Thank you for choosing ServiGlow.",
      50,
      720,
      { align: "center" }
    );

  doc.text(
    "support@serviglow.com | www.serviglow.com",
    50,
    740,
    { align: "center" }
  );

  doc.end();

  return new Promise((resolve) => {
    doc.on("end", () => {
      resolve(Buffer.concat(buffers));
    });
  });
};
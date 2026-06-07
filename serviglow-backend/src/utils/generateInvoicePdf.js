// utils/generateInvoicePdf.js
import PDFDocument from "pdfkit";

export const generateInvoicePdf = (subscription) => {
    const doc = new PDFDocument({ margin: 40 });

    let buffers = [];

    doc.on("data", buffers.push.bind(buffers));

    doc.fontSize(20).text("ServiGlow Invoice", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Name: ${subscription.name}`);
    doc.text(`Email: ${subscription.email}`);
    doc.text(`Plan: ${subscription.plan_key}`);
    doc.text(`Price: $${subscription.price}`);
    doc.text(`Start Date: ${new Date(subscription.start_date).toLocaleString()}`);
    doc.text(`End Date: ${new Date(subscription.end_date).toLocaleString()}`);

    doc.moveDown();
    doc.text("Thank you for your subscription!");

    doc.end();

    return new Promise((resolve) => {
        doc.on("end", () => {
            const pdfBuffer = Buffer.concat(buffers);
            resolve(pdfBuffer);
        });
    });
};
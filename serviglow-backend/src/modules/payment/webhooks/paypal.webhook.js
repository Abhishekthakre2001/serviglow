// import { paypalRequest } from "../../../config/paypal.js";
// import Subscription from "../models/subscription.model.js";
// import { addOneMonth } from "../../../utils/date.js";

// export const paypalWebhookHandler = async (req, res) => {

//   console.log("webhook calls")
//   try {
//     const webhookEvent = req.body;

//     // verify signature
//     const verificationBody = {
//       auth_algo: req.headers["paypal-auth-algo"],
//       cert_url: req.headers["paypal-cert-url"],
//       transmission_id: req.headers["paypal-transmission-id"],
//       transmission_sig: req.headers["paypal-transmission-sig"],
//       transmission_time: req.headers["paypal-transmission-time"],
//       webhook_id: process.env.PAYPAL_WEBHOOK_ID,
//       webhook_event: webhookEvent,
//     };

//     const verification = await paypalRequest(
//       "POST",
//       "/v1/notifications/verify-webhook-signature",
//       verificationBody
//     );

//     if (verification?.verification_status !== "SUCCESS") {
//       return res.status(400).json({ success: false, message: "Invalid webhook signature" });
//     }

//     const eventType = webhookEvent.event_type;

//     // ✅ When subscription becomes ACTIVE
//     if (eventType === "BILLING.SUBSCRIPTION.ACTIVATED") {
//       const subscriptionId = webhookEvent.resource?.id;

//       const startDate = new Date();              // you can also use PayPal event time
//       const endDate = addOneMonth(startDate);    // +1 month

//       await Subscription.updateByPaypalId(subscriptionId, {
//         status: "ACTIVE",
//         subscription: true,
//         startDate,
//         endDate,
//       });
//     }

//     // ✅ When subscription cancelled
//     if (eventType === "BILLING.SUBSCRIPTION.CANCELLED") {
//       const subscriptionId = webhookEvent.resource?.id;
//       await Subscription.updateByPaypalId(subscriptionId, {
//         status: "CANCELLED",
//         subscription: false,
//         startDate: null,
//         endDate: null,
//       });
//     }

//     return res.status(200).json({ received: true });
//   } catch (err) {
//     return res.status(500).json({ success: false, message: err?.message || "Webhook error" });
//   }
// };

import { paypalRequest } from "../../../config/paypal.js";
import Subscription from "../models/subscription.model.js";
import { addOneMonth } from "../../../utils/date.js";
import { sendMail } from "../../../utils/sendMail.js";
import { generateInvoicePdf } from "../../../utils/generateInvoicePdf.js";

// ======================================================
// PAYPAL WEBHOOK HANDLER
// ======================================================

export const paypalWebhookHandler = async (req, res) => {
  console.log("📩 PayPal webhook triggered");

  try {
    const webhookEvent = req.body;

    // ======================================================
    // VERIFY WEBHOOK SIGNATURE
    // ======================================================

    const verificationBody = {
      auth_algo: req.headers["paypal-auth-algo"],
      cert_url: req.headers["paypal-cert-url"],
      transmission_id: req.headers["paypal-transmission-id"],
      transmission_sig: req.headers["paypal-transmission-sig"],
      transmission_time: req.headers["paypal-transmission-time"],
      webhook_id: process.env.PAYPAL_WEBHOOK_ID,
      webhook_event: webhookEvent,
    };

    const verification = await paypalRequest(
      "POST",
      "/v1/notifications/verify-webhook-signature",
      verificationBody
    );

    if (verification?.verification_status !== "SUCCESS") {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    // ======================================================
    // EVENT DETAILS
    // ======================================================

    const eventType = webhookEvent.event_type;
    const resource = webhookEvent.resource;

    console.log("📌 PayPal webhook event:", {
      eventType,
      resourceId: resource?.id || resource?.billing_agreement_id,
      resourceType: resource?.resource_type,
      relationships: resource?.relationships,
    });

    const subscriptionId = resource?.id || resource?.billing_agreement_id;

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        message: "Subscription ID missing",
      });
    }

    // ======================================================
    // GET SUBSCRIPTION FROM DB
    // ======================================================

    const subscription = await Subscription.findByPaypalId(
      subscriptionId
    );

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    const customerEmail = subscription.email;
    const customerName = subscription.name || "User";

    // ======================================================
    // 1. SUBSCRIPTION ACTIVATED
    // ======================================================

    if (eventType === "BILLING.SUBSCRIPTION.ACTIVATED") {

      const startDate = new Date();
      const endDate = addOneMonth(startDate);

      await Subscription.updateByPaypalId(subscriptionId, {
        status: "ACTIVE",
        subscription: true,
        startDate,
        endDate,
      });

      const pdfBuffer = await generateInvoicePdf({
        ...subscription,
        start_date: startDate,
        end_date: endDate,
      });

      await sendMail({
        to: customerEmail,
        subject: "Subscription Activated - ServiGlow",
        html: subscriptionActivatedTemplate({
          ...subscription,
          start_date: startDate,
          end_date: endDate,
        }),

        attachments: [
          {
            filename: `invoice-${subscription.paypal_subscription_id}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ]
      });

      console.log("✅ Activation email sent");
    }

    // ======================================================
    // 2. SUBSCRIPTION CANCELLED
    // ======================================================

    if (eventType === "BILLING.SUBSCRIPTION.CANCELLED") {
      const cancelDate = new Date();

      console.log("📌 PayPal cancellation event payload", {
        subscriptionId,
        eventType,
        cancelDate,
      });

      const updateResult = await Subscription.updateByPaypalId(subscriptionId, {
        status: "CANCELLED",
        subscription: false,
        startDate: null,
        endDate: null,
        cancelDate,
      });

      console.log("📌 PayPal cancellation update result", updateResult);

      await sendMail({
        to: customerEmail,
        subject: "Subscription Cancelled - ServiGlow",
        html: subscriptionCancelledTemplate({
          name: customerName,
          plan: subscription.plan_key,
        }),
      });

      console.log("❌ Cancellation email sent");
    }

    // ======================================================
    // 3. SUBSCRIPTION RENEWED
    // ======================================================

    if (
      eventType === "PAYMENT.SALE.COMPLETED" ||
      eventType === "BILLING.SUBSCRIPTION.RE-ACTIVATED"
    ) {

      const startDate = new Date();
      const endDate = addOneMonth(startDate);

      await Subscription.updateByPaypalId(subscriptionId, {
        status: "ACTIVE",
        subscription: true,
        startDate,
        endDate,
      });

      await sendMail({
        to: customerEmail,
        subject: "Subscription Renewed - ServiGlow",
        html: subscriptionRenewedTemplate({
          ...subscription,
          start_date: startDate,
          end_date: endDate,
        }),
      });

      console.log("🔄 Renewal email sent");
    }

    // ======================================================
    // 4. SUBSCRIPTION EXPIRED
    // ======================================================

    if (eventType === "BILLING.SUBSCRIPTION.EXPIRED") {

      await Subscription.updateByPaypalId(subscriptionId, {
        status: "EXPIRED",
        subscription: false,
        startDate: null,
        endDate: null,
      });

      await sendMail({
        to: customerEmail,
        subject: "Subscription Expired - ServiGlow",
        html: subscriptionExpiredTemplate({
          name: customerName,
          plan: subscription.plan_key,
        }),
      });

      console.log("⌛ Expiry email sent");
    }

    return res.status(200).json({
      success: true,
      received: true,
    });

  } catch (err) {
    console.error("❌ WEBHOOK ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err?.message || "Webhook error",
    });
  }
};

// ======================================================
// EMAIL TEMPLATES
// ======================================================

// const subscriptionActivatedTemplate = ({
//   name,
//   plan,
//   endDate,
// }) => `
// <div style="font-family:Arial;padding:20px">
//   <h2 style="color:#16a34a;">✅ Subscription Activated</h2>

//   <p>Hello <b>${name}</b>,</p>

//   <p>Your subscription has been activated successfully.</p>

//   <div style="background:#f3f4f6;padding:20px;border-radius:10px;">
//     <p><b>Plan:</b> ${plan}</p>
//     <p><b>Valid Until:</b> ${new Date(endDate).toLocaleDateString("en-GB")}</p>
//   </div>

//   <p>Thank you for subscribing to ServiGlow.</p>
// </div>
// `;

const subscriptionActivatedTemplate = (subscription) => `

<div style="font-family:Arial,sans-serif;background:#f4f6f9;padding:40px 0;">

  <div style="max-width:700px;margin:auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">

<div style="background:#1db84f;padding:25px;text-align:center;color:#fff;">
  <h1 style="margin:0;font-size:32px;font-weight:bold;">
    ServiGlow
  </h1>

  <p style="margin:8px 0 0;font-size:14px;">
    Subscription Activated Successfully
  </p>
</div>


<div style="padding:30px;">

  <h2 style="margin:0 0 20px;color:#111827;font-size:24px;">
    🎉 Welcome ${subscription.name}
  </h2>

  <p style="color:#4b5563;font-size:14px;line-height:24px;">
    Your subscription has been activated successfully.
    Premium features are now available on your account.
  </p>


  <div style="
    background:#eefaf2;
    border:1px solid #b7e4c7;
    border-radius:8px;
    padding:18px;
    margin-top:25px;
  ">
    <h3 style="margin-top:0;color:#111827;font-size:16px;">
      Subscription Details
    </h3>

    <table width="100%" cellpadding="6" cellspacing="0">
      <tr>
        <td><strong>Plan</strong></td>
        <td>${subscription.plan_key}</td>
      </tr>

      <tr>
        <td><strong>Status</strong></td>
        <td>
          <span style="
            background:#16a34a;
            color:#fff;
            padding:4px 10px;
            border-radius:12px;
            font-size:12px;
          ">
           ACTIVE
          </span>
        </td>
      </tr>

      <tr>
        <td><strong>Start Date</strong></td>
        <td>${new Date(subscription.start_date).toLocaleDateString("en-GB")}</td>
      </tr>

      <tr>
        <td><strong>End Date</strong></td>
        <td>${new Date(subscription.end_date).toLocaleDateString("en-GB")}</td>
      </tr>
    </table>
  </div>

 
  <div style="
    margin-top:25px;
    border:1px solid #dfe3e8;
    border-radius:8px;
    overflow:hidden;
  ">


    <div style="
      background:#0f172a;
      color:#fff;
      padding:18px 20px;
    ">
      <table width="100%">
        <tr>
          <td>
            <h2 style="margin:0;font-size:22px; color:white;">
              INVOICE
            </h2>

           
          </td>

          <td align="right" style="font-size:12px;">
            Date:
            ${new Date(subscription.created_at).toLocaleDateString("en-GB")}
          </td>
        </tr>
      </table>
    </div>

  
    <div style="padding:20px;">

      <table width="100%">
        <tr>
          <td width="50%" valign="top">

            <h4 style="margin:0 0 10px;">
              Customer Information
            </h4>

            <p style="margin:4px 0;">
              <strong>Name:</strong> ${subscription.name}
            </p>


            <p style="margin:4px 0;">
              <strong>Email:</strong> ${subscription.email}
            </p>

          </td>

          <td width="50%" align="right" valign="top">

            <h4 style="margin:0 0 10px;">
              Billing Information
            </h4>

            <p style="margin:4px 0;">
              <strong>PayPal Subscription ID</strong>
            </p>

            <p style="
              margin:4px 0;
              color:#6b7280;
              font-size:13px;
            ">
              ${subscription.paypal_subscription_id}
            </p>

          </td>
        </tr>
      </table>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">

   
      <table width="100%" cellpadding="10" cellspacing="0">

        <tr style="background:#f9fafb;">
          <th align="left">Description</th>
          <th align="center">Plan</th>
          <th align="center">Period</th>
          <th align="right">Amount</th>
        </tr>

        <tr>
          <td>ServiGlow Premium Subscription</td>
          <td align="center">${subscription.plan_key}</td>
          <td align="center">1 Month</td>
          <td align="right">$${subscription.price}</td>
        </tr>

      </table>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">

    
      <table width="100%">
        <tr>
          <td></td>

          <td width="220">

            <table width="100%">

              <tr>
                <td>Subtotal</td>
                <td align="right">$${subscription.price}</td>
              </tr>

              <tr>
                <td>Tax</td>
                <td align="right">$0.00</td>
              </tr>

              <tr>
                <td colspan="2">
                  <hr style="border:none;border-top:1px solid #d1d5db;">
                </td>
              </tr>

              <tr>
                <td>
                  <strong>Total Paid</strong>
                </td>

                <td align="right">
                  <strong style="color:#16a34a;">
                    $${subscription.price}
                  </strong>
                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>

   
      <div style="
        margin-top:20px;
        background:#f8fafc;
        border:1px solid #e5e7eb;
        border-radius:6px;
        padding:15px;
      ">

        <table width="100%" cellpadding="4">

          <tr>
            <td><strong>Status</strong></td>
            <td>Active</td>
          </tr>

          <tr>
            <td><strong>Created Date</strong></td>
            <td>${new Date(subscription.created_at).toLocaleString()}</td>
          </tr>

          <tr>
            <td><strong>Subscription Start</strong></td>
            <td>${new Date(subscription.start_date).toLocaleString()}</td>
          </tr>

          <tr>
            <td><strong>Subscription End</strong></td>
            <td>${new Date(subscription.end_date).toLocaleString()}</td>
          </tr>

        </table>

      </div>

    </div>
  </div>

  <p style="margin-top:25px;color:#4b5563;">
    Thank you for choosing ServiGlow.
    We appreciate your trust and support.
  </p>

  <p>
    Regards,<br>
    <strong>ServiGlow Team</strong>
  </p>

</div>


<div style="
  background:#0f172a;
  color:#fff;
  text-align:center;
  padding:18px;
  font-size:12px;
">
  © ${new Date().getFullYear()} ServiGlow. All Rights Reserved.
</div>


  </div>
</div>
`;


// const subscriptionRenewedTemplate = ({
//   name,
//   plan,
//   endDate,
// }) => `
// <div style="font-family:Arial;padding:20px">
//   <h2 style="color:#2563eb;">🔄 Subscription Renewed</h2>

//   <p>Hello <b>${name}</b>,</p>

//   <p>Your subscription has been renewed successfully.</p>

//   <div style="background:#f3f4f6;padding:20px;border-radius:10px;">
//     <p><b>Plan:</b> ${plan}</p>
//     <p><b>Next Billing Date:</b> ${new Date(endDate).toLocaleDateString("en-GB")}</p>
//   </div>

//   <p>Thank you for staying with ServiGlow.</p>
// </div>
// `;

const subscriptionRenewedTemplate = (subscription) => `

<div style="font-family:Arial,sans-serif;background:#f4f6f9;padding:40px 0;">
  <div style="max-width:700px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 6px 20px rgba(0,0,0,.08);">
<div style="background:linear-gradient(90deg,#2563eb,#3b82f6);padding:25px;text-align:center;color:#fff;">
  <h1 style="margin:0;">ServiGlow</h1>
  <p style="margin:8px 0 0;">
    Subscription Renewed Successfully
  </p>
</div>

<div style="padding:35px;">

  <h2 style="color:#111827;">
    🔄 Hello ${subscription.name}
  </h2>

  <p style="color:#4b5563;line-height:1.7;">
    Your subscription has been renewed successfully. Your premium access continues without interruption.
  </p>

  <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:20px;margin:25px 0;">
    <h3 style="margin-top:0;color:#1d4ed8;">
      Renewal Details
    </h3>

    <table width="100%" cellpadding="6">
      <tr>
        <td><strong>Plan</strong></td>
        <td>${subscription.plan_key}</td>
      </tr>

      <tr>
        <td><strong>Status</strong></td>
        <td>${subscription.status}</td>
      </tr>

      <tr>
        <td><strong>Next Billing Date</strong></td>
        <td>${new Date(subscription.end_date).toLocaleDateString("en-GB")}</td>
      </tr>
    </table>
  </div>

  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:25px;">
    <h3 style="margin-top:0;">
      Renewal Invoice
    </h3>

    <table width="100%" cellpadding="8">

      <tr>
        <td><strong>Name</strong></td>
        <td>${subscription.name}</td>
      </tr>

      <tr>
        <td><strong>Username</strong></td>
        <td>${subscription.username}</td>
      </tr>

      <tr>
        <td><strong>Amount Paid</strong></td>
        <td>$${subscription.price}</td>
      </tr>

      <tr>
        <td><strong>Plan</strong></td>
        <td>${subscription.plan_key}</td>
      </tr>

      <tr>
        <td><strong>PayPal Subscription ID</strong></td>
        <td>${subscription.paypal_subscription_id}</td>
      </tr>

      <tr>
        <td><strong>Status</strong></td>
        <td>${subscription.status}</td>
      </tr>

      <tr>
        <td><strong>Start Date</strong></td>
        <td>${new Date(subscription.start_date).toLocaleString()}</td>
      </tr>

      <tr>
        <td><strong>End Date</strong></td>
        <td>${new Date(subscription.end_date).toLocaleString()}</td>
      </tr>

      <tr>
        <td><strong>Created Date</strong></td>
        <td>${new Date(subscription.created_at).toLocaleString()}</td>
      </tr>

    </table>
  </div>

  <p style="margin-top:25px;">
    Thank you for continuing with ServiGlow.
  </p>

  <p>
    Regards,<br>
    <strong>ServiGlow Team</strong>
  </p>

</div>

<div style="background:#111827;color:#fff;text-align:center;padding:15px;font-size:12px;">
  © ${new Date().getFullYear()} ServiGlow. All Rights Reserved.
</div>
  </div>
</div>
`;

const subscriptionCancelledTemplate = (subscription) => `

<div style="font-family:Arial,sans-serif;background:#f4f6f9;padding:40px 0;">

  <div style="max-width:700px;margin:auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">

<div style="background:#dc2626;padding:25px;text-align:center;color:#fff;">
  <h1 style="margin:0;font-size:32px;font-weight:bold;">
    ServiGlow
  </h1>

  <p style="margin:8px 0 0;font-size:14px;">
    Subscription Cancelled
  </p>
</div>

<div style="padding:30px;">

  <h2 style="margin:0 0 20px;color:#111827;font-size:24px;">
    ❌ Hello ${subscription.name}
  </h2>

  <p style="color:#4b5563;font-size:14px;line-height:24px;">
    Your subscription has been cancelled successfully.
    Premium features will no longer be available after your subscription period ends.
  </p>

  <div style="
    background:#fef2f2;
    border:1px solid #fecaca;
    border-radius:8px;
    padding:18px;
    margin-top:25px;
  ">
    <h3 style="margin-top:0;color:#991b1b;">
      Cancellation Details
    </h3>

    <table width="100%" cellpadding="6">
     

      <tr>
        <td><strong>Status</strong></td>
        <td>
          <span style="
            background:#dc2626;
            color:#fff;
            padding:4px 10px;
            border-radius:12px;
            font-size:12px;
          ">
            CANCELLED
          </span>
        </td>
      </tr>

      <tr>
        <td><strong>Cancelled On</strong></td>
        <td>${new Date().toLocaleDateString("en-GB")}</td>
      </tr>
    </table>
  </div>

  <!-- COPY THE SAME INVOICE SECTION FROM ACTIVATED TEMPLATE -->

  <p style="margin-top:25px;color:#4b5563;">
    We're sorry to see you go. You can subscribe again anytime.
  </p>

  <p>
    Regards,<br>
    <strong>ServiGlow Team</strong>
  </p>

</div>

<div style="
  background:#0f172a;
  color:#fff;
  text-align:center;
  padding:18px;
  font-size:12px;
">
  © ${new Date().getFullYear()} ServiGlow. All Rights Reserved.
</div>


  </div>
</div>
`;

const subscriptionExpiredTemplate = (subscription) => `

<div style="font-family:Arial,sans-serif;background:#f4f6f9;padding:40px 0;">

  <div style="max-width:700px;margin:auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">

<div style="background:#f59e0b;padding:25px;text-align:center;color:#fff;">
  <h1 style="margin:0;font-size:32px;font-weight:bold;">
    ServiGlow
  </h1>

  <p style="margin:8px 0 0;font-size:14px;">
    Subscription Expired
  </p>
</div>

<div style="padding:30px;">

  <h2 style="margin:0 0 20px;color:#111827;font-size:24px;">
    ⌛ Hello ${subscription.name}
  </h2>

  <p style="color:#4b5563;font-size:14px;line-height:24px;">
    Your subscription has expired and your premium access has ended.
    Renew your subscription to continue enjoying ServiGlow premium features.
  </p>

  <div style="
    background:#fffbeb;
    border:1px solid #fde68a;
    border-radius:8px;
    padding:18px;
    margin-top:25px;
  ">
    <h3 style="margin-top:0;color:#92400e;">
      Expiration Details
    </h3>

    <table width="100%" cellpadding="6">
      <tr>
        <td><strong>Plan</strong></td>
        <td>${subscription.plan_key}</td>
      </tr>

      <tr>
        <td><strong>Status</strong></td>
        <td>
          <span style="
            background:#f59e0b;
            color:#fff;
            padding:4px 10px;
            border-radius:12px;
            font-size:12px;
          ">
            EXPIRED
          </span>
        </td>
      </tr>

      <tr>
        <td><strong>Expired On</strong></td>
        <td>${new Date().toLocaleDateString("en-GB")}</td>
      </tr>
    </table>
  </div>

  <!-- COPY THE SAME INVOICE SECTION FROM ACTIVATED TEMPLATE -->

  <p style="margin-top:25px;color:#4b5563;">
    Renew today to restore access to all premium features.
  </p>

  <p>
    Regards,<br>
    <strong>ServiGlow Team</strong>
  </p>

</div>

<div style="
  background:#0f172a;
  color:#fff;
  text-align:center;
  padding:18px;
  font-size:12px;
">
  © ${new Date().getFullYear()} ServiGlow. All Rights Reserved.
</div>


  </div>
</div>
`;

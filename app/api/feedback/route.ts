import { NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseClient } from "@/lib/supabase/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawMessage = body?.message;

    if (!rawMessage || typeof rawMessage !== "string" || !rawMessage.trim()) {
      return NextResponse.json(
        { ok: false, error: "Please provide your feedback or suggestion." },
        { status: 400 }
      );
    }

    const message = rawMessage.trim();
    const recipientEmail = process.env.FEEDBACK_RECIPIENT_EMAIL || "hariharan.uix@gmail.com";
    let storedInDb = false;
    let emailSent = false;

    // 1. Store in Supabase if available
    try {
      const supabase = getSupabaseAdminClient() || getSupabaseClient();
      if (supabase) {
        const { error: dbError } = await supabase.from("feedback").insert([
          {
            message,
            status: "new",
          },
        ]);

        if (dbError) {
          console.warn("[api/feedback] Supabase insert note:", dbError.message);
        } else {
          storedInDb = true;
        }
      }
    } catch (dbErr) {
      console.warn("[api/feedback] Database insert skipped or table not created yet:", dbErr);
    }

    // 2. Send via SMTP (Nodemailer) if SMTP credentials are provided
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const nodemailer = await import("nodemailer");
        const host = process.env.SMTP_HOST || "smtp.gmail.com";
        const port = Number(process.env.SMTP_PORT) || 465;
        const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465;

        const transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM || `"AIX Vault" <${process.env.SMTP_USER}>`,
          to: recipientEmail,
          subject: "💡 New Tool / Feature Suggestion from AIX Vault",
          text: `You received a new suggestion from an AIX Vault viewer:\n\n${message}\n\nSubmitted at: ${new Date().toISOString()}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
              <h2 style="color: #111827; margin-top: 0; font-size: 20px;">💡 New Suggestion from AIX Vault</h2>
              <p style="color: #4b5563; font-size: 14px; margin-bottom: 20px;">A viewer submitted a new tool or feature request:</p>
              <div style="padding: 16px; background-color: #f9fafb; border-left: 4px solid #10b981; border-radius: 6px; font-size: 15px; color: #1f2937; white-space: pre-wrap; line-height: 1.5;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
              <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; margin-bottom: 0;">Sent via AIX Vault • ${new Date().toLocaleString()}</p>
            </div>
          `,
        });

        emailSent = true;
      } catch (smtpErr) {
        console.error("[api/feedback] SMTP dispatch error:", smtpErr);
      }
    }

    // 3. Send email via Resend if API key is provided
    if (!emailSent && process.env.RESEND_API_KEY) {
      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || "AIX Vault <onboarding@resend.dev>",
            to: [recipientEmail],
            subject: "💡 New Tool / Feature Suggestion from AIX Vault",
            text: `You received a new suggestion from an AIX Vault viewer:\n\n${message}\n\nSubmitted at: ${new Date().toISOString()}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
                <h2 style="color: #111827; margin-top: 0; font-size: 20px;">💡 New Suggestion from AIX Vault</h2>
                <p style="color: #4b5563; font-size: 14px; margin-bottom: 20px;">A viewer submitted a new tool or feature request:</p>
                <div style="padding: 16px; background-color: #f9fafb; border-left: 4px solid #10b981; border-radius: 6px; font-size: 15px; color: #1f2937; white-space: pre-wrap; line-height: 1.5;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
                <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; margin-bottom: 0;">Sent via AIX Vault • ${new Date().toLocaleString()}</p>
              </div>
            `,
          }),
        });

        if (resendRes.ok) {
          emailSent = true;
        } else {
          const errData = await resendRes.text();
          console.warn("[api/feedback] Resend dispatch warning:", errData);
        }
      } catch (emailErr) {
        console.warn("[api/feedback] Resend request failed:", emailErr);
      }
    }

    // 3. Optional Web3Forms fallback if access key provided
    if (!emailSent && process.env.WEB3FORMS_ACCESS_KEY) {
      try {
        const w3Res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            access_key: process.env.WEB3FORMS_ACCESS_KEY,
            subject: "💡 New Tool / Feature Suggestion from AIX Vault",
            from_name: "AIX Vault Viewer",
            to_email: recipientEmail,
            message,
          }),
        });

        if (w3Res.ok) {
          emailSent = true;
        }
      } catch (w3Err) {
        console.warn("[api/feedback] Web3Forms dispatch warning:", w3Err);
      }
    }

    // 4. FormSubmit.co direct forwarder (Zero-config email delivery to recipientEmail)
    if (!emailSent) {
      try {
        const fsRes = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipientEmail)}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Origin: "https://aix-vault.com",
            Referer: "https://aix-vault.com/",
          },
          body: JSON.stringify({
            name: "AIX Vault Viewer",
            _subject: "💡 AIX Vault: New Tool / Feature Suggestion",
            message,
          }),
        });

        const fsData = await fsRes.json().catch(() => null);
        if (fsRes.ok && (fsData?.success === "true" || fsData?.success === true || fsData?.message?.includes("Activation"))) {
          emailSent = true;
        } else {
          console.warn("[api/feedback] FormSubmit status:", fsData);
        }
      } catch (fsErr) {
        console.warn("[api/feedback] FormSubmit dispatch warning:", fsErr);
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Feedback received successfully.",
      storedInDb,
      emailSent,
      recipient: recipientEmail,
    });
  } catch (error) {
    console.error("[api/feedback] Unexpected error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to send feedback. Please try again later." },
      { status: 500 }
    );
  }
}

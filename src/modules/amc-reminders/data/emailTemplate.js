function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function buildAmcReminderEmailTemplate(customer = {}) {
  const customerName = customer.name || "Customer";
  const amcEndDate = formatDate(customer.amc_end_date);
  const amcStartDate = formatDate(customer.amc_start_date);

  return {
    subject: `AMC renewal reminder - ${customerName}`,
    html: `
      <div style="margin:0;padding:0;background:#f6f8fb;font-family:Arial,Helvetica,sans-serif;color:#172033;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f8fb;padding:24px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:640px;max-width:94%;background:#ffffff;border:1px solid #e8eef6;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:22px 26px;background:#003b7d;color:#ffffff;">
                    <div style="font-size:18px;font-weight:700;">AMC Renewal Reminder</div>
                    <div style="margin-top:4px;font-size:13px;opacity:.9;">Your annual maintenance contract is nearing expiry.</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:26px;">
                    <p style="margin:0 0 14px;font-size:14px;line-height:1.6;">Dear ${customerName},</p>
                    <p style="margin:0 0 18px;font-size:14px;line-height:1.6;">
                      This is a friendly reminder that your AMC period from <strong>${amcStartDate}</strong>
                      to <strong>${amcEndDate}</strong> is due for renewal.
                    </p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0;border-collapse:collapse;">
                      <tr>
                        <td style="padding:10px 12px;border:1px solid #e8eef6;background:#f8fbff;font-size:13px;color:#64748b;">Customer</td>
                        <td style="padding:10px 12px;border:1px solid #e8eef6;font-size:13px;">${customerName}</td>
                      </tr>
                      <tr>
                        <td style="padding:10px 12px;border:1px solid #e8eef6;background:#f8fbff;font-size:13px;color:#64748b;">AMC Expiry</td>
                        <td style="padding:10px 12px;border:1px solid #e8eef6;font-size:13px;">${amcEndDate}</td>
                      </tr>
                      <tr>
                        <td style="padding:10px 12px;border:1px solid #e8eef6;background:#f8fbff;font-size:13px;color:#64748b;">Support Calls in AMC Period</td>
                        <td style="padding:10px 12px;border:1px solid #e8eef6;font-size:13px;">${customer.support_call_count ?? 0}</td>
                      </tr>
                    </table>
                    <p style="margin:0 0 18px;font-size:14px;line-height:1.6;">
                      Please contact us to renew your AMC and continue uninterrupted support.
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.6;">Regards,<br/>Support Team</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 26px;background:#f8fbff;border-top:1px solid #e8eef6;color:#64748b;font-size:12px;">
                    If a report is requested, the support-call Excel summary for the AMC period should be attached to this email.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `,
  };
}

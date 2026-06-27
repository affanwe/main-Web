import { createClient } from '@supabase/supabase-js';

let _supabase;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }
  return _supabase;
}

async function getBrevoApiKey() {
  const { data } = await getSupabase().from('metadata').select('value').eq('key', 'brevo').maybeSingle();
  return data?.value?.apiKey || process.env.BREVO_API_KEY || '';
}

function buildOtpHtml(toName, otpCode) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Roboto,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
  <tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 40px;text-align:center">
    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:2px">WOORA</h1>
    <div style="width:50px;height:3px;background:#4f8cff;margin:12px auto 0"></div>
  </td></tr>
  <tr><td style="padding:40px">
    <p style="margin:0 0 8px;color:#555;font-size:15px">Hello,</p>
    <h2 style="margin:0 0 24px;color:#1a1a2e;font-size:20px;font-weight:600">${toName}</h2>
    <p style="margin:0 0 24px;color:#666;font-size:15px;line-height:1.6">
      Use the following OTP to complete your authentication. This code is valid for <strong>15 minutes</strong>.
    </p>
    <div style="background:#f0f4ff;border:2px dashed #4f8cff;border-radius:10px;padding:24px;text-align:center;margin:0 0 24px">
      <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#1a1a2e">${otpCode}</span>
    </div>
    <p style="margin:0;color:#999;font-size:13px;line-height:1.5">
      If you didn't request this code, please ignore this email. Do not share this code with anyone.
    </p>
  </td></tr>
  <tr><td style="background:#f8f9fb;padding:20px 40px;text-align:center;border-top:1px solid #eee">
    <p style="margin:0;color:#aaa;font-size:12px">&copy; ${new Date().getFullYear()} Woora Group. All rights reserved.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function buildReceiptHtml(params) {
  const {
    to_name, shares_count, amount, joining_date, trx_id, type = 'BUY',
    transferor_name, recipient_name,
    receipt_title = 'Thank You!', receipt_subtitle, receipt_emoji = '👏',
    appreciation_text = 'We sincerely appreciate your trust and support in Woora.'
  } = params;

  const count = parseInt(shares_count, 10) || 1;
  const sharePrice = 500;
  const totalAmount = amount || (count * sharePrice);

  const subtitle = receipt_subtitle || (
    type === 'BUY' ? 'Thank you for purchasing shares of Woora.' :
    type === 'SELL' ? 'Your shares have been sold successfully.' :
    'Your share transfer has been completed.'
  );

  const transferSection = type === 'TRANSFER' ? `
    <tr><td style="padding:12px 20px;border-bottom:1px solid #f0f0f0">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="color:#888;font-size:13px">From</td><td align="right" style="color:#1a1a2e;font-size:14px;font-weight:600">${transferor_name || to_name}</td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:12px 20px;border-bottom:1px solid #f0f0f0">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="color:#888;font-size:13px">To</td><td align="right" style="color:#1a1a2e;font-size:14px;font-weight:600">${recipient_name || to_name}</td></tr>
      </table>
    </td></tr>` : '';

  const accentColor = type === 'SELL' ? '#e74c3c' : type === 'TRANSFER' ? '#9b59b6' : '#4f8cff';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Roboto,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
  <tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 40px;text-align:center">
    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:2px">WOORA</h1>
    <div style="width:50px;height:3px;background:${accentColor};margin:12px auto 0"></div>
  </td></tr>
  <tr><td style="padding:40px;text-align:center">
    <div style="font-size:48px;margin-bottom:12px">${receipt_emoji}</div>
    <h2 style="margin:0 0 8px;color:#1a1a2e;font-size:24px;font-weight:700">${receipt_title}</h2>
    <p style="margin:0 0 32px;color:#666;font-size:15px">${subtitle}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fb;border-radius:10px;overflow:hidden;text-align:left">
      <tr><td style="padding:12px 20px;border-bottom:1px solid #f0f0f0">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="color:#888;font-size:13px">Investor</td><td align="right" style="color:#1a1a2e;font-size:14px;font-weight:600">${to_name}</td></tr>
        </table>
      </td></tr>
      ${transferSection}
      <tr><td style="padding:12px 20px;border-bottom:1px solid #f0f0f0">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="color:#888;font-size:13px">Shares</td><td align="right" style="color:#1a1a2e;font-size:14px;font-weight:600">${count}</td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:12px 20px;border-bottom:1px solid #f0f0f0">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="color:#888;font-size:13px">Price per Share</td><td align="right" style="color:#1a1a2e;font-size:14px;font-weight:600">৳${sharePrice}</td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:12px 20px;border-bottom:1px solid #f0f0f0">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="color:#888;font-size:13px">Total Amount</td><td align="right" style="color:${accentColor};font-size:16px;font-weight:700">৳${totalAmount}</td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:12px 20px;border-bottom:1px solid #f0f0f0">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="color:#888;font-size:13px">Date</td><td align="right" style="color:#1a1a2e;font-size:14px;font-weight:600">${joining_date}</td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:12px 20px">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="color:#888;font-size:13px">Transaction ID</td><td align="right" style="color:#1a1a2e;font-size:14px;font-weight:600">${trx_id || 'N/A'}</td></tr>
        </table>
      </td></tr>
    </table>

    <p style="margin:32px 0 0;color:#666;font-size:14px;line-height:1.6">${appreciation_text}</p>
  </td></tr>
  <tr><td style="background:#f8f9fb;padding:20px 40px;text-align:center;border-top:1px solid #eee">
    <p style="margin:0;color:#aaa;font-size:12px">&copy; ${new Date().getFullYear()} Woora Group. All rights reserved.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, ...params } = body;

    const apiKey = await getBrevoApiKey();
    if (!apiKey) {
      return Response.json({ error: 'Brevo API key not configured' }, { status: 500 });
    }

    let htmlContent, subject, toEmail, toName;

    if (type === 'otp') {
      const { to_email, to_name, otp_code } = params;
      toEmail = to_email;
      toName = to_name;
      subject = `OTP for your Woora authentication`;
      htmlContent = buildOtpHtml(to_name, otp_code);
    } else if (type === 'receipt') {
      toEmail = params.to_email;
      toName = params.to_name;
      const txType = params.tx_type || 'BUY';
      const action = txType === 'BUY' ? 'Share Purchase' : txType === 'SELL' ? 'Share Sale' : 'Share Transfer';
      subject = `Woora - ${action} Confirmation`;
      htmlContent = buildReceiptHtml({ ...params, type: txType });
    } else {
      return Response.json({ error: 'Invalid email type' }, { status: 400 });
    }

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Woora Group', email: 'momsudul06@gmail.com' },
        to: [{ email: toEmail, name: toName || toEmail }],
        subject,
        htmlContent,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error('Brevo API error:', errData);
      return Response.json({ error: errData.message || 'Failed to send email' }, { status: res.status });
    }

    const data = await res.json();
    return Response.json({ success: true, messageId: data.messageId });
  } catch (error) {
    console.error('Send email error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

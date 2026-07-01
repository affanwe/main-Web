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

function buildBuyHtml(params) {
  const { to_name, shares_count, amount, joining_date, trx_id,
    receipt_title = 'Thank You!',
    receipt_subtitle = 'Thank you for purchasing shares of Woora.',
    receipt_emoji = '👏',
    appreciation_text = 'We sincerely appreciate your trust and support in Woora.'
  } = params;
  const count = parseInt(shares_count, 10) || 1;
  const sharePrice = 500;
  const totalAmount = amount || (count * sharePrice);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,Arial,sans-serif">
<table style="background-color:#f5f7fb;padding:30px 0" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr><td align="center">
<table style="max-width:640px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08)" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="padding:32px 32px 18px 32px;background:linear-gradient(135deg,#fff7ec 0%,#ffffff 55%,#fff1dc 100%)">
<table border="0" width="100%" cellspacing="0" cellpadding="0"><tbody><tr>
<td style="width:68%" valign="top">
  <div style="font-size:18px;font-weight:bold;color:#f28c28;letter-spacing:1.5px">WOORA</div>
  <div style="font-size:34px;line-height:1.2;font-weight:800;color:#ef7d00;margin-top:16px">${receipt_title}</div>
  <div style="font-size:15px;line-height:24px;color:#555555;margin-top:10px">${receipt_subtitle}</div>
</td>
<td style="width:32%" align="right" valign="top">
  <div style="width:110px;height:110px;border-radius:55px;background:radial-gradient(circle at center,#ffe9cf 0%,#ffd39c 48%,#fff6eb 100%);text-align:center;line-height:110px;font-size:52px">${receipt_emoji}</div>
</td>
</tr></tbody></table>
</td>
</tr>
<tr>
<td style="padding:0 32px 32px 32px">
<table style="background-color:#fffaf4;border:1px solid #f2dcc2;border-radius:16px" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr><td style="padding:24px 24px 10px 24px">
  <div style="font-size:14px;color:#8a6b4f;margin-bottom:8px">Hello, Assalamu Alaikum</div>
  <div style="font-size:28px;font-weight:800;color:#e96f00;line-height:1.2">${to_name}</div>
  <div style="font-size:14px;color:#666666;margin-top:8px;line-height:22px">${appreciation_text}</div>
</td></tr>
<tr><td style="padding:12px 24px 24px 24px">
  <table style="border-collapse:collapse;border:1px solid #f0ddc6;border-radius:12px;overflow:hidden" border="0" width="100%" cellspacing="0" cellpadding="0">
  <tbody>
    <tr>
      <td style="padding:14px 16px;border-bottom:1px solid #f0ddc6;font-size:14px;color:#555555;width:55%"><strong style="color:#ef7d00">›</strong> Number of Investment Units</td>
      <td style="padding:14px 16px;border-bottom:1px solid #f0ddc6;font-size:14px;color:#222222" align="right">${count}</td>
    </tr>
    <tr>
      <td style="padding:14px 16px;border-bottom:1px solid #f0ddc6;font-size:14px;color:#555555"><strong style="color:#ef7d00">›</strong> Unit Price</td>
      <td style="padding:14px 16px;border-bottom:1px solid #f0ddc6;font-size:14px;color:#222222" align="right">৳${sharePrice}</td>
    </tr>
    <tr>
      <td style="padding:14px 16px;border-bottom:1px solid #f0ddc6;font-size:14px;color:#555555"><strong style="color:#ef7d00">›</strong> Total Amount Paid</td>
      <td style="padding:14px 16px;border-bottom:1px solid #f0ddc6;font-size:14px;color:#222222" align="right">৳${totalAmount}</td>
    </tr>
    <tr>
      <td style="padding:14px 16px;border-bottom:1px solid #f0ddc6;font-size:14px;color:#555555"><strong style="color:#ef7d00">›</strong> Purchase Date</td>
      <td style="padding:14px 16px;border-bottom:1px solid #f0ddc6;font-size:14px;color:#222222" align="right">${joining_date}</td>
    </tr>
    <tr>
      <td style="padding:14px 16px;font-size:14px;color:#555555"><strong style="color:#ef7d00">›</strong> Transaction ID</td>
      <td style="padding:14px 16px;font-size:14px;color:#222222" align="right">${trx_id || 'N/A'}</td>
    </tr>
  </tbody>
  </table>
</td></tr>
</tbody>
</table>
</td>
</tr>
<tr>
<td style="padding:0 32px 30px 32px" align="center">
  <div style="font-size:14px;color:#777777;line-height:22px">We appreciate your trust in Woora.</div>
  <div style="font-size:14px;color:#ef7d00;font-weight:bold;margin-top:4px">— Team Woora</div>
</td>
</tr>
</tbody>
</table>
</td></tr></tbody></table>
</body></html>`;
}

function buildSellHtml(params) {
  const { to_name, shares_count, amount, joining_date, trx_id,
    receipt_title = 'Shares Sold Successfully',
    receipt_subtitle = 'Your shares have been sold successfully.',
    appreciation_text = 'Thank you for being a valued member of Woora.'
  } = params;
  const count = parseInt(shares_count, 10) || 1;
  const sharePrice = 500;
  const totalAmount = amount || (count * sharePrice);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,Arial,sans-serif">
<table style="background-color:#f5f7fb;padding:30px 0" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr><td align="center">
<table style="max-width:640px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08)" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="padding:32px 32px 18px 32px;background:linear-gradient(135deg,#f5f7fb 0%,#ffffff 55%,#eef1f6 100%)">
<table border="0" width="100%" cellspacing="0" cellpadding="0"><tbody><tr>
<td style="width:68%" valign="top">
  <div style="font-size:18px;font-weight:bold;color:#5a7396;letter-spacing:1.5px">WOORA</div>
  <div style="font-size:34px;line-height:1.2;font-weight:800;color:#3d5a80;margin-top:16px">${receipt_title}</div>
  <div style="font-size:15px;line-height:24px;color:#555555;margin-top:10px">${receipt_subtitle}</div>
</td>
<td style="width:32%" align="right" valign="top">
  <div style="width:110px;height:110px;border-radius:55px;background:radial-gradient(circle at center,#e8edf4 0%,#c9d4e3 48%,#f0f3f8 100%);text-align:center;line-height:110px;font-size:52px">📋</div>
</td>
</tr></tbody></table>
</td>
</tr>
<tr>
<td style="padding:0 32px 32px 32px">
<table style="background-color:#f5f7fb;border:1px solid #d4dde8;border-radius:16px" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr><td style="padding:24px 24px 10px 24px">
  <div style="font-size:14px;color:#6b839e;margin-bottom:8px">Hello, Assalamu Alaikum</div>
  <div style="font-size:28px;font-weight:800;color:#3d5a80;line-height:1.2">${to_name}</div>
  <div style="font-size:14px;color:#666666;margin-top:8px;line-height:22px">${appreciation_text}</div>
</td></tr>
<tr><td style="padding:12px 24px 24px 24px">
  <table style="border-collapse:collapse;border:1px solid #d4dde8;border-radius:12px;overflow:hidden" border="0" width="100%" cellspacing="0" cellpadding="0">
  <tbody>
    <tr>
      <td style="padding:14px 16px;border-bottom:1px solid #d4dde8;font-size:14px;color:#555555;width:55%"><strong style="color:#3d5a80">›</strong> Number of Investment Units</td>
      <td style="padding:14px 16px;border-bottom:1px solid #d4dde8;font-size:14px;color:#222222" align="right">${count}</td>
    </tr>
    <tr>
      <td style="padding:14px 16px;border-bottom:1px solid #d4dde8;font-size:14px;color:#555555"><strong style="color:#3d5a80">›</strong> Unit Price</td>
      <td style="padding:14px 16px;border-bottom:1px solid #d4dde8;font-size:14px;color:#222222" align="right">৳${sharePrice}</td>
    </tr>
    <tr>
      <td style="padding:14px 16px;border-bottom:1px solid #d4dde8;font-size:14px;color:#555555"><strong style="color:#3d5a80">›</strong> Total Amount</td>
      <td style="padding:14px 16px;border-bottom:1px solid #d4dde8;font-size:14px;color:#222222;font-weight:700" align="right">৳${totalAmount}</td>
    </tr>
    <tr>
      <td style="padding:14px 16px;border-bottom:1px solid #d4dde8;font-size:14px;color:#555555"><strong style="color:#3d5a80">›</strong> Date</td>
      <td style="padding:14px 16px;border-bottom:1px solid #d4dde8;font-size:14px;color:#222222" align="right">${joining_date}</td>
    </tr>
    <tr>
      <td style="padding:14px 16px;font-size:14px;color:#555555"><strong style="color:#3d5a80">›</strong> Transaction ID</td>
      <td style="padding:14px 16px;font-size:14px;color:#222222" align="right">${trx_id || 'N/A'}</td>
    </tr>
  </tbody>
  </table>
</td></tr>
</tbody>
</table>
</td>
</tr>
<tr>
<td style="padding:0 32px 30px 32px" align="center">
  <div style="font-size:14px;color:#777777;line-height:22px">Thank you for being with Woora.</div>
  <div style="font-size:14px;color:#3d5a80;font-weight:bold;margin-top:4px">— Team Woora</div>
</td>
</tr>
</tbody>
</table>
</td></tr></tbody></table>
</body></html>`;
}

function buildTransferHtml(params) {
  const { to_name, shares_count, amount, joining_date, trx_id,
    transferor_name, recipient_name,
    receipt_title = 'Shares Transferred',
    receipt_subtitle = 'Your share transfer has been completed successfully.',
    receipt_emoji = '📤',
    appreciation_text = 'Thank you for your active cooperation and trust in Woora.'
  } = params;
  const count = parseInt(shares_count, 10) || 1;
  const sharePrice = 500;
  const totalAmount = amount || (count * sharePrice);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,Arial,sans-serif">
<table style="background-color:#f5f7fb;padding:30px 0" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody><tr><td align="center">
<table style="max-width:640px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08)" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="padding:32px 32px 18px 32px;background:linear-gradient(135deg,#f6f0ff 0%,#ffffff 55%,#efe6ff 100%)">
<table border="0" width="100%" cellspacing="0" cellpadding="0"><tbody><tr>
<td style="width:68%" valign="top">
  <div style="font-size:18px;font-weight:bold;color:#7c4dff;letter-spacing:1.5px">WOORA</div>
  <div style="font-size:34px;line-height:1.2;font-weight:800;color:#5e35b1;margin-top:16px">${receipt_title}</div>
  <div style="font-size:15px;line-height:24px;color:#555555;margin-top:10px">${receipt_subtitle}</div>
</td>
<td style="width:32%" align="right" valign="top">
  <div style="width:110px;height:110px;border-radius:55px;background:radial-gradient(circle at center,#ede4ff 0%,#c9b1ff 48%,#f5f0ff 100%);text-align:center;line-height:110px;font-size:52px">${receipt_emoji}</div>
</td>
</tr></tbody></table>
</td>
</tr>
<tr>
<td style="padding:0 32px 32px 32px">
<table style="background-color:#f8f4ff;border:1px solid #d9c8f2;border-radius:16px" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr><td style="padding:24px 24px 10px 24px">
  <div style="font-size:14px;color:#7e60a8;margin-bottom:8px">Hello, Assalamu Alaikum</div>
  <div style="font-size:28px;font-weight:800;color:#5e35b1;line-height:1.2">${to_name}</div>
  <div style="font-size:14px;color:#666666;margin-top:8px;line-height:22px">${appreciation_text}</div>
</td></tr>
<tr><td style="padding:12px 24px 24px 24px">
  <table style="border-collapse:collapse;border:1px solid #d9c8f2;border-radius:12px;overflow:hidden" border="0" width="100%" cellspacing="0" cellpadding="0">
  <tbody>
    <tr>
      <td style="padding:14px 16px;border-bottom:1px solid #d9c8f2;font-size:14px;color:#555555;width:55%"><strong style="color:#7c4dff">›</strong> From</td>
      <td style="padding:14px 16px;border-bottom:1px solid #d9c8f2;font-size:14px;color:#222222;font-weight:600" align="right">${transferor_name || to_name}</td>
    </tr>
    <tr>
      <td style="padding:14px 16px;border-bottom:1px solid #d9c8f2;font-size:14px;color:#555555"><strong style="color:#7c4dff">›</strong> To</td>
      <td style="padding:14px 16px;border-bottom:1px solid #d9c8f2;font-size:14px;color:#222222;font-weight:600" align="right">${recipient_name || to_name}</td>
    </tr>
    <tr>
      <td style="padding:14px 16px;border-bottom:1px solid #d9c8f2;font-size:14px;color:#555555"><strong style="color:#7c4dff">›</strong> Number of Investment Units</td>
      <td style="padding:14px 16px;border-bottom:1px solid #d9c8f2;font-size:14px;color:#222222" align="right">${count}</td>
    </tr>
    <tr>
      <td style="padding:14px 16px;border-bottom:1px solid #d9c8f2;font-size:14px;color:#555555"><strong style="color:#7c4dff">›</strong> Unit Price</td>
      <td style="padding:14px 16px;border-bottom:1px solid #d9c8f2;font-size:14px;color:#222222" align="right">৳${sharePrice}</td>
    </tr>
    <tr>
      <td style="padding:14px 16px;border-bottom:1px solid #d9c8f2;font-size:14px;color:#555555"><strong style="color:#7c4dff">›</strong> Total Value</td>
      <td style="padding:14px 16px;border-bottom:1px solid #d9c8f2;font-size:14px;color:#222222;font-weight:700" align="right">৳${totalAmount}</td>
    </tr>
    <tr>
      <td style="padding:14px 16px;border-bottom:1px solid #d9c8f2;font-size:14px;color:#555555"><strong style="color:#7c4dff">›</strong> Date</td>
      <td style="padding:14px 16px;border-bottom:1px solid #d9c8f2;font-size:14px;color:#222222" align="right">${joining_date}</td>
    </tr>
    <tr>
      <td style="padding:14px 16px;font-size:14px;color:#555555"><strong style="color:#7c4dff">›</strong> Transaction ID</td>
      <td style="padding:14px 16px;font-size:14px;color:#222222" align="right">${trx_id || 'N/A'}</td>
    </tr>
  </tbody>
  </table>
</td></tr>
</tbody>
</table>
</td>
</tr>
<tr>
<td style="padding:0 32px 30px 32px" align="center">
  <div style="font-size:14px;color:#777777;line-height:22px">Thank you for your cooperation with Woora.</div>
  <div style="font-size:14px;color:#5e35b1;font-weight:bold;margin-top:4px">— Team Woora</div>
</td>
</tr>
</tbody>
</table>
</td></tr></tbody></table>
</body></html>`;
}

function buildCustomHtml(name, message, subject) {
  const messageHtml = message.replace(/\n/g, '<br>');
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Roboto,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08)">
  <tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:36px 40px;text-align:center">
    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:3px">WOORA GROUP</h1>
    <div style="width:50px;height:3px;background:#00D09C;margin:12px auto 0"></div>
    <p style="margin:10px 0 0;color:rgba(255,255,255,0.7);font-size:12px;letter-spacing:1px">Institutional-Grade Investment Platform</p>
  </td></tr>
  <tr><td style="padding:36px 40px">
    <p style="margin:0 0 6px;color:#888;font-size:14px">Assalamu Alaikum,</p>
    <h2 style="margin:0 0 24px;color:#1a1a2e;font-size:22px;font-weight:700">${name}</h2>
    <div style="color:#444;font-size:15px;line-height:1.8">${messageHtml}</div>
  </td></tr>
  <tr><td style="padding:0 40px 36px">
    <div style="text-align:center;margin-top:20px">
      <a href="https://wooragroup.com/dashboard" style="display:inline-block;background:linear-gradient(135deg,#00D09C,#00b386);color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:8px;font-weight:700;font-size:14px;box-shadow:0 4px 12px rgba(0,208,156,0.3)">
        Go to Dashboard →
      </a>
    </div>
  </td></tr>
  <tr><td style="background:#f8f9fb;padding:20px 40px;text-align:center;border-top:1px solid #eee">
    <p style="margin:0;color:#aaa;font-size:11px">&copy; ${new Date().getFullYear()} Woora Group. All rights reserved.</p>
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
      subject = 'OTP for your Woora authentication';
      htmlContent = buildOtpHtml(to_name, otp_code);
    } else if (type === 'receipt') {
      toEmail = params.to_email;
      toName = params.to_name;
      const txType = params.tx_type || 'BUY';

      if (txType === 'BUY') {
        subject = 'Woora — Share Purchase Confirmation';
        htmlContent = buildBuyHtml(params);
      } else if (txType === 'SELL') {
        subject = 'Woora — Share Sale Confirmation';
        htmlContent = buildSellHtml(params);
      } else {
        subject = 'Woora — Share Transfer Confirmation';
        htmlContent = buildTransferHtml(params);
      }
    } else if (type === 'custom') {
      toEmail = params.to_email;
      toName = params.to_name || 'Investor';
      subject = params.subject || 'Message from Woora Group';
      htmlContent = buildCustomHtml(toName, params.message || '', subject);
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

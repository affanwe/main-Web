export const sendOtpEmail = async (toEmail, toName, otpCode) => {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'otp',
        to_email: toEmail,
        to_name: toName,
        otp_code: otpCode,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
    console.log('OTP sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    alert('Email Error (OTP): ' + (error.message || JSON.stringify(error)));
    throw error;
  }
};

export const sendReceiptEmail = async ({
  to_email, to_name, shares_count, amount, joining_date, trx_id,
  type = 'BUY', transferor_name, recipient_name,
  receipt_title, receipt_subtitle, receipt_emoji, appreciation_text
}) => {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'receipt',
        to_email, to_name, shares_count, amount, joining_date, trx_id,
        tx_type: type, transferor_name, recipient_name,
        receipt_title, receipt_subtitle, receipt_emoji, appreciation_text,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send receipt');
    console.log('Receipt email sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send receipt email:', error);
    alert('Email Error (Receipt): ' + (error.message || JSON.stringify(error)));
    return false;
  }
};

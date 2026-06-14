import emailjs from '@emailjs/browser';
import { getEmailJsSettings } from './db';

export const sendOtpEmail = async (toEmail, toName, otpCode) => {
  try {
    const settings = await getEmailJsSettings();
    await emailjs.send(
      settings.serviceId || 'service_zssdwhn',
      settings.otpTemplateId || 'template_42akj3o',
      {
        to_email: toEmail,
        email: toEmail,
        to_name: toName,
        name: toName,
        otp_code: otpCode,
        code: otpCode,
        otp: otpCode,
        OTP: otpCode,
        verification_code: otpCode,
        verificationCode: otpCode,
        otpCode: otpCode,
        generatedOtp: otpCode
      },
      settings.publicKey || 'ktSyvmbjRztQFjNhq'
    );
    console.log('OTP sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    alert('EmailJS Error (OTP): ' + (error.text || error.message || JSON.stringify(error)));
    throw error;
  }
};

export const sendReceiptEmail = async ({ 
  to_email, 
  to_name, 
  shares_count, 
  amount, 
  joining_date, 
  trx_id,
  type = 'BUY',
  transferor_name,
  recipient_name,
  receipt_title = 'Thank You!',
  receipt_subtitle = 'Thank you for purchasing shares of Woora.',
  receipt_emoji = '👏',
  appreciation_text = 'We sincerely appreciate your trust and support in Woora.'
}) => {
  try {
    const settings = await getEmailJsSettings();
    
    // Choose service ID, template ID, and public key based on type
    let serviceId = settings.serviceId || 'service_zssdwhn';
    let publicKey = settings.publicKey || 'ktSyvmbjRztQFjNhq';
    let templateId = settings.receiptTemplateId || 'template_receipt';

    if (type === 'SELL') {
      serviceId = settings.sellServiceId || serviceId;
      publicKey = settings.sellPublicKey || publicKey;
      templateId = settings.sellTemplateId || templateId;
    } else if (type === 'TRANSFER') {
      serviceId = settings.transferServiceId || serviceId;
      publicKey = settings.transferPublicKey || publicKey;
      templateId = settings.transferTemplateId || templateId;
    }

    // Calculate single share price if count exists
    const count = parseInt(shares_count, 10) || 1;
    const sharePrice = 500; // Standard price per share
    const totalAmount = amount || (count * sharePrice);

    await emailjs.send(
      serviceId,
      templateId,
      {
        to_email: to_email,
        email: to_email,
        'to\\_email': to_email,
        to_name: to_name,
        name: to_name,
        'to\\_name': to_name,
        from_name: 'Woora',
        company_name: 'Woora',
        company: 'Woora',
        
        // Dynamic receipt fields
        receipt_title,
        'receipt\\_title': receipt_title,
        receipt_subtitle,
        'receipt\\_subtitle': receipt_subtitle,
        receipt_emoji,
        'receipt\\_emoji': receipt_emoji,
        appreciation_text,
        'appreciation\\_text': appreciation_text,
        
        // Match user HTML templates exactly
        customer_name: to_name,
        'customer\\_name': to_name,
        investor_name: to_name,
        'investor\\_name': to_name,
        
        transferor_name: transferor_name || to_name,
        'transferor\\_name': transferor_name || to_name,
        recipient_name: recipient_name || to_name,
        'recipient\\_name': recipient_name || to_name,
        
        // Shares Count variations (old & new)
        shares_count: count,
        'shares\\_count': count,
        sharesCount: count,
        shares: count,
        number_of_shares: count,
        'number\\_of\\_shares': count,
        
        // Amount variations (old & new)
        amount: totalAmount,
        total: totalAmount,
        total_amount: totalAmount,
        'total\\_amount': totalAmount,
        total_amount_paid: `৳${totalAmount}`,
        'total\\_amount\\_paid': `৳${totalAmount}`,
        
        // Share Price variations
        share_price: `৳${sharePrice}`,
        'share\\_price': `৳${sharePrice}`,
        price: sharePrice,
        price_per_share: sharePrice,
        'price\\_per\\_share': sharePrice,
        
        // Date variations
        joining_date: joining_date,
        'joining\\_date': joining_date,
        joiningDate: joining_date,
        purchase_date: joining_date,
        'purchase\\_date': joining_date,
        date: joining_date,
        transaction_date: joining_date,
        'transaction\\_date': joining_date,
        
        // Transaction ID variations
        trx_id: trx_id || 'N/A',
        'trx\\_id': trx_id || 'N/A',
        trxId: trx_id || 'N/A',
        transaction_id: trx_id || 'N/A',
        'transaction\\_id': trx_id || 'N/A',
        transactionId: trx_id || 'N/A',
        
        company_link: 'https://woora-invest-1.surge.sh',
        'company\\_link': 'https://woora-invest-1.surge.sh'
      },
      publicKey
    );
    console.log('Receipt email sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send receipt email:', error);
    alert('EmailJS Error (Receipt): ' + (error.text || error.message || JSON.stringify(error)));
    return false;
  }
}

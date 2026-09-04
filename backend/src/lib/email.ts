import emailjs from '@emailjs/nodejs';

export const sendOtpEmail = async (toEmail: string, otpCode: string): Promise<boolean> => {
  try {
    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID as string,
      process.env.EMAILJS_TEMPLATE_ID as string,
      {
        email: toEmail,       // Matches {{email}} in your template's "To Email" field
        passcode: otpCode,    // Matches {{passcode}} in your template body
      },
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY as string,
        privateKey: process.env.EMAILJS_PRIVATE_KEY as string,
      }
    );
    return true;
  } catch (error: any) {
    console.error('❌ EmailJS Delivery Error:', error);
    return false;
  }
};
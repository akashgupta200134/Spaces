import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.warn('⚠️ WARNING: RESEND_API_KEY is not defined in .env');
}

export const resend = new Resend(apiKey || 're_placeholder_key');
export default resend;
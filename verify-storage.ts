import { google } from 'googleapis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function check() {
    try {
        const res = await drive.about.get({ fields: 'storageQuota, user' });
        console.log('--- DIAGNOSTIC REPORT ---');
        console.log('Account Email:', res.data.user?.emailAddress); // Verify this is the email you think it is!
        console.log('Total Limit:', res.data.storageQuota?.limit);
        console.log('Total Usage:', res.data.storageQuota?.usage);
    } catch (e) {
        console.error(e);
    }
}
check();

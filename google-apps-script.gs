/*******************************************************
 * JASPERPC - JOB ORDER REQUEST EMAIL SYSTEM
 *
 * PURPOSE:
 * Customer fills out the website form.
 * JasperPC receives the Job Order Request by email.
 *
 * IMPORTANT:
 * - NO Google Calendar event is created.
 * - NO Google Calendar invitation is created.
 * - NO Google Meet link is created.
 * - NO automatic customer confirmation is sent.
 *
 * You manually review the request and reply to the
 * customer from Gmail to confirm or reschedule.
 *
 * EMAIL RECEIVER:
 * jasperpcservices@gmail.com
 *
 * CUSTOMER EMAIL:
 * OPTIONAL. If supplied, Reply in Gmail goes directly
 * to the customer. If omitted, the request is still sent
 * to JasperPC normally.
 *******************************************************/

const CONFIG = {
  BUSINESS_NAME: 'JasperPC',
  BUSINESS_EMAIL: 'jasperpcservices@gmail.com',
  TIMEZONE: 'Asia/Manila'
};

function doGet() {
  return jsonResponse_({
    success: true,
    status: 'online',
    service: 'JasperPC Job Order Request API',
    version: '2.1-email-optional'
  });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('No booking information was received.');
    }

    const data = parseRequest_(e.postData.contents);

    const booking = {
      name: clean_(data.name),
      email: clean_(data.email),
      phone: clean_(data.phone),
      service: clean_(data.service),
      date: clean_(data.date),
      time: clean_(data.time),
      address: clean_(data.address),
      details: clean_(data.details || data.problem || data.message)
    };

    validate_(booking);
    sendJobOrderEmail_(booking);

    return jsonResponse_({
      success: true,
      status: 'received',
      message: 'Your Job Order Request has been successfully submitted to JasperPC.'
    });

  } catch (error) {
    console.error(error);

    return jsonResponse_({
      success: false,
      status: 'error',
      message: error && error.message
        ? error.message
        : 'Unable to submit the Job Order Request.'
    });
  }
}

function parseRequest_(raw) {
  const text = String(raw || '').trim();

  if (!text) {
    throw new Error('The submitted form is empty.');
  }

  try {
    const json = JSON.parse(text);
    if (json && typeof json === 'object') {
      return json;
    }
  } catch (error) {
    // Continue to URL-encoded parsing.
  }

  const result = {};

  text.split('&').forEach(function(pair) {
    if (!pair) return;

    const parts = pair.split('=');
    const key = decodeURIComponent(parts.shift() || '').replace(/\+/g, ' ');
    const value = decodeURIComponent(parts.join('=') || '').replace(/\+/g, ' ');

    if (key) {
      result[key] = value;
    }
  });

  if (Object.keys(result).length === 0) {
    throw new Error('The submitted information could not be read.');
  }

  return result;
}

function validate_(booking) {
  const required = [
    'name',
    'phone',
    'service',
    'date',
    'time',
    'address'
  ];

  required.forEach(function(field) {
    if (!booking[field]) {
      throw new Error('Missing required information: ' + field);
    }
  });

  // Email is optional. Validate only when the customer provides one.
  if (booking.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(booking.email)) {
      throw new Error('Please provide a valid customer email address.');
    }
  }
}

function sendJobOrderEmail_(booking) {
  const subject =
    'NEW JOB ORDER REQUEST - ' +
    booking.service +
    ' - ' +
    booking.name;

  const submittedAt = Utilities.formatDate(
    new Date(),
    CONFIG.TIMEZONE,
    'MMMM d, yyyy h:mm a'
  );

  const body = [
    'JASPERPC',
    'HOME SERVICE JOB ORDER REQUEST',
    '================================',
    '',
    'STATUS: PENDING YOUR CONFIRMATION',
    '',
    'CUSTOMER INFORMATION',
    '---------------------',
    'Name: ' + booking.name,
    'Email: ' + (booking.email || 'Not provided'),
    'Phone: ' + booking.phone,
    '',
    'REQUESTED SERVICE',
    '-----------------',
    booking.service,
    '',
    'REQUESTED SCHEDULE',
    '------------------',
    'Date: ' + booking.date,
    'Time: ' + booking.time,
    '',
    'HOME SERVICE ADDRESS',
    '--------------------',
    booking.address,
    '',
    'CUSTOMER REQUEST / DETAILS',
    '---------------------------',
    booking.details || 'No additional details provided.',
    '',
    'REQUEST RECEIVED',
    '----------------',
    submittedAt,
    '',
    '--------------------------------',
    'NEXT STEP',
    '--------------------------------',
    '',
    'Please check the JasperPC schedule manually.',
    '',
    'If the schedule is available:',
    'Reply to this email and confirm the booking.',
    '',
    'If the requested schedule is unavailable:',
    'Reply to this email and ask the customer to reschedule.',
    '',
    'This request does NOT automatically create',
    'a Google Calendar event or Google Meet.',
    '',
    'JasperPC',
    CONFIG.BUSINESS_EMAIL
  ].join('\n');

  const mailOptions = {
    to: CONFIG.BUSINESS_EMAIL,
    subject: subject,
    body: body,
    name: CONFIG.BUSINESS_NAME
  };

  // Only set Reply-To when the customer supplied an email.
  if (booking.email) {
    mailOptions.replyTo = booking.email;
  }

  MailApp.sendEmail(mailOptions);
}

function testBusinessEmail() {
  MailApp.sendEmail({
    to: CONFIG.BUSINESS_EMAIL,
    subject: 'JasperPC Booking System - Email Test',
    body: [
      'JasperPC EMAIL SYSTEM TEST',
      '',
      'This is a test email from your JasperPC Google Apps Script.',
      '',
      'No Google Calendar event was created.',
      'No Google Meet link was created.'
    ].join('\n'),
    name: CONFIG.BUSINESS_NAME
  });

  Logger.log('TEST EMAIL SENT TO ' + CONFIG.BUSINESS_EMAIL);
}

function clean_(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// File: app/api/submit/route.ts

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  console.log('API route called');

  // Log the credentials directly (be careful with sensitive info)
  console.log('EMAIL_USER: optimawebcreations@gmail.com');
  console.log('EMAIL_PASS: (hidden for security)');
  console.log('RECEIVER_EMAIL: alanpaccor@gmail.com');

  try {
    const { name, email, message } = await request.json();
    console.log('Received form data:', { name, email, message });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'alanpaccor@gmail.com',
        pass: 'jlkf lvwc detw vgjl', // Directly included for testing purposes
      },
    });

    const mailOptions = {
      from: 'alanpaccor@gmail.com',
      to: 'alanpaccor@gmail.com',
      subject: `Contact Form Submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    };

    console.log('Attempting to send email...');

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);

    return NextResponse.json({ message: 'Message sent successfully!' }, { status: 200 });
  } catch (error) {
    console.error('Detailed error in API route:', error);
    return NextResponse.json({ message: 'Failed to send message.', error: error.message }, { status: 500 });
  }
}

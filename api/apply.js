const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

const allowedRoles = [
  'Tech Coordinator',
  'PR and Design Coordinator',
  'Event and Organizing Lead',
  'Social Media Coordinator',
  'Documentation Lead'
];

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed.'
    });
  }

  try {
    const {
      name, email, whatsapp, course,
      year, role, motivation, consent
    } = req.body || {};

    const values = [
      name, email, whatsapp, course,
      year, role, motivation
    ];

    if (
      values.some(v => typeof v !== 'string' || !v.trim()) ||
      consent !== true
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please complete all required fields.'
      });
    }

    if (
      name.trim().length > 100 ||
      email.trim().length > 255 ||
      whatsapp.trim().length > 20 ||
      course.trim().length > 100 ||
      motivation.trim().length < 30 ||
      motivation.trim().length > 2000 ||
      !allowedRoles.includes(role) ||
      !/^\S+@\S+\.\S+$/.test(email.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application details.'
      });
    }

    // 1. Save application in Supabase
    const { data, error } = await supabase
      .from('applications')
      .insert([{
        name: name.trim(),
        email: email.trim().toLowerCase(),
        whatsapp: whatsapp.trim(),
        course: course.trim(),
        year: year.trim(),
        role,
        motivation: motivation.trim()
      }])
      .select('id')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to save your application. Please try again.'
      });
    }

    // 2. Send the same application to Google Sheets
    let sheetsSynced = false;

    try {
      const scriptUrl = process.env.GOOGLE_SCRIPT_URL;

      if (!scriptUrl) {
        throw new Error('GOOGLE_SCRIPT_URL is missing.');
      }

      const sheetData = new URLSearchParams({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        whatsapp: whatsapp.trim(),
        course: course.trim(),
        year: year.trim(),
        role,
        motivation: motivation.trim()
      });

      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: sheetData.toString(),
        redirect: 'follow'
      });

      const result = await response.json();

      if (!response.ok || result.success !== true) {
        throw new Error('Google Sheets rejected the application.');
      }

      sheetsSynced = true;

    } catch (sheetError) {
      console.error('Google Sheets sync error:', sheetError);
    }

    // 3. Return success because Supabase has saved the application
    return res.status(201).json({
      success: true,
      applicationId: data.id,
      sheetsSynced,
      message: sheetsSynced
        ? 'Application submitted successfully.'
        : 'Application saved. Google Sheets sync needs attention.'
    });

  } catch (error) {
    console.error('Application API error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
};

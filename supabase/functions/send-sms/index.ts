import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, notification_id, phone_number, message } = await req.json();

    console.log('SMS function called with action:', action);

    if (action === 'send_notification_sms') {
      // Get pending notifications with phone numbers
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*, profiles!notifications_user_id_fkey(phone)')
        .eq('sms_sent', false)
        .not('phone_number', 'is', null)
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }

      console.log(`Found ${notifications?.length || 0} notifications to send`);

      // In production, integrate with an SMS provider like Twilio, Nexmo, or local Algerian providers
      // For now, we'll mark them as sent
      const results = [];
      for (const notification of notifications || []) {
        // Here you would integrate with actual SMS provider
        // Example with Twilio:
        // const twilioResponse = await fetch(`https://api.twilio.com/...`, { ... });
        
        console.log(`Would send SMS to ${notification.phone_number}: ${notification.message}`);
        
        // Mark as sent
        await supabase
          .from('notifications')
          .update({ sms_sent: true })
          .eq('id', notification.id);

        results.push({ id: notification.id, status: 'sent' });
      }

      return new Response(
        JSON.stringify({ success: true, sent: results.length, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'send_direct_sms') {
      if (!phone_number || !message) {
        throw new Error('phone_number and message are required');
      }

      console.log(`Direct SMS to ${phone_number}: ${message}`);
      
      // In production, send via SMS provider
      // For now, log and return success
      
      return new Response(
        JSON.stringify({ success: true, phone_number, message: 'SMS queued' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'send_appointment_reminder') {
      // Get upcoming appointments that need reminders
      const now = new Date();
      const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          *,
          profiles!appointments_patient_id_fkey(full_name, phone),
          doctors(clinic_name, specialties(name_ar))
        `)
        .in('status', ['pending', 'confirmed'])
        .gte('appointment_date', now.toISOString().split('T')[0])
        .lte('appointment_date', oneDayFromNow.toISOString().split('T')[0]);

      if (error) {
        console.error('Error fetching appointments:', error);
        throw error;
      }

      console.log(`Found ${appointments?.length || 0} appointments for reminders`);

      const remindersSent = [];
      for (const apt of appointments || []) {
        const aptDateTime = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
        const timeDiff = aptDateTime.getTime() - now.getTime();
        const hoursUntil = timeDiff / (1000 * 60 * 60);

        // Send reminder if ~24 hours or ~1 hour before
        if ((hoursUntil > 23 && hoursUntil < 25) || (hoursUntil > 0.5 && hoursUntil < 1.5)) {
          const message = `تذكير: موعدك مع ${apt.doctors?.clinic_name || 'الطبيب'} يوم ${apt.appointment_date} الساعة ${apt.appointment_time}. MEDLINK DZ`;
          
          console.log(`Reminder for ${apt.profiles?.phone}: ${message}`);
          
          // Create notification
          await supabase.from('notifications').insert({
            user_id: apt.patient_id,
            title: 'تذكير بالموعد',
            message: message,
            type: 'info',
            phone_number: apt.profiles?.phone,
            related_id: apt.id,
            related_type: 'appointment'
          });

          remindersSent.push(apt.id);
        }
      }

      return new Response(
        JSON.stringify({ success: true, reminders_sent: remindersSent.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('SMS function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

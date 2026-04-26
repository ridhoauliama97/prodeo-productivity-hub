import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://facadidhognljvafbcii.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhY2FkaWRob2dubGp2YWZiY2lpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ5NjA4MSwiZXhwIjoyMDkyMDcyMDgxfQ.Qm-VSendnuwMqFajX5apHZDumIYvYfTq48uHrD4eN_0';
const supabase = createClient(supabaseUrl, supabaseKey);
async function run() {
  // Let's create an email and try to delete it.
  const newEmail = { id: crypto.randomUUID(), subject: 'test', folder: 'trash', receiver_id: '00000000-0000-0000-0000-000000000000' };
  let res = await supabase.from('emails').insert(newEmail).select();
  console.log('Insert:', res.error ? res.error : 'Success');
  res = await supabase.from('emails').delete().eq('id', newEmail.id);
  console.log('Delete:', res.error ? res.error : 'Success', 'Deleted count:', res.count);
}
run();

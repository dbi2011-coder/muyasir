// تحميل مكتبة Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// مفاتيح الربط الخاصة بمشروعك
const supabaseUrl = 'https://xcygxsfkwuuxaoqpsoso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjeWd4c2Zrd3V1eGFvcXBzb3NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMTI0NzMsImV4cCI6MjA4NzU4ODQ3M30.kvEEey7hxX7F4A8W-x6d4zDfXDkCepj2Z9lmifBJ4x4';

// تهيئة العميل
export const supabase = createClient(supabaseUrl, supabaseKey);

// إتاحة العميل على مستوى النافذة لاستخدامه في باقي الملفات
window.supabase = supabase;

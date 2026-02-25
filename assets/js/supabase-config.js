// ============================================
// 📁 الملف: assets/js/supabase-config.js
// ============================================

// استخراج الرابط من التوكن الخاص بك
const SUPABASE_URL = 'https://xcygxsfkwuuxaoqpsoso.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjeWd4c2Zrd3V1eGFvcXBzb3NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMTI0NzMsImV4cCI6MjA4NzU4ODQ3M30.kvEEey7hxX7F4A8W-x6d4zDfXDkCepj2Z9lmifBJ4x4';

// تهيئة مكتبة Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

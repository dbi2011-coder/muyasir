// ============================================
// 📁 الملف: assets/js/supabase-config.js
// الوصف: إعدادات الاتصال بقاعدة بيانات Supabase
// ============================================

const SUPABASE_URL = 'https://xcygxsfkwuuxaoqpsoso.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjeWd4c2Zrd3V1eGFvcXBzb3NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMTI0NzMsImV4cCI6MjA4NzU4ODQ3M30.kvEEey7hxX7F4A8W-x6d4zDfXDkCepj2Z9lmifBJ4x4';

// صمام أمان: التأكد من أن مكتبة Supabase تم تحميلها من الـ HTML
if (typeof window.supabase === 'undefined') {
    console.error("🚨 خطأ حرج: مكتبة Supabase لم يتم تحميلها!");
    alert("حدث خطأ في تحميل قاعدة البيانات. تأكد من وجود انترنت ومن استدعاء المكتبة في ملف الـ HTML.");
} else {
    // تهيئة مكتبة Supabase وتخزينها في متغير عام اسمه supa
    window.supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("✅ تم الاتصال بقاعدة بيانات Supabase بنجاح!");
}

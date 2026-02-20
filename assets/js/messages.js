function injectChatStyles() {
    const style = document.createElement('style');
    style.id = 'chatStyles';
    style.innerHTML = `
        /* =========================================
           💻 تنسيقات الكمبيوتر (الأصلية والمستقرة تماماً)
        ========================================= */
        .chat-container { display: flex; height: 80vh; background: #fff; border-radius: 12px; box-shadow: 0 5px 25px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #d1d5db; margin-top: 0px; font-family: 'Tajawal', sans-serif; }
        .chat-sidebar { width: 320px; background-color: #f8f9fa; border-left: 1px solid #e5e7eb; display: flex; flex-direction: column; z-index: 2; }
        .chat-list-header { padding: 20px; background: #f8f9fa; border-bottom: 1px solid #e2e8f0; }
        .chat-list { flex: 1; overflow-y: auto; }
        .chat-item { display: flex; align-items: center; padding: 15px 20px; cursor: pointer; border-bottom: 1px solid #e2e8f0; transition: 0.2s; background: #fff; }
        .chat-item:hover { background: #f1f5f9; }
        .chat-item.active { background: #007bff !important; color: #fff !important; border-right: 5px solid #004494; }
        .chat-item.active .chat-name { color: #fff !important; }
        .chat-item.active .chat-preview { color: #e0e0e0 !important; }
        .chat-item.active .avatar { background: #fff; color: #007bff; border: 2px solid #007bff; }
        .avatar { width: 45px; height: 45px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #475569; margin-left: 12px; border: 2px solid #fff; flex-shrink: 0; }
        .chat-info { flex: 1; min-width: 0; }
        .chat-name { font-weight: bold; color: #334155; font-size: 0.95rem; display:flex; justify-content:space-between; margin-bottom: 4px; }
        .chat-preview { font-size: 0.85rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .unread-badge { background: #ef4444; color: white; font-size: 0.7rem; padding: 2px 8px; border-radius: 10px; }
        
        .chat-main { flex: 1; display: flex; flex-direction: column; background: #fff; position: relative; }
        .chat-header { padding: 15px 20px; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; background: #fff; font-weight: bold; font-size: 1.1rem; color:#334155; height: 70px; }
        .header-actions { display: flex; gap: 10px; }
        .btn-header-action { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; font-size: 1.1rem; border: none; color: white; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .btn-delete-chat { background: #c62828; }
        .btn-delete-chat:hover { background: #b71c1c; transform: scale(1.1); }
        .btn-pdf-chat { background: #1565c0; }
        .btn-pdf-chat:hover { background: #0d47a1; transform: scale(1.1); }
        
        .messages-area { flex: 1; padding: 20px; overflow-y: auto; background: #fcfcfc; display: flex; flex-direction: column; gap: 15px; }
        .msg-bubble { max-width: 70%; padding: 12px 18px; border-radius: 15px; position: relative; font-size: 0.95rem; line-height: 1.6; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .msg-me { align-self: flex-start; background: #007bff; color: white; border-bottom-right-radius: 2px; } 
        .msg-other { align-self: flex-end; background: #fff; color: #334155; border: 1px solid #e2e8f0; border-bottom-left-radius: 2px; }
        audio { height: 35px; width: 220px; margin-top: 5px; border-radius: 20px; outline: none; }
        .msg-me audio { filter: invert(1) grayscale(1) brightness(2); }
        .msg-time { font-size: 0.7rem; margin-top: 5px; opacity: 0.8; display:block; text-align:left; }
        .msg-attachment { margin-top: 8px; background: rgba(0,0,0,0.05); padding: 8px; border-radius: 8px; display: flex; align-items: center; gap: 5px; text-decoration: none; color: inherit; }
        .msg-attachment img { max-width: 200px; border-radius: 5px; }
        .msg-options-btn { position: absolute; top: 5px; left: 8px; color: inherit; opacity: 0.6; cursor: pointer; padding: 2px 5px; font-size: 1.1rem; transition: 0.2s; }
        .msg-options-btn:hover { opacity: 1; background: rgba(0,0,0,0.1); border-radius: 50%; }
        .msg-dropdown { position: absolute; top: 25px; left: 5px; background: #fff; color: #333; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.15); width: 120px; z-index: 100; display: none; overflow: hidden; border: 1px solid #eee; }
        .msg-dropdown-item { padding: 10px 15px; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.1s; }
        .msg-dropdown-item:hover { background: #f8f9fa; color: #007bff; }
        .msg-dropdown-item.delete:hover { color: #dc3545; background: #fff5f5; }
        
        .chat-input-area { padding: 15px 20px; border-top: 1px solid #e2e8f0; background: #fff; display: flex; align-items: center; gap: 10px; position: relative; min-height: 80px; }
        .chat-input { flex: 1; padding: 12px 15px; border: 2px solid #e2e8f0; border-radius: 25px; outline: none; transition: 0.2s; font-size: 1rem; background: #f8fafc; margin: 0 5px; }
        .chat-input:focus { border-color: #007bff; background: #fff; }
        .chat-input.editing { border-color: #f59e0b; background: #fffbeb; }
        .btn-tool { width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; cursor: pointer; transition: 0.2s; border: none; color: white !important; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
        .btn-tool:hover { transform: translateY(-2px); box-shadow: 0 5px 10px rgba(0,0,0,0.3); filter: brightness(1.1); }
        .btn-emoji { background: #f57f17; }
        .btn-attach { background: #37474f; }
        .btn-cam { background: #0d47a1; }
        .btn-mic { background: #b71c1c; }
        .btn-send-pill { background-color: #007bff; color: white; border: none; padding: 10px 25px; border-radius: 50px; font-size: 1rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; box-shadow: 0 4px 10px rgba(0, 123, 255, 0.2); }
        .btn-send-pill:hover { background-color: #0069d9; transform: translateY(-1px); }
        .btn-send-pill.update-mode { background-color: #f59e0b; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.2); }
        
        .recording-area { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #fff; display: none; align-items: center; justify-content: space-between; padding: 0 20px; z-index: 50; border-radius: 12px; }
        .recording-timer { font-weight: bold; color: #b71c1c; font-size: 1.1rem; display:flex; align-items:center; gap:10px; }
        .recording-wave { width: 12px; height: 12px; background: #b71c1c; border-radius: 50%; animation: pulse 1s infinite; }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
        .attachment-preview { position: absolute; bottom: 85px; right: 20px; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; display: none; z-index: 10; }
        .emoji-popup { position: absolute; bottom: 85px; right: 20px; width: 320px; height: 250px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); display: none; padding: 10px; grid-template-columns: repeat(7, 1fr); gap: 5px; overflow-y: auto; z-index: 100; }
        .emoji-item { font-size: 1.4rem; cursor: pointer; text-align: center; padding: 5px; border-radius: 5px; transition: 0.2s; }
        .emoji-item:hover { background: #f1f5f9; transform: scale(1.2); }
        .empty-chat { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; }
        
        .custom-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 20000; display: none; align-items: center; justify-content: center; backdrop-filter: blur(3px); }
        .custom-modal-box { background: #fff; padding: 25px; border-radius: 16px; width: 90%; max-width: 400px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .modal-icon-danger { width: 60px; height: 60px; background: #fee2e2; color: #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; margin: 0 auto 15px; }
        .modal-title { font-size: 1.2rem; font-weight: bold; color: #1f2937; margin-bottom: 8px; }
        .modal-desc { color: #6b7280; font-size: 0.95rem; margin-bottom: 20px; line-height: 1.5; }
        .modal-actions { display: flex; gap: 10px; justify-content: center; }
        .btn-modal { flex: 1; padding: 12px; border-radius: 10px; font-weight: bold; cursor: pointer; border: none; transition: 0.2s; font-size: 0.95rem; }
        .btn-modal-cancel { background: #f3f4f6; color: #374151; }
        .btn-modal-cancel:hover { background: #e5e7eb; }
        .btn-modal-delete { background: #dc2626; color: white; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-modal-delete:hover { background: #b91c1c; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3); }

        .mobile-only-btn { display: none; }

        /* حل مشكلة ظهور المودال خلف القائمة الجانبية في الجوال */
        #newMessageModal, .modal-backdrop, .modal { z-index: 10500 !important; }

        /* =========================================
           📱 تخصيص الجوال حصراً (أقل من 768px)
        ========================================= */
        @media (max-width: 768px) { 
            .mobile-only-btn { display: inline-block !important; background: transparent !important; border: none !important; font-size: 1.2rem !important; color: #333 !important; margin: 0 10px !important; cursor: pointer !important; padding: 0 !important; }
            
            /* 1. إصلاح اختفاء الجزء السفلي: استخدام dvh لضمان التوافق مع أشرطة المتصفح */
            .chat-container { height: calc(100dvh - 80px) !important; margin-bottom: 0 !important; border-radius: 0 !important; border: none !important; box-shadow: none !important; }
            .chat-main { display: flex !important; flex-direction: column !important; height: 100% !important; overflow: hidden !important; }
            
            .messages-area { flex: 1 1 auto !important; overflow-y: auto !important; padding: 15px !important; }

            .chat-sidebar { position: fixed !important; right: -100% !important; top: 0 !important; height: 100% !important; width: 280px !important; z-index: 9999 !important; transition: right 0.3s ease !important; box-shadow: -4px 0 15px rgba(0,0,0,0.1) !important; }
            .chat-sidebar.show-contacts { right: 0 !important; }

            .chat-header { flex-shrink: 0 !important; padding: 5px 10px !important; height: 60px !important; flex-wrap: nowrap !important; }
            .chat-header .header-info { min-width: 0 !important; flex: 1 !important; display: flex !important; align-items: center !important; }
            .chat-header .avatar { width: 35px !important; height: 35px !important; font-size: 0.9rem !important; margin-left: 8px !important; flex-shrink: 0 !important; }
            #chatHeaderName { white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; display: block !important; max-width: 140px !important; }
            
            .header-actions { flex-shrink: 0 !important; margin-right: 5px !important; }
            .btn-pdf-chat { display: none !important; }
            .btn-delete-chat { background: transparent !important; color: #dc2626 !important; box-shadow: none !important; width: auto !important; height: auto !important; font-size: 1.4rem !important; padding: 5px !important; }

            /* 2. إصلاح منطقة الإدخال السفلية والأزرار المختفية */
            .chat-input-area { 
                flex-shrink: 0 !important; 
                display: flex !important; 
                flex-wrap: wrap !important; 
                justify-content: flex-start !important; 
                padding: 10px !important; 
                gap: 8px !important; 
                background: #f0f2f5 !important; 
                padding-bottom: max(10px, env(safe-area-inset-bottom)) !important; /* لدعم أجهزة الآيفون */
                box-sizing: border-box !important;
            }
            
            /* السطر الأول */
            .chat-input { order: 1 !important; flex: 1 1 0% !important; margin: 0 !important; min-width: 100px !important; border-radius: 20px !important; }
            .btn-mic { order: 2 !important; margin: 0 !important; flex-shrink: 0 !important; }
            #sendBtn, #cancelEditBtn { order: 3 !important; margin: 0 !important; flex-shrink: 0 !important; }
            
            /* كسر السطر بشكل سليم لضمان ظهور الأزرار الثلاثة */
            .chat-input-area::after {
                content: "" !important;
                width: 100% !important;
                order: 4 !important;
                display: block !important;
                height: 0 !important;
            }
            
            /* السطر الثاني: الرموز والكاميرا والمرفقات */
            #emojiBtn { order: 5 !important; margin-right: auto !important; }
            .btn-attach { order: 6 !important; }
            .btn-cam { order: 7 !important; }
            
            #emojiBtn, .btn-attach, .btn-cam {
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                border-radius: 8px !important;
                width: 40px !important;
                height: 40px !important;
                font-size: 1.2rem !important;
                background: #fff !important;
                color: #555 !important;
                border: 1px solid #ddd !important;
                box-shadow: none !important;
                margin: 0 !important;
                cursor: pointer !important;
            }
            
            .emoji-popup { width: 90vw !important; right: 5vw !important; grid-template-columns: repeat(6, 1fr) !important; bottom: 120px !important; }
        }
    `;
    document.head.appendChild(style);
}

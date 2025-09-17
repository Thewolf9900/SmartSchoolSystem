// src/themes/chatThemes.js

import bgWhatsapp from "assets/img/chat-backgrounds/chat-background1.jpeg";
import bgSpace from "assets/img/chat-backgrounds/chat-background2.jpeg";

export const chatBackgrounds = [
    { name: "فاتح", style: '#f0f2f5' },
    { name: "داكن", style: '#0b141a' },
    { name: "واتساب", style: `url(${bgWhatsapp})` },
    { name: "الفضاء", style: `url(${bgSpace})` },
    { name: "غروب", style: 'linear-gradient(to top, #30cfd0 0%, #330867 100%)' },
];

export const chatColorSchemes = [
    {
        name: "واتساب",
        userBubble: '#dcf8c6',
        assistantBubble: '#ffffff',
        textColor: '#111b21',
        timestampColor: '#657786'
    },
    {
        name: "واتساب ليلي",
        userBubble: '#005c4b',
        assistantBubble: '#202c33',
        textColor: '#e9edef',
        timestampColor: '#ffffffff'
    },
    {
        name: "ماسنجر",
        userBubble: '#000000ff',
        assistantBubble: '#f0f2f5',
        textColor: '#050505', // نص أسود للمستخدم، أبيض للآخر
        timestampColor: '#000000ff'
    },
    {
        name: "نيون",
        userBubble: '#39ff14', // أخضر نيون
        assistantBubble: '#222222',
        textColor: '#ffffff',
        timestampColor: '#ffffffff'
    },
    {
        name: "بركاني",
        userBubble: '#ff4800', // برتقالي ناري
        assistantBubble: '#4a4a4a',
        textColor: '#ffffff',
        timestampColor: '#ffffffff'
    },
];

export const getDynamicChatStyles = (activeBackground, activeColorScheme) => {
    return {
        chatWindow: {
            overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column',
            gap: '12px', background: activeBackground.style, backgroundSize: 'cover', backgroundPosition: 'center'
        },
        messageBubble: {
            maxWidth: '75%', padding: '8px 12px', borderRadius: '12px',
            wordWrap: 'break-word', boxShadow: '0 1px 1px rgba(0,0,0,0.05)',
        },
        userMessage: {
            alignSelf: 'flex-end', backgroundColor: activeColorScheme.userBubble,
            color: activeColorScheme.name === 'ماسنجر' ? '#fff' : activeColorScheme.textColor
        },
        assistantMessage: {
            alignSelf: 'flex-start', backgroundColor: activeColorScheme.assistantBubble,
            color: activeColorScheme.textColor
        },
        messageTimestamp: {
            fontSize: '0.75rem', color: activeColorScheme.timestampColor,
            marginTop: '4px', textAlign: 'right',
        },
        footer: {
            background: 'rgba(255, 255, 255, 0.1)', 
            backdropFilter: 'blur(5px)', 
            borderTop: '1px solid rgba(255, 255, 255, 0.2)'
        }
    };
};
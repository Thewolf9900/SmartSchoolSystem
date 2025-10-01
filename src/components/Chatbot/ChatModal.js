import React, { useState, useEffect, useRef, useCallback } from "react";
import { Modal, Form, Button, Tabs, Tab, Popover, OverlayTrigger, Spinner } from "react-bootstrap";
import { toast } from 'react-toastify';
import { chatBackgrounds, chatColorSchemes, getDynamicChatStyles } from "themes/chatThemes";
import { getMyConversations, getConversationDetails, createConversation, postMessage, deleteConversation } from "services/shared/chatService";

const initialWelcomeMessage = {
    id: 'initial_0',
    sender: 'Assistant',
    content: 'مرحباً بك في SmartSchool! كيف يمكنني مساعدتك اليوم؟',
    sentAt: new Date().toISOString()
};

function ChatModal({ show, onHide }) {
    const chatWindowRef = useRef(null);
    const messageInputRef = useRef(null); // ✨ 1. إضافة ref للتحكم بالتركيز

    const [conversations, setConversations] = useState([]);
    const [activeConvId, setActiveConvId] = useState(null);

    const [isLoadingConvs, setIsLoadingConvs] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const [messageInput, setMessageInput] = useState("");

    const [activeBackground, setActiveBackground] = useState(() => {
        try {
            const savedName = localStorage.getItem('smartschool_chat_background');
            return chatBackgrounds.find(bg => bg.name === savedName) || chatBackgrounds[0];
        } catch { return chatBackgrounds[0]; }
    });

    const [activeColorScheme, setActiveColorScheme] = useState(() => {
        try {
            const savedName = localStorage.getItem('smartschool_chat_colorscheme');
            return chatColorSchemes.find(scheme => scheme.name === savedName) || chatColorSchemes[0];
        } catch { return chatColorSchemes[0]; }
    });

    const dynamicStyles = getDynamicChatStyles(activeBackground, activeColorScheme);

    const fetchConversations = useCallback(async () => {
        if (show && conversations.length === 0) {
            setIsLoadingConvs(true);
            try {
                const response = await getMyConversations();
                if (response.data && response.data.length > 0) {
                    setConversations(response.data.map(c => ({ ...c, messages: null })));
                    setActiveConvId(response.data[0].id);
                } else {
                    await handleNewConversation(false);
                }
            } catch (error) { toast.error("فشل في جلب المحادثات."); }
            finally { setIsLoadingConvs(false); }
        }
    }, [show]); // تم تبسيط الاعتمادية لتعمل بشكل صحيح

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    useEffect(() => {
        const fetchDetails = async () => {
            if (activeConvId) {
                const currentConv = conversations.find(c => c.id === activeConvId);
                if (currentConv && currentConv.messages === null) {
                    setIsLoadingMessages(true);
                    try {
                        const response = await getConversationDetails(activeConvId);
                        setConversations(prev => prev.map(c =>
                            c.id === activeConvId ? { ...c, messages: response.data.messages } : c
                        ));
                    } catch (error) { toast.error("فشل في جلب الرسائل."); }
                    finally { setIsLoadingMessages(false); }
                }
            }
        };
        fetchDetails();
    }, [activeConvId, conversations]);

    // ✨ 2. إضافة useEffect مخصص وموثوق للتحكم بالتركيز
    useEffect(() => {
        if (!isSending && !isLoadingMessages && activeConvId && show) {
            setTimeout(() => messageInputRef.current?.focus(), 100);
        }
    }, [isSending, isLoadingMessages, activeConvId, show]);

    const handleBackgroundChange = (bg) => {
        setActiveBackground(bg);
        localStorage.setItem('smartschool_chat_background', bg.name);
    };

    const handleColorSchemeChange = (scheme) => {
        setActiveColorScheme(scheme);
        localStorage.setItem('smartschool_chat_colorscheme', scheme.name);
    };

    const handleNewConversation = async (showToast = true) => {
        if (conversations.length >= 3) {
            toast.warn("لا يمكن فتح أكثر من 3 محادثات في نفس الوقت."); return;
        }
        try {
            const response = await createConversation();
            const newConv = { ...response.data, messages: [initialWelcomeMessage] };
            setConversations(prev => [...prev, newConv]);
            setActiveConvId(newConv.id);
            if (showToast) toast.success("تم إنشاء محادثة جديدة.");
        } catch {
            toast.error("فشل في إنشاء محادثة جديدة.");
        }
    };

    const handleTabSelect = (key) => {
        if (key === 'new-tab') {
            handleNewConversation();
        } else {
            setActiveConvId(Number(key));
        }
    };

    const handleCloseConversation = async (e, idToClose) => {
        e.stopPropagation();
        if (conversations.length <= 1) {
            toast.info("يجب أن تبقى محادثة واحدة على الأقل مفتوحة."); return;
        }
        try {
            await deleteConversation(idToClose);
            const remaining = conversations.filter(conv => conv.id !== idToClose);
            setConversations(remaining);
            if (activeConvId === idToClose) {
                setActiveConvId(remaining[0]?.id);
            }
            toast.success("تم حذف المحادثة.");
        } catch {
            toast.error("فشل في حذف المحادثة.");
        }
    };

    const handleClearConversation = async () => {
        if (!activeConvId) return;
        if (window.confirm("هل أنت متأكد من رغبتك في مسح هذه المحادثة؟ سيتم حذف جميع الرسائل.")) {
            try {
                setConversations(prev => prev.map(c =>
                    c.id === activeConvId ? { ...c, messages: [initialWelcomeMessage] } : c
                ));
                toast.success("تم مسح المحادثة.");
            } catch {
                toast.error("فشل في مسح المحادثة.");
            }
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !activeConvId) return;

        const tempId = `temp_${Date.now()}_${Math.random()}`;
        const userMessage = { id: tempId, sender: 'User', content: messageInput, sentAt: new Date().toISOString() };
        const currentInput = messageInput;
        setMessageInput("");
        setIsSending(true);

        // ✨ 3. استخدام التحديث الوظيفي لمنع تضارب الحالة عند الإرسال السريع
        setConversations(prevConversations =>
            prevConversations.map(c =>
                c.id === activeConvId ? { ...c, messages: [...(c.messages || []), userMessage] } : c
            )
        );

        try {
            const response = await postMessage(activeConvId, currentInput);
            const assistantMessage = response.data;

            setConversations(prevConversations =>
                prevConversations.map(c => {
                    if (c.id === activeConvId) {
                        const finalMessages = c.messages.filter(m => m.id !== tempId);
                        return { ...c, messages: [...finalMessages, userMessage, assistantMessage] };
                    }
                    return c;
                })
            );
        } catch {
            toast.error("فشل في إرسال الرسالة.");
            setConversations(prevConversations =>
                prevConversations.map(c =>
                    c.id === activeConvId ? { ...c, messages: c.messages.filter(m => m.id !== tempId) } : c
                )
            );
        } finally {
            setIsSending(false);
        }
    };

    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [conversations, activeConvId, isSending]);

    const activeConversation = conversations.find(c => c.id === activeConvId);

    const settingsPopover = (
        <Popover id="popover-basic" style={{ maxWidth: '300px' }}>
            <Popover.Header as="h3">تخصيص المظهر</Popover.Header>
            <Popover.Body>
                <h6>اختر الخلفية:</h6>
                <div className="d-flex flex-wrap gap-2 mb-3">
                    {chatBackgrounds.map(bg => (
                        <div key={bg.name} onClick={() => handleBackgroundChange(bg)} style={{ cursor: 'pointer', border: activeBackground.name === bg.name ? '3px solid #007bff' : '3px solid transparent', borderRadius: '8px', padding: '2px' }}>
                            <div style={{ width: '45px', height: '70px', background: bg.style, backgroundSize: 'cover', borderRadius: '6px' }} title={bg.name}></div>
                        </div>
                    ))}
                </div>
                <hr />
                <h6>اختر مجموعة الألوان:</h6>
                <div className="d-flex flex-wrap gap-3">
                    {chatColorSchemes.map(scheme => (
                        <div key={scheme.name} onClick={() => handleColorSchemeChange(scheme)} title={scheme.name} style={{ cursor: 'pointer', border: activeColorScheme.name === scheme.name ? '2px solid #007bff' : '2px solid transparent', borderRadius: '50%', padding: '2px' }}>
                            <div className="d-flex">
                                <div style={{ width: '20px', height: '20px', backgroundColor: scheme.assistantBubble, borderRadius: '50% 0 0 50%' }}></div>
                                <div style={{ width: '20px', height: '20px', backgroundColor: scheme.userBubble, borderRadius: '0 50% 50% 0' }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </Popover.Body>
        </Popover>
    );

    return (
        <Modal show={show} onHide={onHide} size="lg" centered backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title className="d-flex align-items-center">
                    <i className="fas fa-robot text-info me-2"></i> المساعد الذكي
                </Modal.Title>
                <div className="ms-auto d-flex align-items-center gap-2">
                    <Button variant="outline-secondary" size="sm" onClick={handleClearConversation} title="مسح المحادثة الحالية">
                        <i className="fas fa-eraser"></i>
                    </Button>
                    <OverlayTrigger trigger="click" placement="bottom-end" overlay={settingsPopover} rootClose>
                        <Button variant="outline-secondary" size="sm" title="تخصيص المظهر">
                            <i className="fas fa-cog"></i>
                        </Button>
                    </OverlayTrigger>
                </div>
            </Modal.Header>
            <Modal.Body style={{ display: 'flex', flexDirection: 'column', height: '65vh', padding: '0' }}>
                {isLoadingConvs ? (
                    <div className="d-flex justify-content-center align-items-center h-100"><Spinner animation="border" /> <span className="ms-2">جاري تحميل المحادثات...</span></div>
                ) : (
                    <Tabs activeKey={activeConvId} onSelect={handleTabSelect} className="chat-tabs px-3 pt-2" variant="pills">
                        {conversations.map((conv) => (
                            <Tab key={conv.id} eventKey={conv.id} title={<span className="d-flex align-items-center">{conv.name}<Button variant="link" size="sm" className="ms-2 p-0 text-muted close-tab-btn" onClick={(e) => handleCloseConversation(e, conv.id)} style={{ lineHeight: 1 }}>&times;</Button></span>} />
                        ))}
                        <Tab eventKey="new-tab" title="+" disabled={conversations.length >= 3} />
                    </Tabs>
                )}
                <div ref={chatWindowRef} className="chat-window flex-grow-1" style={dynamicStyles.chatWindow}>
                    {isLoadingMessages ? (
                        <div className="d-flex justify-content-center align-items-center h-100"><Spinner animation="border" variant={dynamicStyles.messageBubble.color === '#fff' ? 'light' : 'primary'} /></div>
                    ) : (
                        activeConversation?.messages?.length > 0 ? (
                            activeConversation.messages.map((msg, index) => (
                                <div key={msg.id || index} style={{ ...dynamicStyles.messageBubble, ...(msg.sender.toLowerCase() === 'user' ? dynamicStyles.userMessage : dynamicStyles.assistantMessage) }}>
                                    <div>{msg.content}</div>
                                    <div style={dynamicStyles.messageTimestamp}>{new Date(msg.sentAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
                                </div>
                            ))
                        ) : (
                            !isLoadingConvs && <div className="text-center text-muted p-5">ابدأ محادثتك...</div>
                        )
                    )}
                    {isSending && <div style={{ ...dynamicStyles.messageBubble, ...dynamicStyles.assistantMessage, alignSelf: 'flex-start' }}><Spinner animation="grow" size="sm" /></div>}
                </div>
            </Modal.Body>
            <Modal.Footer style={dynamicStyles.footer}>
                <Form className="w-100 d-flex gap-2" onSubmit={handleSendMessage}>
                    <Form.Control
                        ref={messageInputRef} // ✨ 4. ربط الـ ref هنا
                        type="text"
                        placeholder="اكتب سؤالك هنا..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        disabled={isSending || isLoadingMessages || isLoadingConvs}
                        style={{
                            backgroundColor: dynamicStyles.userMessage.backgroundColor,
                            color: dynamicStyles.userMessage.color,
                        }}
                    />
                    <Button variant="primary" type="submit" disabled={isSending || !messageInput.trim()}>
                        {isSending ? <Spinner size="sm" /> : <i className="fas fa-paper-plane"></i>}
                    </Button>
                </Form>
            </Modal.Footer>
        </Modal>
    );
}

export default ChatModal;
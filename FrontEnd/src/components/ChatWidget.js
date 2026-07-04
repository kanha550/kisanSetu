import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  MessageCircle, 
  User as UserIcon, 
  Search,
  Loader2,
  Check,
  CheckCheck
} from 'lucide-react';
import { 
  getMyConversations, 
  getMessages, 
  markMessagesRead 
} from '../utils/api';
import { connectSocket } from '../utils/socket';
import { BACKEND_URL } from '../config';

function ChatWidget({ isOpen, onClose, initialPartnerId = null, initialOrderId = null, currentUser }) {
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [onlineStatuses, setOnlineStatuses] = useState({});
  const messagesEndRef = useRef(null);
  
  // Establish socket connection on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const newSocket = connectSocket(token);
    setSocket(newSocket);
    
    return () => {
      // Don't disconnect on unmount so background notifications could work later
    };
  }, []);

  // Fetch conversations
  const fetchConversations = async () => {
    setLoadingChats(true);
    try {
      const res = await getMyConversations();
      if (res.data?.success) {
        setConversations(res.data.conversations);
        
        // Request online status for all partners
        if (socket && currentUser) {
          const partnerIds = res.data.conversations
            .flatMap(c => c.participants)
            .filter(p => p._id !== currentUser._id)
            .map(p => p._id);
            
          socket.emit('check_online_status', [...new Set(partnerIds)]);
          
          // Join all conversation rooms so we receive background messages
          res.data.conversations.forEach(c => {
            socket.emit('join_conversation', c._id);
          });
        }
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen, socket, currentUser]);

  useEffect(() => {
    if (isOpen && initialPartnerId && !activeChat && conversations.length > 0) {
      const existingChat = conversations.find(c => 
        c.participants.some(p => p._id === initialPartnerId)
      );
      if (existingChat) {
        handleOpenChat(existingChat);
      }
    }
  }, [isOpen, initialPartnerId, conversations]);

  // Load messages when active chat changes
  useEffect(() => {
    if (activeChat && isOpen) {
      loadMessages(activeChat._id);
      
      if (socket) {
        socket.emit('join_conversation', activeChat._id);
        socket.emit('mark_read', { conversationId: activeChat._id });
        markMessagesRead(activeChat._id).catch(console.error);
        
        setConversations(prev => 
          prev.map(c => c._id === activeChat._id ? { ...c, unreadCount: 0 } : c)
        );
      }
    }
  }, [activeChat, isOpen, socket]);

  // Socket event listeners for messages and presence
  useEffect(() => {
    if (!socket || !isOpen) return;

    const handleReceiveMessage = (message) => {
      if (activeChat && message.conversation === activeChat._id) {
        setMessages(prev => [...prev, message]);
        if (message.sender._id !== currentUser?._id) {
           socket.emit('mark_read', { conversationId: activeChat._id });
        }
      } 
      
      setConversations(prev => {
        let updated = [...prev];
        const chatIdx = updated.findIndex(c => c._id === message.conversation);
        if (chatIdx > -1) {
          updated[chatIdx].lastMessage = message.text;
          updated[chatIdx].lastMessageAt = message.createdAt;
          if (!activeChat || activeChat._id !== message.conversation) {
             if (message.sender._id !== currentUser?._id) {
               updated[chatIdx].unreadCount = (updated[chatIdx].unreadCount || 0) + 1;
             }
          }
        }
        return updated.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      });
    };

    const handleMessageStatusUpdate = ({ conversationId, status }) => {
      setMessages(prev => prev.map(msg => 
        (msg.conversation === conversationId && msg.sender?._id === currentUser?._id)
          ? { ...msg, status } 
          : msg
      ));
    };

    const handleUserStatusChange = ({ userId, status }) => {
      setOnlineStatuses(prev => ({ ...prev, [userId]: status }));
    };

    const handleOnlineStatusResponse = (statuses) => {
      setOnlineStatuses(prev => ({ ...prev, ...statuses }));
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_status_update', handleMessageStatusUpdate);
    socket.on('user_status_change', handleUserStatusChange);
    socket.on('online_status_response', handleOnlineStatusResponse);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('message_status_update', handleMessageStatusUpdate);
      socket.off('user_status_change', handleUserStatusChange);
      socket.off('online_status_response', handleOnlineStatusResponse);
    };
  }, [socket, isOpen, activeChat, currentUser]);

  const loadMessages = async (conversationId) => {
    setLoadingMessages(true);
    try {
      const res = await getMessages(conversationId);
      if (res.data?.success) {
        setMessages(res.data.messages);
        scrollToBottom();
      }
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleOpenChat = (chat) => {
    setActiveChat(chat);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !socket) return;

    socket.emit('send_message', {
      conversationId: activeChat._id,
      text: newMessage.trim()
    });

    setNewMessage('');
    scrollToBottom();
  };

  const getPartnerInfo = (chat) => {
    if (!chat || !currentUser) return null;
    return chat.participants.find(p => p._id !== currentUser._id);
  };

  const renderMessageTick = (status) => {
    if (status === 'read') return <CheckCheck className="h-3.5 w-3.5 text-blue-400" />;
    if (status === 'delivered') return <CheckCheck className="h-3.5 w-3.5 text-gray-300" />;
    return <Check className="h-3.5 w-3.5 text-gray-300" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity p-0 sm:p-4 md:p-6">
      <div className="w-full max-w-5xl bg-white/95 backdrop-blur-md h-full rounded-none sm:rounded-3xl flex flex-col md:flex-row shadow-2xl overflow-hidden slide-in-right border border-gray-100">
        
        {/* Left Sidebar - Conversations List */}
        <div className={`w-full md:w-80 bg-white/80 border-r border-gray-100 flex flex-col h-full ${activeChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-5 flex justify-between items-center z-10">
            <h2 className="text-2xl font-black text-emerald-950 flex items-center">
              <MessageCircle className="h-6 w-6 mr-2 text-emerald-600" />
              Messages
            </h2>
            <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-800 bg-gray-100 p-2 rounded-full transition">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search chats..." 
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingChats ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              </div>
            ) : conversations.length > 0 ? (
              conversations.map((chat) => {
                const partner = getPartnerInfo(chat);
                const isActive = activeChat && activeChat._id === chat._id;
                const isOnline = partner && onlineStatuses[partner._id] === 'online';
                
                return (
                  <div 
                    key={chat._id}
                    onClick={() => handleOpenChat(chat)}
                    className={`px-4 py-3 cursor-pointer transition-all flex items-start gap-3 border-l-4 ${isActive ? 'bg-emerald-50/70 border-l-emerald-500' : 'border-l-transparent hover:bg-gray-50'}`}
                  >
                    <div className="relative flex-shrink-0">
                      {partner?.image ? (
                        <img src={`${BACKEND_URL}${partner.image}`} alt={partner.name} className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm" />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 border-2 border-white shadow-sm">
                          <UserIcon className="h-6 w-6" />
                        </div>
                      )}
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-white shadow-sm"></span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className={`text-sm truncate ${isActive ? 'font-black text-emerald-950' : 'font-bold text-gray-800'}`}>{partner?.name}</h4>
                        <span className={`text-[10px] whitespace-nowrap ${chat.unreadCount > 0 ? 'text-emerald-600 font-bold' : 'text-gray-400 font-medium'}`}>
                          {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                        </span>
                      </div>
                      <p className={`text-xs truncate ${chat.unreadCount > 0 ? 'text-emerald-800 font-bold' : 'text-gray-500 font-medium'}`}>
                        {chat.lastMessage || 'Start a conversation'}
                      </p>
                      {chat.order && (
                        <span className="inline-block mt-1 text-[9px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded uppercase font-bold border border-amber-100">
                          Order: {chat.order.crop?.name}
                        </span>
                      )}
                    </div>
                    
                    {chat.unreadCount > 0 && (
                      <div className="h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                        <span className="text-white text-[10px] font-bold">{chat.unreadCount}</span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-gray-500 text-sm font-medium">
                No conversations yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Chat Area */}
        <div className={`flex-1 flex flex-col bg-stone-50/50 ${!activeChat ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
          {!activeChat ? (
            <div className="text-center p-8 bg-white/60 rounded-3xl backdrop-blur-xl shadow-sm border border-white max-w-sm m-4">
              <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-10 w-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-emerald-950 mb-2">KisanSetu Connect</h3>
              <p className="text-sm font-medium text-gray-500 leading-relaxed">Select a conversation from the sidebar or start a new chat directly from the marketplace.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="h-20 border-b border-gray-100 bg-white/90 backdrop-blur-md px-6 flex items-center justify-between shadow-sm flex-shrink-0 z-10">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setActiveChat(null)} 
                    className="md:hidden text-gray-400 hover:text-emerald-600 mr-1 p-2 rounded-full hover:bg-emerald-50 transition"
                  >
                    &larr;
                  </button>
                  <div className="relative">
                    {getPartnerInfo(activeChat)?.image ? (
                      <img src={`${BACKEND_URL}${getPartnerInfo(activeChat)?.image}`} className="h-12 w-12 rounded-full object-cover shadow-sm" alt="" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-sm">
                        <UserIcon className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-emerald-950">{getPartnerInfo(activeChat)?.name}</h3>
                    {onlineStatuses[getPartnerInfo(activeChat)?._id] === 'online' ? (
                      <p className="text-xs text-emerald-600 font-bold flex items-center">
                        <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
                        Online now
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 font-medium flex items-center">
                        Offline
                      </p>
                    )}
                  </div>
                </div>
                
                <button onClick={onClose} className="hidden md:flex text-gray-400 hover:text-gray-800 bg-gray-50 p-2.5 rounded-full hover:bg-gray-100 transition-colors shadow-sm">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-gradient-to-b from-stone-50/50 to-stone-100/50 relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23064e3b\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
                
                {loadingMessages ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg, idx) => {
                    const isMine = msg.sender?._id === currentUser?._id || msg.sender === currentUser?._id;
                    const showDate = idx === 0 || new Date(messages[idx-1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
                    
                    return (
                      <div key={msg._id || idx} className="relative z-10">
                        {showDate && (
                          <div className="flex justify-center my-6">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm border border-gray-100">
                              {new Date(msg.createdAt).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        )}
                        <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                          <div 
                            className={`max-w-[80%] md:max-w-[70%] px-4 py-2.5 rounded-3xl ${
                              isMine 
                                ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-br-sm shadow-md' 
                                : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'
                            }`}
                          >
                            <p className="text-sm break-words whitespace-pre-wrap leading-relaxed font-medium">{msg.text}</p>
                            
                            <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] font-bold ${isMine ? 'text-emerald-100' : 'text-gray-400'}`}>
                              <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {isMine && renderMessageTick(msg.status || (msg.read ? 'read' : 'sent'))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-emerald-900/40 relative z-10">
                    <div className="bg-white/50 p-6 rounded-full shadow-sm mb-4 backdrop-blur-sm border border-white">
                      <MessageCircle className="h-16 w-16" />
                    </div>
                    <p className="text-base font-bold">Say hello to {getPartnerInfo(activeChat)?.name.split(' ')[0]}</p>
                    {activeChat.order && (
                      <p className="text-xs mt-2 max-w-xs text-center font-semibold px-4 py-1.5 bg-white/60 rounded-full shadow-sm">
                        Subject: {activeChat.order.crop?.name}
                      </p>
                    )}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 md:p-5 bg-white/90 backdrop-blur-md border-t border-gray-100 flex-shrink-0 z-10">
                <form onSubmit={handleSendMessage} className="flex items-end gap-3 max-w-4xl mx-auto">
                  <div className="relative flex-grow bg-gray-50 border border-gray-200 rounded-3xl shadow-sm focus-within:ring-2 focus-within:ring-emerald-200 focus-within:border-emerald-500 transition-all">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder="Type a message..."
                      className="w-full bg-transparent py-3.5 px-5 text-sm font-medium focus:outline-none resize-none max-h-32 min-h-[48px] overflow-y-auto block rounded-3xl"
                      rows="1"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={!newMessage.trim()}
                    className="p-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all flex-shrink-0"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .slide-in-right {
          animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}} />
    </div>
  );
}

export default ChatWidget;

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAppContext } from '../context/AppContext';

function OrderChatModal({ orderId, orderNumber, isOpen, onClose }) {
  const { currentUser } = useAppContext();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const scrollRef = useRef(null);

  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['order-messages', orderId],
    queryFn: () => api.orders.messages(orderId),
    enabled: isOpen && !!orderId,
    refetchInterval: 5000, // Poll for new messages every 5s
  });

  const sendMutation = useMutation({
    mutationFn: (text) => api.orders.sendMessage(orderId, { message: text }),
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['order-messages', orderId] });
    },
  });

  const closeChatMutation = useMutation({
    mutationFn: () => api.orders.closeChat(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-messages', orderId] });
      onClose();
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messagesData]);

  if (!isOpen) return null;

  const messages = messagesData?.data?.messages || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[80vh]">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-900">Order Chat: {orderNumber}</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Admin & Supplier Channel</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition">
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Message Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {isLoading ? (
            <div className="text-center py-10 text-slate-400">Loading conversation...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-10 text-slate-400 italic">No messages yet.</div>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg._id} 
                className={`flex flex-col ${msg.senderId?._id === currentUser.id ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-[10px] font-black uppercase text-slate-400">
                    {msg.senderId?.name} ({msg.senderId?.role})
                  </span>
                  <span className="text-[10px] text-slate-300">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm font-medium ${
                  msg.isSystem ? 'bg-amber-50 text-amber-900 border border-amber-100 italic w-full text-center max-w-full' :
                  msg.senderId?._id === currentUser.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-700 shadow-sm border border-slate-100'
                }`}>
                  {msg.message}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-slate-100 bg-white">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (message.trim()) sendMutation.mutate(message);
            }}
            className="flex gap-3"
          >
            <input 
              type="text" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
            <button 
              disabled={sendMutation.isPending || !message.trim()}
              className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
          
          {currentUser.role === 'admin' && (
            <div className="mt-4 flex justify-between items-center pt-4 border-t border-slate-50">
              <span className="text-xs text-slate-400 italic">Admin Controls:</span>
              <button 
                onClick={() => {
                  if (confirm('Are you sure you want to close this chat? This will make it read-only for suppliers.')) {
                    closeChatMutation.mutate();
                  }
                }}
                className="text-xs font-black text-rose-500 uppercase tracking-widest hover:text-rose-700 transition"
              >
                Close Chat Channel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderChatModal;

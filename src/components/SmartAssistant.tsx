import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, Loader2, X, MessageCircle, User, MapPin, Phone, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: string;
  suggested_doctors?: any[];
  pharmacies_on_duty?: any[];
}

const SmartAssistant = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'مرحباً! أنا مساعدك الذكي في MEDLINK. كيف يمكنني مساعدتك اليوم؟ يمكنني:\n\n• مساعدتك في حجز موعد مع طبيب\n• إيجاد أقرب صيدلية مناوبة\n• شرح كيفية رفع التحاليل\n• الإجابة على أسئلتك'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('smart-assistant', {
        body: {
          message: input,
          userId: user?.id,
          context: input.includes('حجز') || input.includes('موعد') ? 'booking' : 'general'
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        action: data.action,
        suggested_doctors: data.suggested_doctors,
        pharmacies_on_duty: data.pharmacies_on_duty
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error('Assistant error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'عذراً، حدث خطأ. حاول مرة أخرى.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: 'حجز موعد', message: 'أريد حجز موعد مع طبيب' },
    { label: 'صيدلية مناوبة', message: 'ابحث لي عن صيدلية مناوبة قريبة' },
    { label: 'رفع تحليل', message: 'كيف أرفع نتائج تحاليلي؟' },
  ];

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 left-6 w-96 h-[500px] shadow-2xl z-50 flex flex-col" dir="rtl">
      <CardHeader className="pb-2 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="h-5 w-5 text-primary" />
            المساعد الذكي
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id}>
              <div
                className={`flex ${message.role === 'user' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>

              {/* عرض الأطباء المقترحين */}
              {message.suggested_doctors && message.suggested_doctors.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">الأطباء المتاحون:</p>
                  {message.suggested_doctors.map((doctor, idx) => (
                    <div 
                      key={idx}
                      className="bg-background border rounded-lg p-3 cursor-pointer hover:border-primary transition-colors"
                      onClick={() => navigate('/doctors')}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Stethoscope className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">{doctor.specialty}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{doctor.wilaya} - {doctor.clinic}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-green-600">{doctor.available_slots} مواعيد متاحة</span>
                        <span className="text-xs font-medium">{doctor.price} دج</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* عرض الصيدليات المناوبة */}
              {message.pharmacies_on_duty && message.pharmacies_on_duty.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">الصيدليات المناوبة:</p>
                  {message.pharmacies_on_duty.map((pharmacy, idx) => (
                    <div 
                      key={idx}
                      className="bg-green-50 border border-green-200 rounded-lg p-3"
                    >
                      <p className="font-medium text-sm text-green-800">{pharmacy.name}</p>
                      <div className="flex items-center gap-2 text-xs text-green-600 mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{pharmacy.address}</span>
                      </div>
                      {pharmacy.phone && (
                        <div className="flex items-center gap-2 text-xs text-green-600 mt-1">
                          <Phone className="h-3 w-3" />
                          <a href={`tel:${pharmacy.phone}`}>{pharmacy.phone}</a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-end">
              <div className="bg-muted rounded-2xl px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* أزرار سريعة */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 border-t flex-shrink-0">
          <div className="flex gap-2 flex-wrap">
            {quickActions.map((action, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setInput(action.message);
                  setTimeout(sendMessage, 100);
                }}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* حقل الإدخال */}
      <div className="p-4 border-t flex-shrink-0">
        <div className="flex gap-2">
          <Input
            placeholder="اكتب رسالتك..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            disabled={isLoading}
          />
          <Button onClick={sendMessage} disabled={isLoading || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default SmartAssistant;

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DoctorReviewFormProps {
  doctorId: string;
  appointmentId?: string;
  evaluationId?: string;
  doctorName?: string;
  onSuccess?: () => void;
  type: 'appointment' | 'evaluation';
}

const DoctorReviewForm = ({
  doctorId,
  appointmentId,
  evaluationId,
  doctorName,
  onSuccess,
  type
}: DoctorReviewFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'خطأ',
        description: 'يجب تسجيل الدخول لإضافة تقييم',
        variant: 'destructive',
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: 'تنبيه',
        description: 'يرجى اختيار عدد النجوم',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from('reviews').insert({
        doctor_id: doctorId,
        patient_id: user.id,
        rating: rating,
        comment: comment.trim() || null,
        appointment_id: appointmentId || null,
      });

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'شكراً لتقييمك! سيساعد هذا المرضى الآخرين',
      });

      setRating(0);
      setComment('');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء إرسال التقييم',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-border/50" dir="rtl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" />
          {type === 'appointment' ? 'قيّم زيارتك' : 'قيّم تقييم الطبيب'}
        </CardTitle>
        {doctorName && (
          <p className="text-sm text-muted-foreground">
            كيف كانت تجربتك مع د. {doctorName}؟
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Star Rating */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  star <= (hoveredRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground/30'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Rating Text */}
        <div className="text-center">
          {rating === 0 && <p className="text-sm text-muted-foreground">اضغط لاختيار التقييم</p>}
          {rating === 1 && <p className="text-sm text-red-500">سيء جداً</p>}
          {rating === 2 && <p className="text-sm text-orange-500">سيء</p>}
          {rating === 3 && <p className="text-sm text-yellow-500">متوسط</p>}
          {rating === 4 && <p className="text-sm text-green-500">جيد</p>}
          {rating === 5 && <p className="text-sm text-primary">ممتاز!</p>}
        </div>

        {/* Comment */}
        <Textarea
          placeholder="شاركنا تجربتك (اختياري)..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
        />

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={submitting || rating === 0}
          className="w-full"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              جاري الإرسال...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 ml-2" />
              إرسال التقييم
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DoctorReviewForm;

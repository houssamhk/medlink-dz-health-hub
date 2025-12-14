import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, User, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  patient_name?: string;
}

interface DoctorReviewsProps {
  doctorId: string;
}

const DoctorReviews = ({ doctorId }: DoctorReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [doctorId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card className="border-border/50" dir="rtl">
        <CardContent className="py-8 text-center">
          <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">لا توجد تقييمات بعد</p>
          <p className="text-sm text-muted-foreground mt-1">كن أول من يقيّم هذا الطبيب</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50" dir="rtl">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" />
          تقييمات المرضى ({reviews.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="p-4 rounded-xl bg-muted/30 border border-border/50"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">مريض</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(review.created_at), 'dd MMMM yyyy', { locale: ar })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            </div>
            {review.comment && (
              <p className="text-sm text-muted-foreground">{review.comment}</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default DoctorReviews;

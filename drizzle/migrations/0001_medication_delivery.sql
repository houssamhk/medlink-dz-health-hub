-- dispensing timestamp on prescriptions
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS dispensed_at TIMESTAMPTZ;

-- deliveries table
CREATE TABLE IF NOT EXISTS public.medication_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL,
  pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  address TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'requested',
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 300,
  courier_name TEXT,
  courier_phone TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_pharmacy ON public.medication_deliveries(pharmacy_id, status);
CREATE INDEX IF NOT EXISTS idx_deliveries_patient ON public.medication_deliveries(patient_id);

GRANT SELECT, INSERT, UPDATE ON public.medication_deliveries TO authenticated;
GRANT ALL ON public.medication_deliveries TO service_role;

ALTER TABLE public.medication_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients view own deliveries" ON public.medication_deliveries
FOR SELECT TO authenticated USING (patient_id = auth.uid());

CREATE POLICY "Patients create own deliveries" ON public.medication_deliveries
FOR INSERT TO authenticated WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Patients cancel own deliveries" ON public.medication_deliveries
FOR UPDATE TO authenticated USING (patient_id = auth.uid()) WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Pharmacy views its deliveries" ON public.medication_deliveries
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.pharmacies ph WHERE ph.id = medication_deliveries.pharmacy_id AND ph.user_id = auth.uid())
);

CREATE POLICY "Pharmacy updates its deliveries" ON public.medication_deliveries
FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.pharmacies ph WHERE ph.id = medication_deliveries.pharmacy_id AND ph.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.pharmacies ph WHERE ph.id = medication_deliveries.pharmacy_id AND ph.user_id = auth.uid())
);

CREATE TRIGGER update_medication_deliveries_updated_at
BEFORE UPDATE ON public.medication_deliveries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- dispense a prescription: deduct stock + mark dispensed + notify patient
CREATE OR REPLACE FUNCTION public.dispense_prescription(p_prescription_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_rx RECORD;
  v_med JSONB;
  v_item RECORD;
  v_qty INTEGER;
  v_deducted JSONB := '[]'::jsonb;
  v_missing JSONB := '[]'::jsonb;
BEGIN
  SELECT * INTO v_rx FROM prescriptions WHERE id = p_prescription_id;
  IF v_rx IS NULL THEN
    RAISE EXCEPTION 'Prescription not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pharmacies ph
    WHERE ph.id = v_rx.pharmacy_id AND ph.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: prescription does not belong to your pharmacy';
  END IF;

  IF v_rx.status = 'dispensed' THEN
    RAISE EXCEPTION 'Prescription already dispensed';
  END IF;

  FOR v_med IN SELECT * FROM jsonb_array_elements(v_rx.medications)
  LOOP
    v_qty := COALESCE((v_med->>'quantity')::INTEGER, 1);

    SELECT * INTO v_item FROM pharmacy_inventory pi
    WHERE pi.pharmacy_id = v_rx.pharmacy_id
      AND lower(trim(pi.medication_name)) = lower(trim(v_med->>'name'))
    LIMIT 1;

    IF v_item IS NULL OR v_item.quantity < v_qty THEN
      v_missing := v_missing || jsonb_build_object('name', v_med->>'name', 'available', COALESCE(v_item.quantity, 0));
    ELSE
      UPDATE pharmacy_inventory
      SET quantity = quantity - v_qty, updated_at = now()
      WHERE id = v_item.id;
      v_deducted := v_deducted || jsonb_build_object('name', v_med->>'name', 'quantity', v_qty);
    END IF;
  END LOOP;

  UPDATE prescriptions
  SET status = 'dispensed', dispensed_at = now(), updated_at = now()
  WHERE id = p_prescription_id;

  INSERT INTO notifications (user_id, title, message, type, related_id, related_type)
  VALUES (
    v_rx.patient_id,
    'تم صرف وصفتك الطبية',
    'قامت الصيدلية بصرف أدوية وصفتك الطبية. يمكنك طلب التوصيل إلى عنوانك.',
    'success',
    p_prescription_id,
    'prescription'
  );

  RETURN jsonb_build_object('deducted', v_deducted, 'missing', v_missing);
END;
$$;

GRANT EXECUTE ON FUNCTION public.dispense_prescription(UUID) TO authenticated;

-- notify pharmacy on new delivery request
CREATE OR REPLACE FUNCTION public.notify_pharmacy_on_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner UUID;
BEGIN
  SELECT user_id INTO v_owner FROM pharmacies WHERE id = NEW.pharmacy_id;
  IF v_owner IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, related_id, related_type)
    VALUES (v_owner, 'طلب توصيل جديد',
      'طلب توصيل أدوية إلى: ' || NEW.address || '، ' || NEW.wilaya,
      'info', NEW.id, 'delivery');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_delivery_requested
AFTER INSERT ON public.medication_deliveries
FOR EACH ROW EXECUTE FUNCTION public.notify_pharmacy_on_delivery();

-- notify patient on delivery status change
CREATE OR REPLACE FUNCTION public.notify_patient_on_delivery_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO notifications (user_id, title, message, type, related_id, related_type)
    VALUES (NEW.patient_id, 'تحديث حالة التوصيل',
      CASE NEW.status
        WHEN 'preparing' THEN 'الصيدلية تجهز طلبك الآن'
        WHEN 'out_for_delivery' THEN 'طلبك في الطريق إليك'
        WHEN 'delivered' THEN 'تم تسليم أدويتك بنجاح'
        WHEN 'cancelled' THEN 'تم إلغاء طلب التوصيل'
        ELSE 'تم تحديث حالة طلب التوصيل'
      END,
      CASE WHEN NEW.status = 'cancelled' THEN 'warning' WHEN NEW.status = 'delivered' THEN 'success' ELSE 'info' END,
      NEW.id, 'delivery');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_delivery_status_changed
AFTER UPDATE ON public.medication_deliveries
FOR EACH ROW EXECUTE FUNCTION public.notify_patient_on_delivery_status();
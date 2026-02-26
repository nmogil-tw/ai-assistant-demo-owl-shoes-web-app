import { twilioApi } from "@/integrations/twilio";

const ANONYMOUS_ID_KEY = "segment_anonymous_id";
const CART_ID_KEY = "segment_cart_id";

export function getAnonymousId(): string {
  let id = localStorage.getItem(ANONYMOUS_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ANONYMOUS_ID_KEY, id);
  }
  return id;
}

export function getCartId(): string | null {
  return localStorage.getItem(CART_ID_KEY);
}

export function ensureCartId(): string {
  let id = localStorage.getItem(CART_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CART_ID_KEY, id);
  }
  return id;
}

export function clearCartId(): void {
  localStorage.removeItem(CART_ID_KEY);
}

interface TrackSegmentEventParams {
  eventTrigger: string;
  properties: Record<string, any>;
  formData?: Record<string, any>;
}

export function trackSegmentEvent({ eventTrigger, properties, formData }: TrackSegmentEventParams): void {
  twilioApi.analytics.sendToSegment({
    eventTrigger,
    anonymousId: getAnonymousId(),
    properties,
    ...(formData ? { formData } : {}),
  }).catch((err) => {
    console.error("Failed to send Segment event:", err);
  });
}

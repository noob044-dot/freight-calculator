import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Keep-alive timer to prevent timeout
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keep-alive\n\n'));
        } catch {
          clearInterval(interval);
        }
      }, 15000);

      // Send initial connection acknowledgment
      controller.enqueue(encoder.encode(`event: open\ndata: ${JSON.stringify({ message: "Connected to bidding stream" })}\n\n`));

      // Simulate live incoming bids
      const bidSim = setInterval(() => {
        const forwarders = ['Safexpress', 'Blue Dart', 'DHL Express', 'FedEx Logistics', 'Gati KWE'];
        const fwdIdMap: Record<string, string> = {
          'Safexpress': 'fwd-safexpress',
          'Blue Dart': 'fwd-bluedart',
          'DHL Express': 'fwd-dhl',
          'FedEx Logistics': 'fwd-fedex',
          'Gati KWE': 'fwd-gati'
        };
        const fwd = forwarders[Math.floor(Math.random() * forwarders.length)];
        const amount = Math.floor(12000 + Math.random() * 48000);
        const transitDays = Math.floor(2 + Math.random() * 5);
        
        const mockBid = {
          forwarderId: fwdIdMap[fwd] || 'fwd-safexpress',
          forwarderName: fwd,
          amount: amount,
          transitDays: transitDays,
          submittedAt: new Date().toISOString(),
          status: 'Pending' as const,
          remarks: "Real-time pricing match response over SSE channel."
        };

        try {
          controller.enqueue(encoder.encode(`event: new-bid\ndata: ${JSON.stringify(mockBid)}\n\n`));
        } catch {
          clearInterval(bidSim);
          clearInterval(interval);
        }
      }, 8000); // Emit a live mock bid every 8 seconds

      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        clearInterval(bidSim);
        try {
          controller.close();
        } catch {
          // Stream already closed
        }
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}

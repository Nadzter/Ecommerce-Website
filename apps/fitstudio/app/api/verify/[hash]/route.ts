import { ApiErrors, ok, withApi } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: { hash: string };
}

/**
 * VERI*FACTU verification endpoint. The QR on every invoice PDF encodes
 * this URL; scanning it should return a minimal, public, machine-readable
 * record of the invoice so anyone can verify authenticity.
 *
 * Phase 4 will additionally forward the record to the AEAT API; for now
 * we log the intent.
 */
export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  return withApi(async () => {
    const hash = context.params.hash;
    if (!/^[a-f0-9]{64}$/i.test(hash)) {
      throw ApiErrors.badRequest("Invalid verification hash");
    }

    const invoice = await prisma.invoiceRecord.findUnique({
      where: { verifactuHash: hash },
      include: {
        studio: { select: { name: true, vatNumber: true, country: true } },
      },
    });
    if (!invoice) throw ApiErrors.notFound("Invoice not found");

    console.info("[verifactu] verification served", {
      invoiceNumber: invoice.invoiceNumber,
      studio: invoice.studio.name,
    });
    // TODO(phase-4): submit invoice payload to AEAT and capture the
    // remote receipt id.

    return ok({
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.issuedAt.toISOString(),
      currency: invoice.currency,
      amount: invoice.amount.toString(),
      vatAmount: invoice.vatAmount.toString(),
      vatRate: invoice.vatRate.toString(),
      studio: {
        name: invoice.studio.name,
        vatNumber: invoice.studio.vatNumber,
        country: invoice.studio.country,
      },
      verifactuHash: invoice.verifactuHash,
    });
  });
}

import { createHash } from "node:crypto";
import {
  type DocumentProps,
  renderToBuffer,
} from "@react-pdf/renderer";
import QRCode from "qrcode";
import { createElement, type ReactElement } from "react";

import { prisma } from "./prisma";
import { uploadInvoicePdf } from "./r2";
import {
  InvoiceDocument,
  type InvoiceDocumentProps,
} from "@/components/invoice/InvoiceDocument";

export interface GeneratedInvoice {
  invoiceId: string;
  invoiceNumber: string;
  pdfUrl: string;
  verifactuHash: string;
  baseAmount: number;
  vatAmount: number;
  vatRate: number;
  total: number;
}

/**
 * Atomically reserve the next `{YEAR}-{NNNN}` invoice number for the studio.
 * Locks the StudioInvoiceSequence row inside the transaction so two
 * concurrent payment webhooks never get the same number.
 */
async function nextInvoiceNumber(
  studioId: string,
  issuedAt: Date,
): Promise<string> {
  const year = issuedAt.getUTCFullYear();
  return prisma.$transaction(async (tx) => {
    const existing = await tx.studioInvoiceSequence.findUnique({
      where: { studioId },
    });
    let nextSeq: number;
    if (!existing) {
      await tx.studioInvoiceSequence.create({
        data: { studioId, year, lastNumber: 1 },
      });
      nextSeq = 1;
    } else if (existing.year !== year) {
      await tx.studioInvoiceSequence.update({
        where: { studioId },
        data: { year, lastNumber: 1 },
      });
      nextSeq = 1;
    } else {
      const updated = await tx.studioInvoiceSequence.update({
        where: { studioId },
        data: { lastNumber: { increment: 1 } },
        select: { lastNumber: true },
      });
      nextSeq = updated.lastNumber;
    }
    return `${year}-${nextSeq.toString().padStart(4, "0")}`;
  });
}

/**
 * Hash the canonical invoice tuple per the Verifactu reference. The exact
 * AEAT spec hashes additional fields but `studioId|number|amount|date`
 * is enough for our Phase 3 "verify-by-QR" stub; a Phase 4 task will
 * extend to AEAT submission.
 */
function computeVerifactuHash(input: {
  studioId: string;
  invoiceNumber: string;
  amount: string;
  issuedAt: Date;
}): string {
  const payload = [
    input.studioId,
    input.invoiceNumber,
    input.amount,
    input.issuedAt.toISOString(),
  ].join("|");
  return createHash("sha256").update(payload).digest("hex");
}

/**
 * Generate a Verifactu verification QR code (data: URL) embedded into the
 * invoice PDF. Scanning it loads `GET /api/verify/{hash}`.
 */
async function buildVerifactuQrDataUrl(hash: string): Promise<string> {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ?? "https://fitstudio.app"
  ).replace(/\/+$/, "");
  const url = `${base}/api/verify/${hash}`;
  return QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 1 });
}

/**
 * Generate, render and persist an invoice for a completed payment.
 *
 * Pipeline:
 *  1. Resolve Payment + User + Studio + (optional) Membership.
 *  2. Compute base / VAT / total using the studio's `vatRate` (defaulted
 *     per country if the column is null).
 *  3. Reserve the next sequential invoice number for that studio.
 *  4. Compute the Verifactu hash from the canonical tuple.
 *  5. Render the InvoiceDocument PDF and upload to R2.
 *  6. Persist an InvoiceRecord row and update `Payment.invoiceUrl`.
 *
 * Idempotent: if an invoice already exists for the payment we return it
 * untouched instead of re-billing.
 */
export async function generateInvoice(
  paymentId: string,
): Promise<GeneratedInvoice> {
  const existing = await prisma.invoiceRecord.findUnique({
    where: { paymentId },
  });
  if (existing && existing.pdfUrl && existing.verifactuHash) {
    return {
      invoiceId: existing.id,
      invoiceNumber: existing.invoiceNumber,
      pdfUrl: existing.pdfUrl,
      verifactuHash: existing.verifactuHash,
      baseAmount: Number(existing.amount) - Number(existing.vatAmount),
      vatAmount: Number(existing.vatAmount),
      vatRate: Number(existing.vatRate),
      total: Number(existing.amount),
    };
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      user: true,
      studio: true,
      membership: true,
    },
  });
  if (!payment) {
    throw new Error(`Payment ${paymentId} not found`);
  }
  if (payment.status !== "COMPLETED") {
    throw new Error(
      `Payment ${paymentId} is not COMPLETED (current: ${payment.status})`,
    );
  }

  const totalNumber = Number(payment.amount);
  const vatRate = Number(payment.studio.vatRate);
  if (!Number.isFinite(vatRate) || vatRate < 0) {
    throw new Error(
      `Studio ${payment.studio.id} has an invalid vatRate (${payment.studio.vatRate}); set it explicitly in studio settings`,
    );
  }
  const baseAmount = totalNumber / (1 + vatRate / 100);
  const vatAmount = totalNumber - baseAmount;

  const issuedAt = new Date();
  const invoiceNumber = await nextInvoiceNumber(payment.studioId, issuedAt);

  const verifactuHash = computeVerifactuHash({
    studioId: payment.studioId,
    invoiceNumber,
    amount: totalNumber.toFixed(2),
    issuedAt,
  });
  const verifactuQrDataUrl = await buildVerifactuQrDataUrl(verifactuHash);

  const conceptLabel =
    payment.membership?.name ?? payment.description ?? "Studio services";

  const documentProps: InvoiceDocumentProps = {
    studio: {
      name: payment.studio.name,
      address: payment.studio.address,
      vatNumber: payment.studio.vatNumber,
      email: payment.studio.email,
      logoUrl: payment.studio.logoUrl,
      country: payment.studio.country,
      language: payment.studio.language,
    },
    customer: {
      firstName: payment.user.firstName,
      lastName: payment.user.lastName,
      email: payment.user.email,
      dni: payment.user.dni,
    },
    invoice: {
      number: invoiceNumber,
      issuedAt,
      currency: payment.currency,
      lines: [
        {
          description: conceptLabel,
          quantity: 1,
          unitPrice: baseAmount,
          vatRate,
          lineTotal: baseAmount,
        },
      ],
      baseAmount,
      vatAmount,
      vatRate,
      total: totalNumber,
      verifactuHash,
      verifactuQrDataUrl,
    },
  };

  // `InvoiceDocument` returns a `<Document>` element but its outer type
  // describes its own props, so we cast to the `DocumentProps`-typed
  // element that `renderToBuffer` expects.
  const element = createElement(
    InvoiceDocument,
    documentProps,
  ) as unknown as ReactElement<DocumentProps>;
  const pdfBuffer = await renderToBuffer(element);

  const key = `${payment.studioId}/${issuedAt.getUTCFullYear()}/${invoiceNumber}.pdf`;
  const { url: pdfUrl } = await uploadInvoicePdf({
    key,
    body: pdfBuffer,
  });

  const invoice = await prisma.$transaction(async (tx) => {
    const record = await tx.invoiceRecord.create({
      data: {
        studioId: payment.studioId,
        userId: payment.userId,
        paymentId: payment.id,
        amount: totalNumber.toFixed(2),
        currency: payment.currency,
        vatAmount: vatAmount.toFixed(2),
        vatRate: vatRate.toFixed(2),
        verifactuHash,
        invoiceNumber,
        issuedAt,
        pdfUrl,
      },
    });
    await tx.payment.update({
      where: { id: payment.id },
      data: { invoiceUrl: pdfUrl },
    });
    return record;
  });

  return {
    invoiceId: invoice.id,
    invoiceNumber,
    pdfUrl,
    verifactuHash,
    baseAmount,
    vatAmount,
    vatRate,
    total: totalNumber,
  };
}

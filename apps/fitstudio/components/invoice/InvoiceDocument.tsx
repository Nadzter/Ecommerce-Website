/* @react-pdf/renderer renders to PDF, not HTML — this file never reaches
 * the browser, so it must not import React DOM helpers. */
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  lineTotal: number;
}

export interface InvoiceDocumentProps {
  studio: {
    name: string;
    address: string | null;
    vatNumber: string | null;
    email: string | null;
    logoUrl: string | null;
    country: "ES" | "AE" | "LB";
    language: "es" | "en" | "ar";
  };
  customer: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    dni: string | null;
  };
  invoice: {
    number: string;
    issuedAt: Date;
    currency: "EUR" | "AED" | "USD" | "LBP";
    lines: InvoiceLine[];
    baseAmount: number;
    vatAmount: number;
    vatRate: number;
    total: number;
    verifactuHash: string | null;
    verifactuQrDataUrl: string | null;
  };
}

/**
 * Tiny i18n bundle. Spanish for ES studios, English for AE/LB so VAT/Arabic
 * markets still get a readable doc until full i18n lands.
 */
function strings(country: "ES" | "AE" | "LB") {
  if (country === "ES") {
    return {
      title: "FACTURA",
      number: "Número de factura",
      date: "Fecha de emisión",
      issuer: "Emisor",
      client: "Cliente",
      taxId: "NIF/CIF",
      dni: "DNI",
      concept: "Concepto",
      quantity: "Cantidad",
      unitPrice: "Precio unitario",
      vatColumn: "IVA",
      lineTotal: "Total",
      base: "Base imponible",
      vatLabel: "IVA",
      total: "Total factura",
      compliance:
        "Factura generada conforme al Real Decreto 1007/2023 (VERI*FACTU)",
      verification: "Verificación VERI*FACTU",
    };
  }
  return {
    title: "INVOICE",
    number: "Invoice number",
    date: "Issue date",
    issuer: "Issuer",
    client: "Customer",
    taxId: "Tax ID",
    dni: "ID",
    concept: "Description",
    quantity: "Qty",
    unitPrice: "Unit price",
    vatColumn: "VAT",
    lineTotal: "Total",
    base: "Subtotal",
    vatLabel: "VAT",
    total: "Invoice total",
    compliance:
      country === "AE"
        ? "Tax invoice issued under the UAE Federal Tax Authority (FTA) regulations."
        : "Tax invoice issued under local regulations.",
    verification: "Invoice verification",
  };
}

function formatMoney(amount: number, currency: string): string {
  const fractionDigits = currency === "LBP" ? 0 : 2;
  return `${amount.toFixed(fractionDigits)} ${currency}`;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  logo: { width: 72, height: 72, objectFit: "contain" },
  logoFallback: {
    width: 72,
    height: 72,
    borderRadius: 6,
    backgroundColor: "#0F172A",
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: 700,
    textAlign: "center",
    paddingTop: 22,
  },
  titleBlock: { alignItems: "flex-end" },
  title: { fontSize: 28, fontWeight: 700, letterSpacing: 2, color: "#0F172A" },
  metaBox: {
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 4,
    minWidth: 200,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  metaLabel: { color: "#64748B" },
  partiesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 24,
  },
  partyBlock: { width: "47%" },
  partyHeading: {
    fontSize: 9,
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 1,
  },
  partyName: { fontSize: 12, fontWeight: 700, marginBottom: 2 },
  partyLine: { color: "#334155" },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 9,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 8,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  cellConcept: { flex: 3 },
  cellQty: { flex: 1, textAlign: "right" },
  cellUnit: { flex: 1.4, textAlign: "right" },
  cellVat: { flex: 0.8, textAlign: "right" },
  cellTotal: { flex: 1.3, textAlign: "right" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  summaryBox: {
    width: 240,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    padding: 12,
  },
  summaryLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  summaryTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#0F172A",
    fontSize: 12,
    fontWeight: 700,
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  footerText: {
    flex: 1,
    color: "#64748B",
    fontSize: 8,
    lineHeight: 1.4,
    paddingRight: 16,
  },
  qrBox: { width: 84, alignItems: "center" },
  qrLabel: { fontSize: 7, color: "#64748B", marginTop: 4 },
  qrImage: { width: 84, height: 84 },
});

/**
 * Server-rendered invoice document. Consumed by `lib/invoicing.ts` via
 * `renderToBuffer(<InvoiceDocument ... />)`.
 */
export function InvoiceDocument(props: InvoiceDocumentProps): JSX.Element {
  const labels = strings(props.studio.country);
  const customerName =
    [props.customer.firstName, props.customer.lastName]
      .filter(Boolean)
      .join(" ") || props.customer.email;

  return (
    <Document title={`Invoice ${props.invoice.number}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          {props.studio.logoUrl ? (
            <Image src={props.studio.logoUrl} style={styles.logo} />
          ) : (
            <Text style={styles.logoFallback}>
              {props.studio.name.slice(0, 1).toUpperCase()}
            </Text>
          )}
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{labels.title}</Text>
            <View style={styles.metaBox}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>{labels.number}</Text>
                <Text>{props.invoice.number}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>{labels.date}</Text>
                <Text>
                  {props.invoice.issuedAt.toISOString().slice(0, 10)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.partiesRow}>
          <View style={styles.partyBlock}>
            <Text style={styles.partyHeading}>{labels.issuer}</Text>
            <Text style={styles.partyName}>{props.studio.name}</Text>
            {props.studio.address ? (
              <Text style={styles.partyLine}>{props.studio.address}</Text>
            ) : null}
            {props.studio.vatNumber ? (
              <Text style={styles.partyLine}>
                {labels.taxId}: {props.studio.vatNumber}
              </Text>
            ) : null}
            {props.studio.email ? (
              <Text style={styles.partyLine}>{props.studio.email}</Text>
            ) : null}
          </View>
          <View style={styles.partyBlock}>
            <Text style={styles.partyHeading}>{labels.client}</Text>
            <Text style={styles.partyName}>{customerName}</Text>
            <Text style={styles.partyLine}>{props.customer.email}</Text>
            {props.customer.dni ? (
              <Text style={styles.partyLine}>
                {labels.dni}: {props.customer.dni}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.cellConcept}>{labels.concept}</Text>
          <Text style={styles.cellQty}>{labels.quantity}</Text>
          <Text style={styles.cellUnit}>{labels.unitPrice}</Text>
          <Text style={styles.cellVat}>{labels.vatColumn} %</Text>
          <Text style={styles.cellTotal}>{labels.lineTotal}</Text>
        </View>
        {props.invoice.lines.map((line, index) => (
          <View key={`${line.description}-${index}`} style={styles.tableRow}>
            <Text style={styles.cellConcept}>{line.description}</Text>
            <Text style={styles.cellQty}>{line.quantity}</Text>
            <Text style={styles.cellUnit}>
              {formatMoney(line.unitPrice, props.invoice.currency)}
            </Text>
            <Text style={styles.cellVat}>{line.vatRate.toFixed(0)}%</Text>
            <Text style={styles.cellTotal}>
              {formatMoney(line.lineTotal, props.invoice.currency)}
            </Text>
          </View>
        ))}

        <View style={styles.summaryRow}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryLine}>
              <Text>{labels.base}</Text>
              <Text>
                {formatMoney(props.invoice.baseAmount, props.invoice.currency)}
              </Text>
            </View>
            <View style={styles.summaryLine}>
              <Text>
                {labels.vatLabel} ({props.invoice.vatRate.toFixed(0)}%)
              </Text>
              <Text>
                {formatMoney(props.invoice.vatAmount, props.invoice.currency)}
              </Text>
            </View>
            <View style={styles.summaryTotal}>
              <Text>{labels.total}</Text>
              <Text>
                {formatMoney(props.invoice.total, props.invoice.currency)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{labels.compliance}</Text>
          {props.invoice.verifactuQrDataUrl ? (
            <View style={styles.qrBox}>
              <Image
                src={props.invoice.verifactuQrDataUrl}
                style={styles.qrImage}
              />
              <Text style={styles.qrLabel}>{labels.verification}</Text>
            </View>
          ) : null}
        </View>
      </Page>
    </Document>
  );
}

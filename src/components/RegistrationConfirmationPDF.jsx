import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#1a3a6c",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a3a6c",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#4b5563",
  },
  successBadge: {
    backgroundColor: "#059669",
    color: "white",
    padding: 12,
    marginBottom: 20,
    borderRadius: 4,
    textAlign: "center",
  },
  successTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  successSub: {
    fontSize: 10,
    opacity: 0.9,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 8,
    marginTop: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    color: "#6b7280",
    fontSize: 10,
  },
  value: {
    fontWeight: "bold",
    color: "#111827",
  },
  block: {
    marginBottom: 8,
  },
  lineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: "#1a3a6c",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1a3a6c",
  },
  footer: {
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    fontSize: 9,
    color: "#6b7280",
  },
  idRow: {
    marginTop: 8,
    fontSize: 9,
    color: "#9ca3af",
  },
});

/**
 * PDF document for registration confirmation.
 * Props: all display-ready strings and numbers for the confirmation (attendeeName, email, ticketLabel, etc.)
 */
const RegistrationConfirmationPDF = ({
  attendeeName,
  email,
  ticketLabel,
  ticketBadge, // e.g. "Early Bird" or "Standard"
  ticketPrice,
  accompanyingLabel,
  accompanyingPrice,
  galaLabel,
  galaPrice,
  totalLabel,
  totalAmount,
  taxNote,
  registrationId,
  paymentId,
  generatedDate,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>ISIR 2026 World Congress</Text>
        <Text style={styles.subtitle}>Registration Confirmation</Text>
      </View>

      <View style={styles.successBadge}>
        <Text style={styles.successTitle}>Registration Successful</Text>
        <Text style={styles.successSub}>
          Thank you for registering for the ISIR 2026 World Congress
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Attendee</Text>
      <View style={styles.block}>
        <Text style={styles.value}>{attendeeName}</Text>
        <Text style={styles.label}>{email}</Text>
      </View>

      <Text style={styles.sectionTitle}>Ticket Details</Text>
      <View style={styles.lineItem}>
        <Text>
          {ticketLabel} {ticketBadge ? `(${ticketBadge})` : ""}
        </Text>
        <Text style={styles.value}>{ticketPrice}</Text>
      </View>
      {accompanyingLabel && (
        <View style={styles.lineItem}>
          <Text>{accompanyingLabel}</Text>
          <Text style={styles.value}>{accompanyingPrice}</Text>
        </View>
      )}
      {galaLabel && (
        <View style={styles.lineItem}>
          <Text>{galaLabel}</Text>
          <Text style={styles.value}>{galaPrice}</Text>
        </View>
      )}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>{totalLabel}</Text>
        <Text style={styles.totalValue}>{totalAmount}</Text>
      </View>
      {taxNote ? (
        <Text style={[styles.label, { marginTop: 4 }]}>{taxNote}</Text>
      ) : null}

      <View style={styles.footer}>
        <Text>
          A confirmation email has been sent to {email}. Please keep this
          document for your records.
        </Text>
        <Text style={styles.idRow}>
          {registrationId ? `Registration ID: ${registrationId}` : ""}
          {registrationId && paymentId ? "  |  " : ""}
          {paymentId ? `Payment ID: ${paymentId}` : ""}
        </Text>
        {generatedDate ? (
          <Text style={styles.idRow}>Generated: {generatedDate}</Text>
        ) : null}
      </View>
    </Page>
  </Document>
);

export default RegistrationConfirmationPDF;

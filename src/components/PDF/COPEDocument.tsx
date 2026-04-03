import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { DiagnosisSectionPDF } from './DiagnosisSectionPDF';
import { TreatmentSectionPDF } from './TreatmentSectionPDF';
import { PrognosisSectionPDF } from './PrognosisSectionPDF';
import { PrognosisDiscussion } from './PrognosisDiscussion';
import type { Demographics, CancerDetails, TreatmentPlan, PrognosisData } from '@/types';

// Register fonts - using system fonts
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica' },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#0d9488',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#0d9488',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  demographicsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 20,
  },
  demographicItem: {
    fontSize: 10,
    color: '#64748b',
  },
});

interface COPEDocumentProps {
  demographics: Demographics;
  cancerDetails: CancerDetails;
  treatmentPlan: TreatmentPlan;
  prognosisData: PrognosisData;
}

export function COPEDocument({ demographics, cancerDetails, treatmentPlan, prognosisData }: COPEDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Cancer Care Roadmap</Text>
          <Text style={styles.subtitle}>A Personal Guide to Your Treatment Journey</Text>
          <View style={styles.demographicsRow}>
            <Text style={styles.demographicItem}>Sex: {demographics.sex}</Text>
            <Text style={styles.demographicItem}>Age: {demographics.ageGroup}</Text>
          </View>
        </View>

        {/* Diagnosis Section */}
        <DiagnosisSectionPDF data={cancerDetails} />

        {/* Treatment Section */}
        <TreatmentSectionPDF data={treatmentPlan} />

        {/* Prognosis Section */}
        <PrognosisSectionPDF data={prognosisData} />

        {/* Prognosis Discussion - appears after form data */}
        <PrognosisDiscussion />
      </Page>
    </Document>
  );
}

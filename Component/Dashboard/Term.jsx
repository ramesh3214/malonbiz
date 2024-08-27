import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // Ensure to have @expo/vector-icons installed

const TermsAndConditions = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Terms and Conditions</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.sectionContent}>
            Welcome to Malon! By joining our platform, you're becoming part of a vibrant community where salons and customers connect seamlessly. These Terms and Conditions outline our mutual commitments and expectations to ensure a smooth and enjoyable experience for everyone involved.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Salon Listings</Text>
          <Text style={styles.sectionContent}>
            <Text style={styles.bold}>Eligibility:</Text> You must be a licensed salon or beauty professional to list your services on Malon.
            {'\n'}<Text style={styles.bold}>Accurate Information:</Text> Please ensure all details provided are accurate and up-to-date. This includes service offerings, pricing, and business hours.
            {'\n'}<Text style={styles.bold}>Quality Standards:</Text> We expect you to maintain high standards of service. Your listing must accurately represent the quality of the services you provide.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Booking and Payments</Text>
          <Text style={styles.sectionContent}>
            <Text style={styles.bold}>Booking:</Text> Customers can book services directly through our platform. Make sure to confirm and manage appointments promptly.
            {'\n'}<Text style={styles.bold}>Payments:</Text> All transactions are processed securely through our platform. We handle payments to ensure a safe experience for both parties.
            {'\n'}<Text style={styles.bold}>Refunds and Cancellations:</Text> Familiarize yourself with our cancellation policy. If a customer cancels, please handle refunds according to the agreed terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Responsibilities</Text>
          <Text style={styles.sectionContent}>
            <Text style={styles.bold}>Customer Service:</Text> Provide excellent customer service. Treat each client with respect and professionalism.
            {'\n'}<Text style={styles.bold}>Compliance:</Text> Adhere to all local regulations and laws related to salon operations.
            {'\n'}<Text style={styles.bold}>Updates:</Text> Keep your listing updated with accurate information. Notify us of any changes to your services or contact details.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Platform Usage</Text>
          <Text style={styles.sectionContent}>
            <Text style={styles.bold}>Acceptable Use:</Text> Use our platform responsibly. Avoid any actions that could harm our community or violate our policies.
            {'\n'}<Text style={styles.bold}>Content:</Text> Ensure that all content, including images and descriptions, is appropriate and does not infringe on any intellectual property rights.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Termination</Text>
          <Text style={styles.sectionContent}>
            <Text style={styles.bold}>Breach of Terms:</Text> We reserve the right to remove your listing or terminate your account if you violate these terms.
            {'\n'}<Text style={styles.bold}>Voluntary Termination:</Text> You can choose to remove your listing at any time. Please notify us in advance to ensure a smooth transition.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
          <Text style={styles.sectionContent}>
            While we strive to provide the best service, Malon is not liable for any issues arising from bookings, payments, or interactions between salons and customers. Our platform facilitates the connection, but the responsibility for service delivery lies with you.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Changes to Terms</Text>
          <Text style={styles.sectionContent}>
            We may update these Terms and Conditions from time to time. We will notify you of any significant changes. Continued use of our platform signifies your acceptance of the revised terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Contact Us</Text>
          <Text style={styles.sectionContent}>
            If you have any questions or concerns, feel free to reach out to us at contactus@malon.in. We're here to help!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#000',
  },
  backButton: {
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFCE54',
    marginBottom: 10,
  },
  sectionContent: {
    fontSize: 16,
    color: '#e0e0e0',
    lineHeight: 24,
  },
  bold: {
    fontWeight: 'bold',
    color: '#FFCE54',
  },
});

export default TermsAndConditions;

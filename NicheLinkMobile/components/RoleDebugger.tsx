import { COLORS } from '@/constants/DesignSystem';
import { useAuth } from '@/context/AuthContext';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RoleDebugger() {
  const { user, logout } = useAuth();

  const showRoleInfo = () => {
    Alert.alert(
      'User Role Info',
      `Email: ${user?.email}\nRole: ${user?.role}\nName: ${user?.firstName} ${user?.lastName}`,
      [{ text: 'OK' }]
    );
  };

  const switchToSME = async () => {
    await logout();
    Alert.alert(
      'Switch to SME', 
      'Logout successful. Please login with sme@test.com / password to test SME navigation',
      [{ text: 'OK' }]
    );
  };

  const switchToKOC = async () => {
    await logout();
    Alert.alert(
      'Switch to KOC', 
      'Logout successful. Please login with admin@nichelink.com / admin123 to test KOC navigation',
      [{ text: 'OK' }]
    );
  };

  if (!user) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Role Debug Panel</Text>
      <Text style={styles.roleText}>Current Role: {user.role}</Text>
      <Text style={styles.emailText}>Email: {user.email}</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={showRoleInfo}>
          <Text style={styles.buttonText}>Show Info</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.smeButton]} onPress={switchToSME}>
          <Text style={styles.buttonText}>Test SME</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.kocButton]} onPress={switchToKOC}>
          <Text style={styles.buttonText}>Test KOC</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary + '10',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.light.text,
    marginBottom: 4,
  },
  emailText: {
    fontSize: 12,
    color: COLORS.light.subtext,
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 2,
  },
  smeButton: {
    backgroundColor: COLORS.success,
  },
  kocButton: {
    backgroundColor: COLORS.secondary,
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

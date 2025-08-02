import { Redirect } from 'expo-router';

// This redirects /auth to /auth/login
export default function AuthIndex() {
  return <Redirect href="./login" />;
}

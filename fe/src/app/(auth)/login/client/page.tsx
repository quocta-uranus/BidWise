import LoginForm from '@/components/auth/LoginForm';

export default function ClientLoginPage() {
  return <LoginForm portal="CLIENT" registerHref="/register?role=CLIENT" />;
}

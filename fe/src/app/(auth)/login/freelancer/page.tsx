import LoginForm from '@/components/auth/LoginForm';

export default function FreelancerLoginPage() {
  return <LoginForm portal="FREELANCER" registerHref="/register?role=FREELANCER" />;
}

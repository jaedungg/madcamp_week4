import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to editor page - users will be redirected to login if not authenticated
  redirect('/editor');
}

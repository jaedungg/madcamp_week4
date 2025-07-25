import Link from 'next/link';
import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to editor page - users will be redirected to login if not authenticated
  return (
    <div className='flex w-full h-full mx-auto my-auto items-center justify-center'>
      <Link href="/signup" className="text-primary hover:underline font-medium">
        하하하하하
      </Link>
    </div>
  )
}

// llminister/app/page.tsx

// This is the server component
// We do NOT add "use client" here
// We do NOT do any store calls here
import HomeClient from './HomeClient';

export default function Page() {
  // Just return the client component
  return <HomeClient />;
}

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function BillingRequiredPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return (
    <div className="min-h-[calc(100vh-100px)] flex items-center justify-center bg-red-50">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">
          Billing Required
        </h1>
        <p className="text-gray-600 mb-8">
          Your license has been suspended. Please contact support to resume access.
        </p>
        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}

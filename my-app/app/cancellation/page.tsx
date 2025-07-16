"use client";

import SupportPageLayout from "@/components/layout/support-page-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export default function CancellationPolicyPage() {
  return (
    <SupportPageLayout
      title="Cancellation Policy"
      description="Learn about our cancellation policies and refund procedures."
      currentPath="/cancellation"
    >
      <section className="mb-8">
        <p className="mb-4">
          At Baithaka Ghar, we understand that plans can change. Our
          cancellation policy is designed to be fair to both guests and hosts.
          The specific cancellation terms for each property are clearly
          displayed on the property listing page before you book.
        </p>

        <Alert className="my-6">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> Due to the COVID-19 pandemic, we have
            implemented more flexible cancellation options in certain
            circumstances. Please contact our support team for more details.
          </AlertDescription>
        </Alert>

        <h2 className="text-xl font-semibold text-darkGreen mt-8 mb-4">
          Cancellation Types
        </h2>
        <p className="mb-4">
          We offer three standard cancellation policies. The applicable policy
          for your booking will be clearly indicated during the booking process:
        </p>

        <Table className="mb-8">
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/4">Policy Type</TableHead>
              <TableHead className="w-2/4">Conditions</TableHead>
              <TableHead className="w-1/4">Refund</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Flexible</TableCell>
              <TableCell>Cancelled at least 24 hours before check-in</TableCell>
              <TableCell>Full refund</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Moderate</TableCell>
              <TableCell>Cancelled at least 5 days before check-in</TableCell>
              <TableCell>Full refund</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Strict</TableCell>
              <TableCell>Cancelled at least 7 days before check-in</TableCell>
              <TableCell>50% refund</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <h2 className="text-xl font-semibold text-darkGreen mt-8 mb-4">
          How to Cancel a Booking
        </h2>
        <ol className="list-decimal pl-5 space-y-3 mb-6">
          <li>Log in to your Baithaka Ghar account</li>
          <li>Navigate to "My Bookings" in your account dashboard</li>
          <li>Find the booking you wish to cancel</li>
          <li>Click the "Cancel Booking" button</li>
          <li>Follow the prompts to complete the cancellation</li>
        </ol>

        <p className="mb-4">
          After your cancellation is processed, you'll receive an email
          confirmation with details about any applicable refund. Refunds are
          typically processed within 5-7 business days, depending on your
          payment method.
        </p>

        <h2 className="text-xl font-semibold text-darkGreen mt-8 mb-4">
          Extenuating Circumstances
        </h2>
        <p className="mb-4">
          In certain exceptional situations, we may be able to offer a more
          flexible cancellation option. These include:
        </p>
        <ul className="list-disc pl-5 mb-6 space-y-2">
          <li>Unexpected serious illness or injury</li>
          <li>Death of a traveler, host, or immediate family member</li>
          <li>Natural disasters or severe weather events</li>
          <li>Government-issued travel restrictions or emergencies</li>
          <li>Significant property damage or maintenance issues</li>
        </ul>

        <p>
          If you believe your situation qualifies for consideration under our
          extenuating circumstances policy, please contact our customer support
          team as soon as possible with relevant documentation.
        </p>
      </section>

      <section className="mt-8 p-4 bg-lightGreen/10 rounded-lg">
        <h2 className="text-lg font-semibold text-darkGreen mb-3">
          Need Further Assistance?
        </h2>
        <p className="mb-4">
          If you have any questions about our cancellation policy or need help
          cancelling a reservation, please don't hesitate to contact our support
          team at{" "}
          <a
            href="mailto:support@baithakaghar.com"
            className="text-lightGreen hover:underline"
          >
            support@baithakaghar.com
          </a>{" "}
          or call +91 9356547176 or +91 9936712614.
        </p>
      </section>
    </SupportPageLayout>
  );
}

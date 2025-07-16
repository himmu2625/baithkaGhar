"use client";

import SupportPageLayout from "@/components/layout/support-page-layout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function HelpCenterPage() {
  return (
    <SupportPageLayout
      title="Help Center"
      description="Find answers to common questions and get support for your Baithaka Ghar experience."
      currentPath="/help"
    >
      <section className="mb-8">
        <p className="mb-4">
          Welcome to the Baithaka Ghar Help Center! We're here to assist you
          with any questions or concerns you may have about using our platform.
          Browse through our frequently asked questions or contact our support
          team for personalized assistance.
        </p>

        <h2 className="text-xl font-semibold text-darkGreen mt-6 mb-3">
          Frequently Asked Questions
        </h2>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="booking">
            <AccordionTrigger>How do I book a property?</AccordionTrigger>
            <AccordionContent>
              <p>
                Booking a property on Baithaka Ghar is easy. Simply search for
                your desired location, browse through available properties,
                select your check-in and check-out dates, and click "Book Now."
                You'll be guided through the payment process, and once
                confirmed, you'll receive booking details via email.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="payment">
            <AccordionTrigger>
              What payment methods are accepted?
            </AccordionTrigger>
            <AccordionContent>
              <p>Baithaka Ghar accepts multiple payment methods, including:</p>
              <ul className="list-disc pl-5 mt-2">
                <li>
                  Credit and debit cards (Visa, MasterCard, American Express)
                </li>
                <li>UPI payments</li>
                <li>Net banking</li>
                <li>Digital wallets</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="cancellation">
            <AccordionTrigger>
              What is your cancellation policy?
            </AccordionTrigger>
            <AccordionContent>
              <p>
                Cancellation policies vary depending on the property. Each
                property listing clearly displays its cancellation policy, which
                can typically be:
              </p>
              <ul className="list-disc pl-5 mt-2">
                <li>
                  <strong>Flexible:</strong> Full refund if cancelled at least
                  24 hours before check-in
                </li>
                <li>
                  <strong>Moderate:</strong> Full refund if cancelled at least 5
                  days before check-in
                </li>
                <li>
                  <strong>Strict:</strong> 50% refund if cancelled at least 7
                  days before check-in
                </li>
              </ul>
              <p className="mt-2">
                For more details, please visit our{" "}
                <a
                  href="/cancellation"
                  className="text-lightGreen hover:underline"
                >
                  Cancellation Policy
                </a>{" "}
                page.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="host">
            <AccordionTrigger>How do I become a host?</AccordionTrigger>
            <AccordionContent>
              <p>
                To become a host on Baithaka Ghar, click on "List Your Property"
                in the navigation menu. You'll need to create an account if you
                don't have one already, then follow the step-by-step process to
                list your property. You'll provide details about your property,
                upload photos, set pricing, and choose your availability.
              </p>
              <p className="mt-2">
                Our team will review your listing before it goes live, and we're
                available to assist you throughout the process.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="account">
            <AccordionTrigger>How do I manage my account?</AccordionTrigger>
            <AccordionContent>
              <p>
                You can manage your account by logging in and clicking on your
                profile icon in the top-right corner. From there, you can access
                your profile settings, booking history, saved properties, and
                account preferences. You can update your personal information,
                change your password, and manage your payment methods.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-darkGreen mb-4">
          Contact Support
        </h2>
        <p className="mb-4">
          Can't find what you're looking for? Our customer support team is
          available to help you 24/7.
        </p>

        <div className="flex flex-col gap-4 md:flex-row">
          <div className="bg-lightGreen/10 p-4 rounded-lg flex-1">
            <h3 className="font-medium text-darkGreen mb-2">Email Support</h3>
            <p className="text-sm">support@baithakaghar.com</p>
            <p className="text-xs text-gray-500 mt-1">
              Response within 24 hours
            </p>
          </div>

          <div className="bg-lightGreen/10 p-4 rounded-lg flex-1">
            <h3 className="font-medium text-darkGreen mb-2">Phone Support</h3>
            <div className="space-y-1">
              <p className="text-sm">+91 9356547176</p>
              <p className="text-sm">+91 9936712614</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">10:00 AM - 7:00 PM IST</p>
          </div>
        </div>
      </section>
    </SupportPageLayout>
  );
}

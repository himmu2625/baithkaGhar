"use client";

import SupportPageLayout from "@/components/layout/support-page-layout";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Shield,
  PaintBucket,
  Search,
  ArrowUpRight,
} from "lucide-react";

export default function AccessibilityPage() {
  return (
    <SupportPageLayout
      title="Accessibility"
      description="Learn about our commitment to accessibility and find accommodations that meet your needs."
      currentPath="/accessibility"
    >
      <section className="mb-8">
        <p className="mb-6">
          At Baithaka Ghar, we believe that comfortable accommodations should be
          accessible to everyone. We're committed to improving accessibility
          across our platform and properties to ensure all guests can find and
          enjoy stays that meet their needs.
        </p>

        <div className="bg-lightGreen/10 p-6 rounded-lg mb-8 flex flex-col md:flex-row items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-lightGreen/20 flex items-center justify-center">
            <Shield className="h-8 w-8 text-lightGreen" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-darkGreen mb-2">
              Finding Accessible Accommodations
            </h2>
            <p className="text-sm mb-3">
              We've implemented filters to help you find properties with
              accessibility features. Look for the "Accessibility features"
              filter when searching for accommodations.
            </p>
            <Button className="bg-lightGreen hover:bg-lightGreen/80 text-darkGreen flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span>Search Accessible Stays</span>
              <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-darkGreen mt-8 mb-4">
          Our Accessibility Features
        </h2>

        <p className="mb-4">
          Properties with accessibility features will clearly indicate which of
          the following amenities they offer:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-darkGreen mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-lightGreen" />
              Entrance and Interior
            </h3>
            <ul className="list-disc pl-5 text-sm space-y-2">
              <li>Step-free entrance to the building</li>
              <li>Wider doorways (at least 32 inches)</li>
              <li>Step-free path to the entrance</li>
              <li>Well-lit entrance</li>
              <li>Elevator access (if multi-floor building)</li>
              <li>Accessible height bed</li>
              <li>Wide clearance to bed</li>
            </ul>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-darkGreen mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-lightGreen" />
              Bathroom
            </h3>
            <ul className="list-disc pl-5 text-sm space-y-2">
              <li>Step-free shower</li>
              <li>Shower chair</li>
              <li>Grab bars in bathroom</li>
              <li>Accessible-height toilet</li>
              <li>Wide clearance to shower and toilet</li>
              <li>Roll-in shower with chair</li>
              <li>Bath with grab bars</li>
            </ul>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-darkGreen mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-lightGreen" />
              Common Areas and Parking
            </h3>
            <ul className="list-disc pl-5 text-sm space-y-2">
              <li>Accessible parking spot</li>
              <li>Step-free access to common areas</li>
              <li>Pool hoist or ramp</li>
              <li>Accessible height table/desk</li>
              <li>Wide paths around the property</li>
            </ul>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-darkGreen mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-lightGreen" />
              Communication Features
            </h3>
            <ul className="list-disc pl-5 text-sm space-y-2">
              <li>Visual fire alarm</li>
              <li>Visual doorbell</li>
              <li>Braille signage</li>
              <li>Audio descriptions</li>
              <li>Document accessibility</li>
            </ul>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-darkGreen mt-8 mb-4">
          Our Accessibility Commitment
        </h2>

        <div className="space-y-4 mb-8">
          <div className="flex gap-3">
            <PaintBucket className="h-5 w-5 text-lightGreen flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium text-darkGreen">
                Website Accessibility
              </h3>
              <p className="text-sm mt-1">
                We are committed to maintaining a website that is accessible to
                all users. Our site follows WCAG 2.1 guidelines and is regularly
                tested for accessibility compliance.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <PaintBucket className="h-5 w-5 text-lightGreen flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium text-darkGreen">
                Property Verification
              </h3>
              <p className="text-sm mt-1">
                Properties that list accessibility features are required to
                provide photos and details of these features, which are reviewed
                by our team.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <PaintBucket className="h-5 w-5 text-lightGreen flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium text-darkGreen">
                Continuous Improvement
              </h3>
              <p className="text-sm mt-1">
                We're continuously working to improve accessibility across our
                platform and properties. We welcome feedback from users to help
                us identify areas for improvement.
              </p>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-darkGreen mt-8 mb-4">
          Special Accommodation Requests
        </h2>

        <p className="mb-4">
          If you have specific accessibility needs that aren't addressed in our
          standard filters, please contact our accessibility team. We'll do our
          best to help you find accommodations that meet your requirements.
        </p>

        <div className="bg-lightGreen/10 p-4 rounded-lg">
          <h3 className="font-medium text-darkGreen mb-2">
            Contact Our Accessibility Team
          </h3>
          <p className="text-sm mb-2">
            Email:{" "}
            <a
              href="mailto:accessibility@baithakaghar.com"
              className="text-lightGreen hover:underline"
            >
              accessibility@baithakaghar.com
            </a>
          </p>
          <p className="text-sm mb-2">
            Phone: +91 9356547176 (Mon-Fri, 9am-6pm IST)
          </p>
          <p className="text-xs text-gray-500">
            Please allow up to 48 hours for a response.
          </p>
        </div>
      </section>

      <section className="mt-8 p-4 border border-lightGreen/20 rounded-lg">
        <h2 className="text-lg font-semibold text-darkGreen mb-3">
          Accessibility Feedback
        </h2>
        <p className="text-sm mb-4">
          We value your feedback on our accessibility features and services. If
          you have suggestions for how we can improve, please share them with
          us.
        </p>
        <Button className="bg-mediumGreen hover:bg-mediumGreen/80 text-lightYellow">
          Submit Feedback
        </Button>
      </section>
    </SupportPageLayout>
  );
}

"use client";

import SupportPageLayout from "@/components/layout/support-page-layout";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  AlertTriangle,
  Heart,
  Phone,
  KeyRound,
  MapPin,
  AlertCircle,
} from "lucide-react";

export default function SafetyResourcesPage() {
  return (
    <SupportPageLayout
      title="Safety Resources"
      description="Your safety is our priority. Learn about our safety measures and guidelines."
      currentPath="/safety"
    >
      <section className="mb-8">
        <p className="mb-6">
          At Baithaka Ghar, we are committed to creating a safe and secure
          environment for both our guests and hosts. We've implemented various
          safety measures and guidelines to ensure your peace of mind during
          your stay.
        </p>

        <h2 className="text-xl font-semibold text-darkGreen mt-8 mb-4">
          Our Safety Commitments
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="h-5 w-5 text-lightGreen" />
                <h3 className="font-semibold text-darkGreen">
                  Property Verification
                </h3>
              </div>
              <p className="text-sm">
                All properties listed on our platform go through a verification
                process to ensure they meet our safety and quality standards.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <Heart className="h-5 w-5 text-lightGreen" />
                <h3 className="font-semibold text-darkGreen">
                  Health Protocols
                </h3>
              </div>
              <p className="text-sm">
                We implement enhanced cleaning and disinfection protocols at all
                our properties to ensure the health and safety of our guests.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <KeyRound className="h-5 w-5 text-lightGreen" />
                <h3 className="font-semibold text-darkGreen">Secure Access</h3>
              </div>
              <p className="text-sm">
                All properties must have secure entry systems, and our hosts are
                required to use secure key handover procedures or digital access
                systems.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <Phone className="h-5 w-5 text-lightGreen" />
                <h3 className="font-semibold text-darkGreen">24/7 Support</h3>
              </div>
              <p className="text-sm">
                Our customer support team is available 24/7 to assist with any
                safety concerns or emergencies that may arise during your stay.
              </p>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-xl font-semibold text-darkGreen mt-8 mb-4">
          Safety Guidelines for Guests
        </h2>

        <div className="space-y-4 mb-8">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-lightGreen flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium text-darkGreen">
                Read Property Descriptions Carefully
              </h3>
              <p className="text-sm mt-1">
                Pay attention to the property details, including safety
                features, house rules, and any special instructions from the
                host.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-lightGreen flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium text-darkGreen">
                Verify Safety Equipment
              </h3>
              <p className="text-sm mt-1">
                Upon arrival, locate smoke detectors, fire extinguishers, and
                emergency exits in the property.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-lightGreen flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium text-darkGreen">
                Secure Your Belongings
              </h3>
              <p className="text-sm mt-1">
                Use safes when available and ensure doors and windows are locked
                when leaving the property.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-lightGreen flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium text-darkGreen">
                Be Aware of Local Emergency Numbers
              </h3>
              <p className="text-sm mt-1">
                Save important local emergency numbers and the address of your
                accommodation.
              </p>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-darkGreen mt-8 mb-4">
          Emergency Contacts
        </h2>

        <div className="bg-red-50 p-4 rounded-lg mb-8">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <h3 className="font-semibold text-red-700">In case of emergency</h3>
          </div>

          <ul className="space-y-2 text-sm">
            <li>
              <strong>All Emergencies:</strong> 112 (National Emergency Number)
            </li>
            <li>
              <strong>Police:</strong> 100
            </li>
            <li>
              <strong>Ambulance:</strong> 108
            </li>
            <li>
              <strong>Fire Department:</strong> 101
            </li>
            <li>
              <strong>Women's Helpline:</strong> 1091
            </li>
            <li>
              <strong>Tourist Police:</strong> 1363
            </li>
            <li>
              <strong>Baithaka Ghar 24/7 Emergency Support:</strong> +91
              9356547176
            </li>
          </ul>
        </div>

        <h2 className="text-xl font-semibold text-darkGreen mt-8 mb-4">
          Neighborhood Safety Tips
        </h2>

        <div className="space-y-4">
          <div className="flex gap-3">
            <MapPin className="h-5 w-5 text-lightGreen flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium text-darkGreen">
                Research Your Destination
              </h3>
              <p className="text-sm mt-1">
                Before traveling, research the neighborhood and surrounding
                areas to understand local safety conditions.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <MapPin className="h-5 w-5 text-lightGreen flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium text-darkGreen">
                Use Safe Transportation
              </h3>
              <p className="text-sm mt-1">
                Use licensed taxis or reputable rideshare services, especially
                when traveling at night.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <MapPin className="h-5 w-5 text-lightGreen flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium text-darkGreen">
                Keep Important Documents Safe
              </h3>
              <p className="text-sm mt-1">
                Store copies of your ID, passport, and other important documents
                securely, both digitally and physically.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="p-4 bg-lightGreen/10 rounded-lg mt-8">
        <h3 className="font-semibold text-darkGreen mb-2">
          Report a Safety Concern
        </h3>
        <p className="text-sm mb-3">
          If you encounter any safety issues during your stay, please contact
          our safety team immediately at{" "}
          <a
            href="mailto:safety@baithakaghar.com"
            className="text-lightGreen hover:underline"
          >
            safety@baithakaghar.com
          </a>{" "}
          or call our 24/7 helpline at +91 9356547176.
        </p>
        <p className="text-xs text-gray-500">
          Your safety is our top priority, and we take all reports seriously.
        </p>
      </section>
    </SupportPageLayout>
  );
}

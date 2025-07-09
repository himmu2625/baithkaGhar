'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { HelpCircle, MessageCircle } from 'lucide-react';

const faqs = [
  {
    question: 'What are the eligibility requirements to join?',
    answer: 'We welcome creators of all sizes! While we don\'t have a strict follower count, we look for high-quality content, an engaged audience, and a passion for travel that aligns with our brand. We review each application individually.'
  },
  {
    question: 'How does the commission structure work?',
    answer: 'You will receive a unique referral link. For every booking made through your link, you will earn a commission based on the total booking value. Commissions are tracked in your partner dashboard and paid out monthly.'
  },
  {
    question: 'Are there any costs to join the program?',
    answer: 'No, our partnership program is completely free to join. There are no hidden fees or startup costs. We believe in investing in our partners, not charging them.'
  },
  {
    question: 'How do I get selected for free stays?',
    answer: 'Free stays are offered to our top-performing and most engaged partners. Consistent performance, high-quality content, and strong audience engagement are key factors we consider for these exclusive opportunities.'
  },
  {
    question: 'How and when do I get paid?',
    answer: 'Payouts are processed automatically every month via direct bank transfer or UPI. You can track your earnings and upcoming payouts in your partner dashboard. The minimum payout threshold is ₹1000.'
  },
  {
    question: 'What kind of support do you offer to partners?',
    answer: 'We provide dedicated support through a partnership manager. You will also get access to marketing materials, content guidelines, and regular updates on new properties and promotions to help you maximize your earnings.'
  },
];

const FAQSection = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
          Frequently Asked{' '}
          <span className="text-darkGreen">
            Questions
          </span>
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Got questions about our influencer partnership program? 
          We've got answers! Find everything you need to know below.
        </p>
      </div>

      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
        <div className="p-8">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 transition-colors text-left">
                  <div className="flex items-start gap-3">
                     <HelpCircle className="w-5 h-5 text-darkGreen mt-0.5 flex-shrink-0" />
                    <span className="font-semibold text-gray-900">
                      {faq.question}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 pt-2">
                  <div className="pl-8 text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Card>

      {/* Contact Support */}
      <div className="mt-12 text-center">
        <Card className="p-8 border-0 bg-gradient-to-r from-gray-50 to-teal-50">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-darkGreen/10 rounded-full flex items-center justify-center mx-auto">
              <MessageCircle className="w-8 h-8 text-darkGreen" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900">
              Still have questions?
            </h3>
            
            <p className="text-gray-600 max-w-lg mx-auto">
              Our partnership team is here to help! Reach out to us for any questions 
              about the program, technical support, or collaboration opportunities.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
              <a
                href="mailto:partnerships@baithakaghar.com"
                className="inline-flex items-center justify-center px-6 py-3 bg-darkGreen text-white rounded-lg hover:bg-darkGreen/90 transition-colors"
              >
                Email Support
              </a>
              <a
                href="https://wa.me/1234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                WhatsApp Chat
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FAQSection; 
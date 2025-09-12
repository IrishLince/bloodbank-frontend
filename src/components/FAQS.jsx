import React, { useState } from 'react';
import Header from './Header';

const FAQItem = ({ question, answer, number }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAnswer = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="mb-6 pb-4">
      <Header />
      <div
        className="bg-white p-4 rounded-xl shadow-md mx-auto"
        style={{ transition: 'all 0.3s ease', maxWidth: '700px' }}
      >
        <div className="flex justify-between items-center cursor-pointer text-lg font-semibold">
          <div className="flex items-center">
            <span className="font-bold text-black">{number}.</span>
            <span className="ml-2">{question}</span>
          </div>
          <span
            className={`transform transition-transform text-2xl font-bold ${isOpen ? 'rotate-180 scale-110' : 'rotate-0'}`}
            onClick={toggleAnswer}
          >
            {isOpen ? '–' : '+'}
          </span>
        </div>
        {isOpen && (
          <div className="mt-2 text-left text-black p-4">
            <p>{answer}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const FAQs = () => {
  const faqData = [
    {
      question: "What is RedSource?",
      answer: "RedSource is an online platform that helps manage blood donations efficiently. It allows users to request blood, track donations, and access important information about blood inventory. Our goal is to ensure that blood is always available when needed for patients in hospitals."
    },
    {
      question: "How can I donate blood through RedSource?",
      answer: "To donate blood, simply sign up on our platform and schedule an appointment at a nearby donation center. You can select a donation center, fill up the eligibility check, and choose the time that works best for you. Once your donation is complete, we'll update the blood inventory in real-time."
    },
    {
      question: "Who can request blood through RedSource?",
      answer: "Hospitals, clinics, and other medical facilities can request blood through RedSource. To place a request, users need to provide details like the type of blood needed, the amount, and the date it is required. Our system ensures that hospitals receive the necessary blood in a timely manner."
    },
    {
      question: "How is my privacy protected when using RedSource?",
      answer: "We take your privacy seriously at RedSource. All your personal information is stored securely and is only used for the purpose of managing donations and requests. We comply with all data protection regulations to ensure your data is safe."
    },
    {
      question: "Can I track my donation after donating blood?",
      answer: "Yes, RedSource allows donors to track their blood donation. After donating, you can see when and where your blood was used and follow the impact it has made. We update our inventory and donation status regularly so you can stay informed."
    }
  ];

  return (
    <section id="faq" className="py-12 bg-[#FFF2F2]">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold text-[#A40113] mb-4">FAQs</h2>
        <h3 className="text-2xl font-semibold text-[#C91C1C] mb-8">Frequently Asked Questions</h3>
      </div>

      <div className="container mx-auto px-4">
        {faqData.map((faq, index) => (
          <FAQItem
            key={index}
            question={faq.question}
            answer={faq.answer}
            number={index + 1}
          />
        ))}
      </div>
    </section>
  );
};

export default FAQs;
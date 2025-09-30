import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import { 
  Heart, 
  Users, 
  Clock, 
  Phone,
  Mail,
  MapPin,
  Calendar,
  ChevronRight,
  Check,
  Star,
  Menu,
  X,
  Droplet,
  Activity,
  AlertCircle
} from 'lucide-react';
import donationFacilityImage from '../assets/donation-facility.jpg';

// Animation variants
const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  // Navigation items
  const navigation = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Services', href: '#services' },
    { name: 'Testimonials', href: '#testimonials' },
    { name: 'Contact', href: '#contact' },
  ];

  // Services data
  const services = [
    {
      icon: Heart,
      title: 'Blood Donation',
      description: 'Safe and comfortable donation process with professional medical staff.'
    },
    {
      icon: Users,
      title: 'Blood Request',
      description: 'Emergency and planned blood requests handled with utmost priority.'
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Round-the-clock assistance for all blood-related emergencies.'
    },
    {
      icon: Calendar,
      title: 'Appointment Booking',
      description: 'Easy online scheduling for donations and consultations.'
    }
  ];

  // Testimonials data
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Regular Donor',
      image: 'https://randomuser.me/api/portraits/women/1.jpg',
      quote: 'The donation process was smooth and the staff was incredibly professional. I\'m proud to be a regular donor here.'
    },
    {
      name: 'Dr. Michael Chen',
      role: 'Hospital Partner',
      image: 'https://randomuser.me/api/portraits/men/1.jpg',
      quote: 'Their quick response time and efficient blood management system has helped save countless lives.'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Blood Recipient',
      image: 'https://randomuser.me/api/portraits/women/2.jpg',
      quote: 'I received blood during my emergency surgery. I\'m forever grateful to the donors and this blood bank.'
    }
  ];

  // Blood type statistics
  const bloodStats = [
    { type: 'A+', level: 75, donors: '1.2K' },
    { type: 'B+', level: 45, donors: '850' },
    { type: 'O+', level: 90, donors: '2K' },
    { type: 'AB+', level: 30, donors: '300' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header/Navigation */}
      <header className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <span className="text-2xl font-bold text-red-600">LifeBank</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-8">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-gray-600 hover:text-red-600 transition-colors duration-200 font-medium"
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="text-gray-600 hover:text-red-600"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Navigation Dialog */}
      <Dialog
        as="div"
        className="fixed inset-0 z-50 md:hidden"
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
      >
        <Dialog.Overlay className="fixed inset-0 bg-black/25" />
        <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-red-600">LifeBank</span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="mt-8">
            <div className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-600 hover:text-red-600 transition-colors duration-200 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </Dialog>

      {/* Enhanced Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50 z-10" />
          <img 
            src={donationFacilityImage}
            alt="Blood Donation Facility"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Floating Blood Drops */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              animate={{
                y: [0, -20, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.4,
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            >
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-red-500/30 to-red-600/30 backdrop-blur-sm" />
            </motion.div>
          ))}
        </div>

        {/* Hero Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-30">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className="text-white"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-6">
                Donate Blood,
                <span className="text-red-500"> Save Lives</span>
              </h1>
              <p className="text-xl text-gray-200 mb-8 leading-relaxed">
                When you donate blood, you're not just donating a pint;
                you're giving someone a chance to live, recover, and continue to make memories.
              </p>
              <p className="text-2xl font-semibold text-red-400 mb-12">
                It's a gift that lasts a lifetime.
              </p>
              <div className="flex flex-wrap gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-red-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-red-700 transition-colors duration-200 flex items-center justify-center shadow-lg"
                >
                  DONATE NOW
                  <ChevronRight className="ml-2 h-5 w-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white/10 backdrop-blur-md text-white border-2 border-white/20 px-8 py-4 rounded-full font-semibold hover:bg-white/20 transition-colors duration-200"
                >
                  Learn More
                </motion.button>
              </div>
            </motion.div>

            {/* Blood Type Stats */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20"
            >
              <h3 className="text-2xl font-bold text-white mb-6">Blood Inventory Status</h3>
              <div className="grid grid-cols-2 gap-6">
                {bloodStats.map(({ type, level, donors }) => (
                  <div key={type} className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-white">{type}</span>
                      <span className="text-sm text-red-400">{donors} donors</span>
                    </div>
                    <div className="relative h-2 bg-white/20 rounded-full mb-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${level}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className={`absolute h-full rounded-full ${
                          level > 70 ? 'bg-green-500' : level > 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">{level}% Available</span>
                      <span className={`${
                        level > 70 ? 'text-green-400' : level > 40 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {level > 70 ? 'Good' : level > 40 ? 'Moderate' : 'Critical'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Emergency Alert */}
              <div className="mt-6 bg-red-500/20 rounded-xl p-4 flex items-center">
                <AlertCircle className="h-6 w-6 text-red-400 mr-3" />
                <div>
                  <h4 className="text-white font-semibold">Urgent Need</h4>
                  <p className="text-gray-300 text-sm">Critical shortage of O+ blood type. Your donation can save lives.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30"
          animate={{
            y: [0, 10, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2" />
          </div>
        </motion.div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We provide comprehensive blood banking services with the highest standards of safety and care.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {services.map((service, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200"
                variants={fadeIn}
              >
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-6">
                  <service.icon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-600">
                  {service.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              What People Say
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Read about the experiences of our donors and recipients.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg"
                variants={fadeIn}
              >
                <div className="flex items-center mb-6">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {testimonial.name}
                    </h4>
                    <p className="text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">"{testimonial.quote}"</p>
                <div className="flex mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="max-w-4xl mx-auto"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Get in Touch
              </h2>
              <p className="text-gray-600">
                Have questions? We're here to help and provide support.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-xl font-semibold mb-6">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-red-600 mr-3" />
                    <span className="text-gray-600">+1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-red-600 mr-3" />
                    <span className="text-gray-600">contact@lifebank.com</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-red-600 mr-3" />
                    <span className="text-gray-600">123 Medical Center Dr, City, State</span>
                  </div>
                </div>
              </div>

              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors duration-200"
                >
                  Send Message
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-red-500 mb-4">LifeBank</h3>
              <p className="text-gray-400">
                Committed to saving lives through safe and efficient blood banking services.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      className="text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <ul className="space-y-2">
                {services.map((service) => (
                  <li key={service.title}>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      {service.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Connect With Us</h4>
              <div className="flex space-x-4">
                {/* Add social media icons/links here */}
              </div>
              <p className="mt-4 text-gray-400">
                Subscribe to our newsletter for updates and news.
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} LifeBank. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 
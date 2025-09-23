import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTheme } from './ThemeProvider';
import { FiGithub, FiTwitter, FiLinkedin, FiMail, FiHeart } from 'react-icons/fi';

const Footer: React.FC = () => {
  const { isDark } = useTheme();

  const footerLinks = {
    product: [
      { label: 'Assessment', href: '/assess' },
      { label: 'Rainfall Prediction', href: '/predict' },
      { label: 'Visualization', href: '/dashboard' },
      { label: 'Subsidy', href: '/subsidy' }
    ],
    company: [
      { label: 'About Us', href: '#about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' }
    ],
    resources: [
      { label: 'Documentation', href: '/docs' },
      { label: 'API Reference', href: '/api' },
      { label: 'Help Center', href: '/help' },
      { label: 'Community', href: '/community' }
    ]
  };

  const socialLinks = [
    { icon: FiGithub, href: 'https://github.com', label: 'GitHub' },
    { icon: FiTwitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: FiLinkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: FiMail, href: 'mailto:contact@rtrwh.com', label: 'Email' }
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className={`relative border-t ${
      isDark 
        ? 'bg-slate-900/95 border-slate-800/50' 
        : 'bg-white/95 border-slate-200/50'
    } backdrop-blur-sm`}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 mb-4">
              <motion.span
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent"
                animate={{ 
                  backgroundPosition: ['0%', '100%', '0%']
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  backgroundSize: '200% 200%'
                }}
              >
                RTRWH
              </motion.span>
            </div>
            <p className={`text-sm leading-relaxed mb-4 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Roof-Top Rainwater Harvesting Assessment Platform. 
              Empowering communities with AI-powered water management solutions.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isDark 
                        ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-slate-200' 
                        : 'bg-slate-100/50 hover:bg-slate-200/50 text-slate-600 hover:text-slate-800'
                    }`}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    aria-label={social.label}
                  >
                    <Icon className="w-4 h-4" />
                  </motion.a>
                );
              })}
            </div>
          </motion.div>

          {/* Product Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h3 className={`font-semibold mb-4 ${
              isDark ? 'text-slate-200' : 'text-slate-900'
            }`}>
              Product
            </h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link, index) => (
                <motion.li
                  key={link.label}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: true }}
                >
                  <Link
                    to={link.href}
                    className={`text-sm transition-colors duration-200 hover:text-blue-500 ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Company Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className={`font-semibold mb-4 ${
              isDark ? 'text-slate-200' : 'text-slate-900'
            }`}>
              Company
            </h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link, index) => (
                <motion.li
                  key={link.label}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: true }}
                >
                  <Link
                    to={link.href}
                    className={`text-sm transition-colors duration-200 hover:text-blue-500 ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Resources Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h3 className={`font-semibold mb-4 ${
              isDark ? 'text-slate-200' : 'text-slate-900'
            }`}>
              Resources
            </h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link, index) => (
                <motion.li
                  key={link.label}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: true }}
                >
                  <Link
                    to={link.href}
                    className={`text-sm transition-colors duration-200 hover:text-blue-500 ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div
          className={`mt-12 pt-8 border-t ${
            isDark ? 'border-slate-800/50' : 'border-slate-200/50'
          }`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className={`text-sm ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              © 2024 RTRWH. All rights reserved. Made with{' '}
              <motion.span
                className="inline-block text-red-500"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <FiHeart className="inline w-3 h-3" />
              </motion.span>{' '}
              for water conservation.
            </div>
            
            <motion.button
              onClick={scrollToTop}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isDark 
                  ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300' 
                  : 'bg-slate-100/50 hover:bg-slate-200/50 text-slate-600'
              }`}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Back to top</span>
              <motion.span
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ↑
              </motion.span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;

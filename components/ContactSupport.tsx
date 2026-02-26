import React, { useState } from 'react';
import { Mail, ArrowLeft, Send, Phone, MapPin } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const ContactSupport: React.FC<Props> = ({ onBack }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold mb-8">
          <ArrowLeft size={20} /> Back to Home
        </button>
        
        <div className="flex items-center gap-3 mb-8">
          <Mail className="text-blue-600 w-10 h-10" />
          <h1 className="text-3xl md:text-4xl font-extrabold">Contact Support</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Have a question or need assistance? Our support team is here to help you 24/7.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Email Us</h3>
                  <p className="text-gray-500 dark:text-gray-400">support@ydtechpro.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Call Us</h3>
                  <p className="text-gray-500 dark:text-gray-400">+91 123 456 7890</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Visit Us</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    123 Tech Park, Ludhiana,<br />
                    Punjab, India 141001
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-slate-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg">
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                <p className="text-gray-500">We'll get back to you shortly.</p>
                <button onClick={() => setSubmitted(false)} className="mt-6 text-blue-600 font-bold hover:underline">
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Email</label>
                  <input 
                    type="email" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Subject</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.subject}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Message</label>
                  <textarea 
                    required
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                  ></textarea>
                </div>
                <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                  <Send size={18} /> Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSupport;

import React from 'react';
import { useForm } from 'react-hook-form';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { IoMailOutline, IoCallOutline, IoLocationOutline } from 'react-icons/io5';

const ContactPage = () => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    // Simulate contact message API endpoint
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast.success('Your message has been sent. Our team will contact you shortly.');
    reset();
  };

  return (
    <div className="py-16 sm:py-24 bg-slate-50/30 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Title */}
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full">Get In Touch</span>
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-slate-900 leading-none">
            We'd Love To Hear From You
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Have questions about group licenses or custom course schedules? Fill out the form.
          </p>
        </div>

        {/* Contact Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Info Details */}
          <div className="lg:col-span-5 space-y-6">
            <Card hover={false} className="border border-slate-100 p-8 space-y-8 bg-white">
              <div>
                <h3 className="text-lg font-heading font-bold text-slate-800">Support Information</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Reach out directly through email, phone, or stop by our headquarters office.</p>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="p-3 rounded-xl bg-primary-50 text-primary-600">
                    <IoMailOutline size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700">Email Address</h4>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">support@lmssaas.com</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="p-3 rounded-xl bg-primary-50 text-primary-600">
                    <IoCallOutline size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700">Phone Support</h4>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">+1 (800) 123-4567</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="p-3 rounded-xl bg-primary-50 text-primary-600">
                    <IoLocationOutline size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700">Office Location</h4>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">100 Technology Dr, Suite 500, San Francisco, CA</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Form */}
          <div className="lg:col-span-7">
            <Card hover={false} className="border border-slate-100 p-8 bg-white">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    required={true}
                    placeholder="Jane Doe"
                    error={errors.name?.message}
                    {...register('name', { required: 'Name is required' })}
                  />
                  <Input
                    label="Email Address"
                    required={true}
                    type="email"
                    placeholder="jane@example.com"
                    error={errors.email?.message}
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                    })}
                  />
                </div>

                <Input
                  label="Subject"
                  required={true}
                  placeholder="How can we help you?"
                  error={errors.subject?.message}
                  {...register('subject', { required: 'Subject is required' })}
                />

                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-xs font-semibold text-slate-700 tracking-wide">
                    Your Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Write details of your query..."
                    className={`w-full px-4 py-2.5 text-sm bg-white border rounded-lg transition-all duration-200 outline-none
                      ${errors.message 
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                        : 'border-slate-200 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10'
                      }
                      text-slate-800 placeholder-slate-400 font-sans`}
                    {...register('message', { required: 'Message body is required' })}
                  />
                  {errors.message && (
                    <p className="text-xs text-red-500 font-medium mt-0.5">{errors.message.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full sm:w-auto"
                  isLoading={isSubmitting}
                >
                  Send Message
                </Button>
              </form>
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ContactPage;

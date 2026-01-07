import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router'
import emailjs from '@emailjs/browser'
import { useAuth } from '/public/ctx/FirebaseAuth'


import { Field, Label, Switch } from '@headlessui/react'

export default function About() {
    const [agreed, setAgreed] = useState(false)
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const { user, isAuthenticated } = useAuth(); //! auth ctx
    const [formData, setFormData] = useState({
        title: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        message: "",
    });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});


    const validateField = (name, value) => {
        const errorMessage = validators[name]?.(value) || "";
        setErrors(prev => ({
            ...prev,
            [name]: errorMessage,
        }));
    };

    const handleChange = (e) => {
    const { name, value } = e.target;

        setFormData(prev => ({
        ...prev,
        [name]: value,
    }));

    validateField(name, value);
    };

    const validators = {
        title: (v) => {
          if (!v) return "Title is required";
          if (v.length < 3) return "Title must be at least 3 characters";
          if (v.length > 60) return "Title must be under 60 characters";
          return "";
        },
    
        firstName: (v) => {
          if (!v) return "First name is required";
          if (v.length < 2) return "Must be at least 2 characters";
          return "";
        },
    
        lastName: (v) => {
          if (!v) return "Last name is required";   
          if (v.length < 2) return "Must be at least 2 characters";
          return "";
        },
    
        email: (v) => {
          if (!v) return "Email is required";
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
            return "Enter a valid email address";
          return "";
        },
    
        phone: (v) => {
          if (!v) return "Phone number is required";
          if (!/^\d{10}$/.test(v))
            return "Phone number must be exactly 10 digits";
          return "";
        },
    
        message: (v) => {
          if (!v) return "Message is required";
          if (v.length < 10) return "Message must be at least 10 characters";
          if (v.length > 500) return "Message must be under 500 characters";
          return "";
        },
    };

    

    const handlePhoneChange = (e) => {
        const digits = e.target.value.replace(/\D/g, "");
            if (digits.length <= 10) {
                setFormData(prev => ({ ...prev, phone: digits }));
                validateField("phone", digits);
            }
    };

    const handleNameChange = (e) => {
        const { name, value } = e.target;
        if (/^[A-Za-z]*$/.test(value)) {
            setFormData(prev => ({ ...prev, [name]: value }));
            validateField(name, value);
    }
    };

    const handleMessageChange = (e) => {
        const value = e.target.value.slice(0, 500);
        setFormData(prev => ({ ...prev, message: value }));
        validateField("message", value);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isAuthenticated) {
            navigate("/login"); // Redirect to login if not auth
            return alert('You must be logged in to send E-mails.');
        }

        if (!agreed) {
            alert('You must first agree to our Privacy Policy by checking the box below to send E-mails!')
            return // returns if privacy policy is not selected
        }

        Object.entries(formData).forEach(([key, value]) => {
            validateField(key, value);
        });

        if (Object.values(errors).some(Boolean)) {
            return alert("Please fix the errors before submitting.");
        }

        const templateParams = {
            title: formData.title,
            name: `${formData.firstName} ${formData.lastName}`,
            time: new Date().toLocaleString(),
            email: formData.email,
            phone: formData.phone,
            message: formData.message,
        };
        
        setLoading(true);

        try {
            const response = await emailjs.send(
                import.meta.env.VITE_EMAILJS_SERVICE_ID, 
                import.meta.env.VITE_EMAILJS_TEMPLATE_ID,  
                templateParams,
                import.meta.env.VITE_EMAILJS_PUBLIC_KEY
            );
    
            if (response.status === 200) {
                // console.log("Email sent");
                navigate("/");
            } else {
                console.error("Error sending email:", response);
            }
        } catch (err) {
            console.error("Request failed:", err);
        } finally {
            setLoading(false)
        }
        // console.log("Sending email with:", templateParams);
        // console.log(Object.fromEntries(templateParams));
    }

    if (loading) return <div className="flex items-center justify-center min-h-screen">
                           <span className="flex justify-center mt-5">
                               <svg className="spinner" />
                            </span>
                        </div>


    return (
        <div className="contactground-container min-h-screen flex flex-col">
            <div className="mx-auto max-w-2xl text-center mt-10">
                <h2 className="text-4xl font-semibold tracking-tight text-balance text-white sm:text-5xl">Contact us</h2>
                <p className="mt-2 text-lg/8 text-white">Send us an E-mail if you have any questions about your upcoming adventure</p>
            </div>
            <form onSubmit={handleSubmit} className="mx-auto mt-16 max-w-xl sm:mt-10">
                    <div className="sm:col-span-2">
                        <label htmlFor="email" className="block text-sm/6 font-semibold text-white">
                            Title
                        </label>
                        <div className="mt-2.5">
                            <input
                                name="title"
                                type="text"
                                required
                                value={formData.title}
                                onChange={handleChange}
                                onBlur={() => setTouched(prev => ({ ...prev, title: true }))}
                                className="block w-full rounded-md bg-white opacity-70 px-3.5 py-2 text-base text-white-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-600"
                            />
                        </div>
                            <p className="min-h-[1.25rem] text-sm text-red-500">
                                {touched.title && errors.title}
                            </p>

                    </div>
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                    <div>
                        <label htmlFor="first-name" className="block text-sm/6 font-semibold text-white">
                            First name
                        </label>
                        <div className="mt-2.5">
                            <input
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleNameChange}
                                onBlur={() => setTouched(prev => ({ ...prev, firstName: true }))}
                                required
                                className="block w-full rounded-md bg-white opacity-70 px-3.5 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-600"
                            />
                        </div>
                        <p className="min-h-[1.25rem] text-sm text-red-500">
                            {touched.firstName && errors.firstName}
                        </p>
                    </div>
                    <div>
                        <label htmlFor="last-name" className="block text-sm/6 font-semibold text-white">
                            Last name
                        </label>
                        <div className="mt-2.5">
                            <input
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleNameChange}
                                onBlur={() => setTouched(prev => ({ ...prev, lastName: true }))}
                                required
                                className="block w-full rounded-md bg-white opacity-70 px-3.5 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-600"
                            />
                        </div>
                        <p className="min-h-[1.25rem] text-sm text-red-500">
                            {touched.lastName && errors.lastName}
                        </p>
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="email" className="block text-sm/6 font-semibold text-white">
                            Email
                        </label>
                        <div className="mt-2.5">
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                                required
                                className="block w-full rounded-md bg-white opacity-70 px-3.5 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-600"
                            />
                        </div>
                        <p className="min-h-[1.25rem] text-sm text-red-500">
                            {touched.email && errors.email}
                        </p>
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="phone-number" className="block text-sm/6 font-semibold text-white">
                            Phone number
                        </label>
                        <div className="mt-2.5">
                            <div className="flex rounded-md bg-white opacity-70 outline-1 -outline-offset-1 outline-gray-300 has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-orange-600">
                                <input
                                    name="phone"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="1234567890"
                                    required
                                    value={formData.phone}
                                    onChange={handlePhoneChange}
                                    onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
                                    className="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                                />
                            </div>
                                <p className="min-h-[1.25rem] text-sm text-red-500">
                                {touched.phone && errors.phone}
                                </p>
                        </div>
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="message" className="block text-sm/6 font-semibold text-white">
                            Message
                        </label>
                        <div className="mt-2.5">
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleMessageChange}
                                onBlur={() => setTouched(prev => ({ ...prev, message: true }))}
                                rows={4}
                                className="block w-full rounded-md bg-white opacity-70 px-3.5 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-600"
                            />
                            <p className="text-sm text-gray-400">
                                {formData.message.length}/500
                            </p>
                        </div>
                        <p className="min-h-[1.25rem] text-sm text-red-500">
                            {touched.message && errors.message}
                        </p>
                    </div>
                    <Field className="flex gap-x-4 sm:col-span-2">
                        <div className="flex h-6 items-center">
                            <Switch
                                checked={agreed}
                                onChange={setAgreed}
                                className="group flex w-8 flex-none cursor-pointer rounded-full bg-gray-200 opacity-90 p-px ring-1 ring-gray-900/5 transition-colors duration-200 ease-in-out ring-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 data-checked:bg-orange-600"
                            >
                                <span className="sr-only">Agree to policies</span>
                                <span
                                    aria-hidden="true"
                                    className="size-4 transform rounded-full bg-white ring-1 shadow-xs ring-gray-900/5 transition duration-200 ease-in-out group-data-checked:translate-x-3.5"
                                />
                            </Switch>
                        </div>
                        <Label className="text-sm/6 text-white">
                            By selecting this, you agree to our{' '}
                            <Link to="/privacyPolicy" className="font-semibold text-orange-600">
                                Privacy&nbsp;Policy
                            </Link>
                            .
                        </Label>
                    </Field>
                </div>
                <div className="mt-10">
                    <button
                        type="submit"
                        disabled={loading}  
                        className="block w-full btn-orange"
                    >
                    {loading ? 'Sending E-mail' : 'Send E-mail'}
                        
                    </button>
                    {loading ? 
                        <span className="flex justify-center mt-5">
                            <svg className="spinner"></svg>
                        </span> 
                    : null }
                    
                </div>
            </form>
        </div>
    )
}

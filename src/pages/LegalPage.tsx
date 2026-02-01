import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

export function LegalPage() {
    const [searchParams] = useSearchParams();
    const section = searchParams.get('section') || 'privacy';
    const navigate = useNavigate();

    const renderContent = () => {
        switch(section) {
            case 'terms':
                return (
                    <div className="space-y-4">
                        <h1 className="text-3xl font-bold">Terms of Service</h1>
                        <p>Welcome to Vector. By using our services, you agree to these terms...</p>
                        <p className="text-gray-500 italic">(Placeholder text for Terms of Service)</p>
                    </div>
                );
            case 'security':
                return (
                    <div className="space-y-4">
                        <h1 className="text-3xl font-bold">Security Policy</h1>
                        <p>Your data security is our priority. We use industry-standard encryption...</p>
                        <p className="text-gray-500 italic">(Placeholder text for Security Policy)</p>
                    </div>
                );
            case 'privacy':
            default:
                return (
                    <div className="space-y-4">
                        <h1 className="text-3xl font-bold">Privacy Policy</h1>
                        <p>We respect your privacy and are committed to protecting your personal data...</p>
                        <p className="text-gray-500 italic">(Placeholder text for Privacy Policy)</p>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-50 px-6 py-12">
            <div className="max-w-3xl mx-auto">
                <Button variant="ghost" onClick={() => navigate('/')} className="mb-8 gap-2 pl-0 hover:bg-transparent hover:text-gray-600 dark:hover:text-gray-300">
                    <ArrowLeft size={20} />
                    Back to Home
                </Button>
                
                <div className="flex gap-4 mb-8 border-b border-gray-100 dark:border-zinc-800 pb-4">
                    <button 
                        onClick={() => navigate('/legal?section=privacy')}
                        className={`font-medium transition-colors ${section === 'privacy' ? 'text-black dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    >
                        Privacy
                    </button>
                    <button 
                        onClick={() => navigate('/legal?section=terms')}
                        className={`font-medium transition-colors ${section === 'terms' ? 'text-black dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    >
                        Terms
                    </button>
                    <button 
                        onClick={() => navigate('/legal?section=security')}
                        className={`font-medium transition-colors ${section === 'security' ? 'text-black dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    >
                        Security
                    </button>
                </div>

                <div className="prose dark:prose-invert max-w-none">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}

import { useState } from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '../ui/button';
import { ProgressStepper } from '../design-system/ProgressStepper';
import { MetaDetailsStep } from './wizard-steps/MetaDetailsStep';
import { UploadDocumentsStep } from './wizard-steps/UploadDocumentsStep';
import { ReviewExtractedStep } from './wizard-steps/ReviewExtractedStep';
import { RunAgenticCheckStep } from './wizard-steps/RunAgenticCheckStep';
import { ResultsStep } from './wizard-steps/ResultsStep';

interface PayCheckWizardProps {
  onClose: () => void;
}

export interface WizardData {
  // Meta details
  organisationType: string;
  organisationName: string;
  employmentType: string;
  roleTitle: string;
  classificationLevel: string;
  periodStart: string;
  periodEnd: string;
  state: string;
  hasPublicHoliday: boolean;
  
  // Documents
  contractFile: File | null;
  worksheetFile: File | null;
  payslipFile: File | null;
  
  // Extracted data
  extractedData: any;
  
  // Agent logs
  agentLogs?: Array<{ timestamp: string; type: string; message: string }>;
  
  // Results
  results: any;
}

export function PayCheckWizard({ onClose }: PayCheckWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({
    organisationType: 'Childcare',
    organisationName: 'BrightSteps Early Learning',
    employmentType: 'Casual',
    roleTitle: 'Educator',
    classificationLevel: '',
    periodStart: '2025-08-01',
    periodEnd: '2025-08-14',
    state: 'VIC',
    hasPublicHoliday: false,
    contractFile: null,
    worksheetFile: null,
    payslipFile: null,
    extractedData: null,
    results: null
  });

  const steps = [
    { id: 'step-1', number: 1, label: 'Meta details', status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'current' : 'upcoming' },
    { id: 'step-2', number: 2, label: 'Upload documents', status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'current' : 'upcoming' },
    { id: 'step-3', number: 3, label: 'Review extracted info', status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'current' : 'upcoming' },
    { id: 'step-4', number: 4, label: 'Run Agentic Check', status: currentStep > 4 ? 'completed' : currentStep === 4 ? 'current' : 'upcoming' },
    { id: 'step-5', number: 5, label: 'Results', status: currentStep === 5 ? 'completed' : 'upcoming' }
  ] as const;

  const handleNext = (data?: Partial<WizardData>) => {
    if (data) {
      setWizardData(prev => ({ ...prev, ...data }));
    }
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleStepClick = (stepNumber: number) => {
    if (stepNumber < currentStep) {
      setCurrentStep(stepNumber);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onClose}>
                <ArrowLeft className="size-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Shield className="size-7 text-primary" />
                <span className="text-xl">PayGuard</span>
              </div>
              <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
                <span>/</span>
                <span>New Pay Check Request</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of 5: {steps[currentStep - 1].label}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="flex gap-6">
          {/* Left Stepper */}
          <div className="w-64 shrink-0 hidden lg:block">
            <div className="sticky top-24 bg-white rounded-xl border border-border p-6">
              <h3 className="mb-4 text-sm uppercase text-muted-foreground tracking-wider">Progress</h3>
              <ProgressStepper 
                steps={steps as any} 
                orientation="vertical"
                onStepClick={handleStepClick}
              />
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl border border-border p-8">
              {currentStep === 1 && (
                <MetaDetailsStep 
                  data={wizardData}
                  onNext={handleNext}
                  onCancel={onClose}
                />
              )}
              {currentStep === 2 && (
                <UploadDocumentsStep 
                  data={wizardData}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}
              {currentStep === 3 && (
                <ReviewExtractedStep 
                  data={wizardData}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}
              {currentStep === 4 && (
                <RunAgenticCheckStep 
                  data={wizardData}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}
              {currentStep === 5 && (
                <ResultsStep 
                  data={wizardData}
                  onClose={onClose}
                  onBack={handleBack}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
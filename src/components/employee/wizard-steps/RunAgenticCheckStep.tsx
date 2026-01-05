import { useEffect, useState, useRef } from 'react';
import { Loader2, CheckCircle2, Terminal, ArrowRight } from 'lucide-react';
import { WizardData } from '../PayCheckWizard';
import { Button } from '../../ui/button';

interface RunAgenticCheckStepProps {
  data: WizardData;
  onNext: (data: Partial<WizardData>) => void;
  onBack: () => void;
}

interface LogEntry {
  timestamp: string;
  type: 'start' | 'complete' | 'divider';
  agentName?: string;
  message: string;
}

export function RunAgenticCheckStep({ data, onNext, onBack }: RunAgenticCheckStepProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<Array<{ timestamp: string; type: string; message: string }>>(
    data.agentLogs || []
  );
  const [currentAgentIndex, setCurrentAgentIndex] = useState(0);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const hasAlreadyRun = data.agentLogs && data.agentLogs.length > 0;

  // Auto-scroll to bottom when new logs appear
  useEffect(() => {
    logContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    if (hasAlreadyRun) {
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);

    const agents = [
      {
        name: 'Award Agent',
        startMessage: '🔍 Award Agent started...\n   → Identifying applicable Modern Award based on job details',
        completeMessage: '✓ Award Agent completed\n   → Identified: Children\'s Services Award 2010\n   → Classification: Level 3 Casual Educator\n   → Base rate: $28.00/hr | Evening rate: $34.00/hr'
      },
      {
        name: 'Contract Agent',
        startMessage: '📄 Contract Agent started...\n   → Parsing employment contract for rates and terms',
        completeMessage: '✓ Contract Agent completed\n   → Contract rates extracted successfully\n   → Ordinary rate: $28.00/hr\n   → Evening penalty: +21.4% ($34.00/hr)\n   → Casual loading: 25%'
      },
      {
        name: 'Worksheet Agent',
        startMessage: '📊 Worksheet Agent started...\n   → Extracting shift data from timesheet',
        completeMessage: '✓ Worksheet Agent completed\n   → Total hours worked: 18.0 hours\n   → Ordinary hours: 16.0 (Mon-Fri, 6am-6pm)\n   → Evening hours: 2.0 (after 6pm)\n   → Dates: 01 Aug - 14 Aug 2025'
      },
      {
        name: 'Payslip Agent',
        startMessage: '💰 Payslip Agent started...\n   → Reading payment information and line items',
        completeMessage: '✓ Payslip Agent completed\n   → Total paid: $540.00\n   → Breakdown: Ordinary (16h @ $28) + Evening (2h @ $28) + Casual loading ($36)\n   → Notice: Evening penalty rate not applied'
      },
      {
        name: 'Retrieval Agent',
        startMessage: '📚 Retrieval Agent started...\n   → Fetching relevant Award clauses from knowledge base',
        completeMessage: '✓ Retrieval Agent completed\n   → Retrieved 8 relevant Award clauses\n   → Key clauses: Clause 25.3 (Evening work), Clause 12.2 (Casual loading)\n   → Award version: MA000120 (current as of 2025)'
      },
      {
        name: 'Time Categorisation Agent',
        startMessage: '🕐 Time Categorisation Agent started...\n   → Classifying hours by time period and penalty rates',
        completeMessage: '✓ Time Categorisation Agent completed\n   → Ordinary hours: 16.0 (standard rate)\n   → Evening hours: 2.0 (premium rate - after 6pm)\n   → Weekend hours: 0.0\n   → Public holiday hours: 0.0'
      },
      {
        name: 'Calculator Agent',
        startMessage: '🧮 Calculator Agent started...\n   → Computing entitlements based on Award + contract + hours',
        completeMessage: '✓ Calculator Agent completed\n   → Ordinary entitlement: 16h × $28.00 = $448.00\n   → Evening entitlement: 2h × $34.00 = $68.00\n   → Casual loading (25%): $129.00\n   → Total entitled: $612.00'
      },
      {
        name: 'Underpayment Detector',
        startMessage: '⚠️  Underpayment Detector started...\n   → Comparing paid amount vs entitled amount',
        completeMessage: '✓ Underpayment Detector completed\n   → Paid: $540.00 | Entitled: $612.00\n   → UNDERPAYMENT DETECTED: -$72.00\n   → Issue: Evening penalty rate not paid (shortfall: $12)\n   → Issue: Casual loading undercalculated (shortfall: $60)'
      },
      {
        name: 'Explanation Agent',
        startMessage: '📝 Explanation Agent started...\n   → Generating plain-English summary of findings',
        completeMessage: '✓ Explanation Agent completed\n   → Summary: You worked 2 hours after 6pm which should be paid at\n     the evening rate of $34/hr, but were paid at $28/hr.\n   → Your casual loading was also undercalculated.\n   → Confidence: 86% (High confidence)'
      },
      {
        name: 'Guardrail Agent',
        startMessage: '🛡️  Guardrail Agent started...\n   → Validating calculation accuracy and logic checks',
        completeMessage: '✓ Guardrail Agent completed\n   → All calculations validated ✓\n   → Award interpretation correct ✓\n   → Evidence chain complete ✓\n   → Ready for results presentation'
      }
    ];

    let currentAgentIndex = 0;

    const processNextAgent = () => {
      if (currentAgentIndex >= agents.length) {
        // All agents complete
        setLogs(prev => [
          ...prev,
          { timestamp: new Date().toLocaleTimeString(), type: 'divider', message: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' },
          { 
            timestamp: new Date().toLocaleTimeString(), 
            type: 'complete', 
            message: '✅ All agents completed successfully!\n   Analysis complete. Ready to view results.\n' 
          }
        ]);
        setIsProcessing(false);
        
        return;
      }

      const agent = agents[currentAgentIndex];

      // Add start message
      setLogs(prev => [
        ...prev,
        { 
          timestamp: new Date().toLocaleTimeString(), 
          type: 'start', 
          agentName: agent.name,
          message: agent.startMessage + '\n'
        }
      ]);

      // Simulate processing time (1-2 seconds per agent)
      const processingTime = 1000 + Math.random() * 1000;
      
      setTimeout(() => {
        // Add complete message
        setLogs(prev => [
          ...prev,
          { 
            timestamp: new Date().toLocaleTimeString(), 
            type: 'complete', 
            agentName: agent.name,
            message: agent.completeMessage + '\n'
          },
          { 
            timestamp: '', 
            type: 'divider', 
            message: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
          }
        ]);

        currentAgentIndex++;
        
        // Small delay before starting next agent
        setTimeout(processNextAgent, 300);
      }, processingTime);
    };

    // Start processing after a brief delay
    const initialDelay = setTimeout(() => {
      processNextAgent();
    }, 500);

    return () => {
      clearTimeout(initialDelay);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAlreadyRun]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h3 className="text-lg mb-1">Running Agentic Check</h3>
        <p className="text-sm text-muted-foreground">
          AI agents are analyzing your documents and calculating your entitlements
        </p>
      </div>

      {/* Processing Status */}
      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        {isProcessing ? (
          <>
            <Loader2 className="size-5 text-blue-600 animate-spin" />
            <div className="text-sm text-blue-900">
              Processing in progress... This typically takes 1–2 minutes.
            </div>
          </>
        ) : (
          <>
            <CheckCircle2 className="size-5 text-green-600" />
            <div className="text-sm text-green-900">
              Analysis complete! Preparing results...
            </div>
          </>
        )}
      </div>

      {/* Log Console */}
      <div className="border border-border rounded-lg bg-slate-950 text-green-400 overflow-hidden">
        {/* Console Header */}
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-slate-800">
          <Terminal className="size-4" />
          <span className="text-sm font-mono">Agent Execution Log</span>
        </div>

        {/* Console Body */}
        <div 
          className="p-4 font-mono text-sm h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900"
          style={{ 
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
          }}
        >
          {logs.map((log, index) => (
            <div key={index} className="mb-2">
              {log.type === 'divider' ? (
                <div className="text-slate-600">{log.message}</div>
              ) : (
                <div className="whitespace-pre-wrap">
                  <span className="text-slate-500">[{log.timestamp}]</span>{' '}
                  <span className={
                    log.type === 'start' ? 'text-cyan-400' : 
                    log.type === 'complete' ? 'text-green-400' : 
                    'text-white'
                  }>
                    {log.message}
                  </span>
                </div>
              )}
            </div>
          ))}
          <div ref={logContainerRef} />
        </div>
      </div>

      {/* Processing Note */}
      {isProcessing && (
        <div className="text-xs text-muted-foreground text-center">
          You can safely close this window. We'll email you when the analysis is complete.
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isProcessing}
        >
          <ArrowRight className="size-4 rotate-180" />
          Back
        </Button>
        
        {!isProcessing && (
          <Button
            onClick={() => onNext({
              agentLogs: logs,
              results: {
                status: 'underpaid',
                paid: 540,
                entitled: 612,
                difference: -72,
                anomalyScore: 86,
                confidence: 0.86
              }
            })}
          >
            View Results
            <ArrowRight className="size-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
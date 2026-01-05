import { useState } from 'react';
import { ArrowLeft, Shield, Upload, CheckCircle2, Edit2, FileText, Building2, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';

interface ProfileSetupProps {
  onClose: () => void;
  onComplete: (profileData: ProfileData) => void;
  existingProfile?: ProfileData | null;
}

export interface ProfileData {
  // Uploaded documents
  contractFile: File | null;
  
  // Work information
  organisationType: string;
  organisationName: string;
  placeOfWork: string;
  workAddress: string;
  state: string;
  
  // Extracted information (from AI)
  extracted: {
    employmentType: string;
    roleTitle: string;
    classificationLevel: string;
    awardName: string;
    awardCode: string;
    baseRate: number;
    casualLoading: number;
    eveningRate: number;
    saturdayRate: number;
    sundayRate: number;
    publicHolidayRate: number;
    minimumShift: number;
    paidBreak: string;
    mealAllowance: number;
    splitShiftAllowance: number;
  };
  
  isComplete: boolean;
}

export function ProfileSetup({ onClose, onComplete, existingProfile }: ProfileSetupProps) {
  const [step, setStep] = useState<'upload' | 'extract' | 'review'>('upload');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [contractFile, setContractFile] = useState<File | null>(existingProfile?.contractFile || null);
  
  // Work information
  const [organisationType, setOrganisationType] = useState(existingProfile?.organisationType || 'Childcare');
  const [organisationName, setOrganisationName] = useState(existingProfile?.organisationName || 'BrightSteps Early Learning');
  const [placeOfWork, setPlaceOfWork] = useState(existingProfile?.placeOfWork || 'BrightSteps Early Learning - Melbourne CBD');
  const [workAddress, setWorkAddress] = useState(existingProfile?.workAddress || '123 Collins Street, Melbourne');
  const [workState, setWorkState] = useState(existingProfile?.state || 'VIC');
  
  // Extracted data (editable)
  const [extractedData, setExtractedData] = useState(existingProfile?.extracted || {
    employmentType: 'Casual',
    roleTitle: 'Educator',
    classificationLevel: 'Level 3',
    awardName: "Children's Services Award 2010",
    awardCode: 'MA000120',
    baseRate: 28.00,
    casualLoading: 25,
    eveningRate: 34.00,
    saturdayRate: 42.00,
    sundayRate: 56.00,
    publicHolidayRate: 70.00,
    minimumShift: 2,
    paidBreak: '10 min (4+ hrs)',
    mealAllowance: 15.20,
    splitShiftAllowance: 18.50
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setContractFile(e.target.files[0]);
    }
  };

  const handleExtract = () => {
    setIsExtracting(true);
    setStep('extract');
    
    // Simulate AI extraction
    setTimeout(() => {
      setIsExtracting(false);
      setStep('review');
    }, 3000);
  };

  const handleSave = () => {
    const profileData: ProfileData = {
      contractFile,
      organisationType,
      organisationName,
      placeOfWork,
      workAddress,
      state: workState,
      extracted: extractedData,
      isComplete: true
    };
    
    onComplete(profileData);
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
                <span>Complete Profile</span>
              </div>
            </div>
            <Badge variant={step === 'review' ? 'default' : 'outline'}>
              {step === 'upload' && 'Step 1: Upload'}
              {step === 'extract' && 'Step 2: Extracting...'}
              {step === 'review' && 'Step 3: Review & Save'}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl mb-2">Complete Your Work Profile</h2>
              <p className="text-muted-foreground">
                Upload your employment contract and provide your work details. We'll extract key information to streamline your pay checks.
              </p>
            </div>

            {/* Work Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="size-5 text-primary" />
                  <CardTitle>Work Information</CardTitle>
                </div>
                <CardDescription>Tell us about your workplace</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Organisation Type</Label>
                    <Select value={organisationType} onValueChange={setOrganisationType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Childcare">Childcare / Early Learning</SelectItem>
                        <SelectItem value="Retail">Retail</SelectItem>
                        <SelectItem value="Hospitality">Hospitality</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Organisation Name</Label>
                    <Input 
                      value={organisationName}
                      onChange={(e) => setOrganisationName(e.target.value)}
                      placeholder="e.g., BrightSteps Early Learning"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Place of Work</Label>
                  <Input 
                    value={placeOfWork}
                    onChange={(e) => setPlaceOfWork(e.target.value)}
                    placeholder="e.g., BrightSteps Early Learning - Melbourne CBD"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Work Address</Label>
                    <Input 
                      value={workAddress}
                      onChange={(e) => setWorkAddress(e.target.value)}
                      placeholder="e.g., 123 Collins Street, Melbourne"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select value={workState} onValueChange={setWorkState}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NSW">NSW</SelectItem>
                        <SelectItem value="VIC">VIC</SelectItem>
                        <SelectItem value="QLD">QLD</SelectItem>
                        <SelectItem value="SA">SA</SelectItem>
                        <SelectItem value="WA">WA</SelectItem>
                        <SelectItem value="TAS">TAS</SelectItem>
                        <SelectItem value="NT">NT</SelectItem>
                        <SelectItem value="ACT">ACT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contract Upload */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="size-5 text-primary" />
                  <CardTitle>Employment Contract</CardTitle>
                </div>
                <CardDescription>Upload your employment contract (PDF format)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    id="contract-upload"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="contract-upload" className="cursor-pointer">
                    {contractFile ? (
                      <div className="space-y-2">
                        <CheckCircle2 className="size-12 text-green-600 mx-auto" />
                        <div className="text-sm">
                          <span className="text-green-600">✓ </span>
                          {contractFile.name}
                        </div>
                        <Button variant="outline" size="sm" onClick={(e) => { e.preventDefault(); document.getElementById('contract-upload')?.click(); }}>
                          Change File
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="size-12 text-muted-foreground mx-auto" />
                        <div className="text-sm text-muted-foreground">
                          Click to upload or drag and drop
                        </div>
                        <div className="text-xs text-muted-foreground">
                          PDF (max 10MB)
                        </div>
                      </div>
                    )}
                  </label>
                </div>

                {contractFile && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Sparkles className="size-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-900">
                        <strong>AI Extraction Ready:</strong> We'll analyze your contract to automatically extract your employment type, rates, award details, and entitlements.
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleExtract} 
                disabled={!contractFile}
                className="gap-2"
              >
                <Sparkles className="size-4" />
                Extract Information
              </Button>
            </div>
          </div>
        )}

        {/* Extracting Step */}
        {step === 'extract' && (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-12 pb-12">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mx-auto">
                    <Sparkles className="size-8 text-blue-600 animate-pulse" />
                  </div>
                  <h3 className="text-xl">Analyzing Your Contract</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Our AI agents are reading your employment contract to extract rates, award information, and entitlements...
                  </p>
                  <div className="pt-4">
                    <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                      Processing...
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Review Step */}
        {step === 'review' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl mb-2">Review Extracted Information</h2>
              <p className="text-muted-foreground">
                Verify the information we extracted from your contract. You can edit any field if needed.
              </p>
            </div>

            {/* Extracted Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Extracted Details</CardTitle>
                    <CardDescription>AI-extracted from your employment contract</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="gap-2"
                  >
                    <Edit2 className="size-4" />
                    {isEditing ? 'Done Editing' : 'Edit'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Employment Details */}
                <div>
                  <h4 className="text-sm mb-3">Employment Details</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Employment Type</Label>
                      {isEditing ? (
                        <Select value={extractedData.employmentType} onValueChange={(val) => setExtractedData({...extractedData, employmentType: val})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Full-time">Full-time</SelectItem>
                            <SelectItem value="Part-time">Part-time</SelectItem>
                            <SelectItem value="Casual">Casual</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="p-2 bg-muted rounded">{extractedData.employmentType}</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Role Title</Label>
                      {isEditing ? (
                        <Input value={extractedData.roleTitle} onChange={(e) => setExtractedData({...extractedData, roleTitle: e.target.value})} />
                      ) : (
                        <div className="p-2 bg-muted rounded">{extractedData.roleTitle}</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Classification Level</Label>
                      {isEditing ? (
                        <Input value={extractedData.classificationLevel} onChange={(e) => setExtractedData({...extractedData, classificationLevel: e.target.value})} />
                      ) : (
                        <div className="p-2 bg-muted rounded">{extractedData.classificationLevel}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Award Information */}
                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm mb-3">Award Information</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Award Name</Label>
                      {isEditing ? (
                        <Input value={extractedData.awardName} onChange={(e) => setExtractedData({...extractedData, awardName: e.target.value})} />
                      ) : (
                        <div className="p-2 bg-muted rounded">{extractedData.awardName}</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Award Code</Label>
                      {isEditing ? (
                        <Input value={extractedData.awardCode} onChange={(e) => setExtractedData({...extractedData, awardCode: e.target.value})} />
                      ) : (
                        <div className="p-2 bg-muted rounded font-mono text-sm">{extractedData.awardCode}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pay Rates */}
                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm mb-3">Pay Rates (per hour)</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Base Rate</Label>
                      {isEditing ? (
                        <Input type="number" step="0.01" value={extractedData.baseRate} onChange={(e) => setExtractedData({...extractedData, baseRate: parseFloat(e.target.value)})} />
                      ) : (
                        <div className="p-2 bg-muted rounded">${extractedData.baseRate.toFixed(2)}</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Casual Loading (%)</Label>
                      {isEditing ? (
                        <Input type="number" value={extractedData.casualLoading} onChange={(e) => setExtractedData({...extractedData, casualLoading: parseFloat(e.target.value)})} />
                      ) : (
                        <div className="p-2 bg-muted rounded">{extractedData.casualLoading}%</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Evening Rate</Label>
                      {isEditing ? (
                        <Input type="number" step="0.01" value={extractedData.eveningRate} onChange={(e) => setExtractedData({...extractedData, eveningRate: parseFloat(e.target.value)})} />
                      ) : (
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded">${extractedData.eveningRate.toFixed(2)}</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Saturday Rate</Label>
                      {isEditing ? (
                        <Input type="number" step="0.01" value={extractedData.saturdayRate} onChange={(e) => setExtractedData({...extractedData, saturdayRate: parseFloat(e.target.value)})} />
                      ) : (
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded">${extractedData.saturdayRate.toFixed(2)}</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Sunday Rate</Label>
                      {isEditing ? (
                        <Input type="number" step="0.01" value={extractedData.sundayRate} onChange={(e) => setExtractedData({...extractedData, sundayRate: parseFloat(e.target.value)})} />
                      ) : (
                        <div className="p-2 bg-purple-50 border border-purple-200 rounded">${extractedData.sundayRate.toFixed(2)}</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Public Holiday Rate</Label>
                      {isEditing ? (
                        <Input type="number" step="0.01" value={extractedData.publicHolidayRate} onChange={(e) => setExtractedData({...extractedData, publicHolidayRate: parseFloat(e.target.value)})} />
                      ) : (
                        <div className="p-2 bg-red-50 border border-red-200 rounded">${extractedData.publicHolidayRate.toFixed(2)}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Entitlements */}
                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm mb-3">Entitlements</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Minimum Shift (hours)</Label>
                      {isEditing ? (
                        <Input type="number" value={extractedData.minimumShift} onChange={(e) => setExtractedData({...extractedData, minimumShift: parseFloat(e.target.value)})} />
                      ) : (
                        <div className="p-2 bg-muted rounded">{extractedData.minimumShift} hours</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Paid Break</Label>
                      {isEditing ? (
                        <Input value={extractedData.paidBreak} onChange={(e) => setExtractedData({...extractedData, paidBreak: e.target.value})} />
                      ) : (
                        <div className="p-2 bg-muted rounded">{extractedData.paidBreak}</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Meal Allowance</Label>
                      {isEditing ? (
                        <Input type="number" step="0.01" value={extractedData.mealAllowance} onChange={(e) => setExtractedData({...extractedData, mealAllowance: parseFloat(e.target.value)})} />
                      ) : (
                        <div className="p-2 bg-muted rounded">${extractedData.mealAllowance.toFixed(2)}</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Split Shift Allowance</Label>
                      {isEditing ? (
                        <Input type="number" step="0.01" value={extractedData.splitShiftAllowance} onChange={(e) => setExtractedData({...extractedData, splitShiftAllowance: parseFloat(e.target.value)})} />
                      ) : (
                        <div className="p-2 bg-muted rounded">${extractedData.splitShiftAllowance.toFixed(2)}</div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Success Message */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-green-600 mt-0.5" />
                  <div className="text-sm text-green-900">
                    <strong>Profile Ready:</strong> Once saved, this information will be used across PayGuard to pre-fill your pay check requests, update your Quick Reference, and provide context to the Award Assistant.
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back to Upload
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <CheckCircle2 className="size-4" />
                Save Profile
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, CheckCircle, Loader2 } from "lucide-react";

interface SubmissionSectionProps {
  certified: boolean;
  setCertified: (val: boolean) => void;
  signatureName: string;
  setSignatureName: (val: string) => void;
  signatureUrl: string;
  handleSignatureUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingSignature: boolean;
  submitRegistration: () => void;
  isSubmitting: boolean;
}

export const SubmissionSection: React.FC<SubmissionSectionProps> = ({ 
  certified, 
  setCertified, 
  signatureName, 
  setSignatureName, 
  signatureUrl, 
  handleSignatureUpload, 
  isUploadingSignature, 
  submitRegistration, 
  isSubmitting 
}) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto mt-12">
      <div className="bg-white p-10 rounded-2xl border shadow-xl text-center">
        <div className="w-16 h-16 bg-[#0C005F]/10 text-[#0C005F] rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Final Certification</h2>
        <p className="text-slate-500 mb-8 text-sm">Please review the declarations below to permanently append this HRIS file.</p>

        <div className="bg-slate-50 p-6 rounded-lg text-left text-sm text-slate-700 space-y-4 mb-8">
          <p className="leading-relaxed font-medium">"I certify that all given information are true and complete to the best of my knowledge."</p>
          <p className="leading-relaxed font-medium">"I also authorize the University of Bohol to perform a background screening check (including future screenings for retention, reassignment or promotion, if applicable)."</p>
        </div>

        <div className="space-y-6 text-left border-t pt-8">
          <div className="flex items-center space-x-3 mb-6 bg-blue-50/50 p-4 border border-blue-100 rounded-md">
            <Checkbox id="terms" checked={certified} onCheckedChange={setCertified} />
            <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[#0C005F]">
              I agree to the electronic waiver and statements above.
            </label>
          </div>

          <div className="space-y-4 max-w-sm mx-auto w-full">
            <Label className="text-center block">Signature (Type Full Government Name) *</Label>
            <Input value={signatureName} onChange={e => setSignatureName(e.target.value)} placeholder="Type identifying name" className="text-center font-semibold tracking-wider text-slate-800 h-10" />

            <div className="pt-2">
              <Label className="text-center block mb-2">E-Signature Attachment (PNG/JPG) *</Label>
              {signatureUrl ? (
                <div className="border rounded-md overflow-hidden bg-slate-50 relative group">
                  <img src={signatureUrl} alt="E-signature" className="h-24 w-full object-contain mix-blend-multiply" />
                  <label className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center cursor-pointer transition-all">
                    <span className="text-white text-xs font-bold flex items-center gap-1"><Upload className="w-3 h-3" /> Re-upload</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleSignatureUpload} disabled={isUploadingSignature} />
                  </label>
                </div>
              ) : (
                <label className={`border-2 border-dashed rounded-md h-24 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors ${isUploadingSignature ? 'opacity-50' : ''}`}>
                  {!isUploadingSignature ? (
                    <>
                      <Upload className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-xs text-slate-500 font-medium">Click to upload signature</span>
                    </>
                  ) : (
                    <>
                      <Loader2 className="w-5 h-5 text-slate-400 mb-1 animate-spin" />
                      <span className="text-xs text-slate-500 font-medium">Uploading...</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleSignatureUpload} disabled={isUploadingSignature} />
                </label>
              )}
            </div>
          </div>

          <div className="pt-6 text-center">
            <Button onClick={submitRegistration} disabled={isSubmitting || isUploadingSignature} className="w-full max-w-sm h-12 bg-[#0C005F] hover:bg-[#1900C5] text-white font-bold text-base shadow-md">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting 201 Form...
                </>
              ) : (
                "Submit 201 Form"
              )}
            </Button>
            <p className="text-[10px] text-slate-400 mt-2 italic">Ensure all required sections are completed before submitting.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/Card';
import { Shield, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import KycForm from '@/components/dashboard/KycForm';

export default async function KycPage() {
  const session = await auth();
  const userId = Number(session?.user?.id);
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  // kv: 0 = not submitted, 1 = approved, 2 = pending, 3 = rejected
  const kycStatus = user.kv;
  const kycData = user.kyc_data as any;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">KYC Verification</h2>
        <p className="mt-1 text-sm text-gray-500">Verify your identity to unlock full platform features</p>
      </div>

      {/* Status Card */}
      <Card>
        <CardContent className="py-5">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              kycStatus === 1 ? 'bg-emerald-50' : kycStatus === 2 ? 'bg-amber-50' : kycStatus === 3 ? 'bg-red-50' : 'bg-gray-50'
            }`}>
              {kycStatus === 1 && <CheckCircle size={24} className="text-emerald-600" />}
              {kycStatus === 2 && <Clock size={24} className="text-amber-600" />}
              {kycStatus === 3 && <XCircle size={24} className="text-red-500" />}
              {kycStatus === 0 && <Shield size={24} className="text-gray-400" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {kycStatus === 0 && 'Not Submitted'}
                  {kycStatus === 1 && 'KYC Approved'}
                  {kycStatus === 2 && 'Under Review'}
                  {kycStatus === 3 && 'KYC Rejected'}
                </h3>
                <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                  kycStatus === 1 ? 'bg-emerald-100 text-emerald-700' :
                  kycStatus === 2 ? 'bg-amber-100 text-amber-700' :
                  kycStatus === 3 ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {kycStatus === 0 && 'Not Verified'}
                  {kycStatus === 1 && 'Approved'}
                  {kycStatus === 2 && 'Pending'}
                  {kycStatus === 3 && 'Rejected'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {kycStatus === 0 && 'Submit your identity documents to get verified. This helps us ensure platform security.'}
                {kycStatus === 1 && 'Your identity has been verified successfully. You have full access to all platform features.'}
                {kycStatus === 2 && 'Your KYC has already been submitted and is currently under review. Please wait for the admin response.'}
                {kycStatus === 3 && 'Your KYC submission was rejected. Please review the reason below and resubmit with correct information.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approved - Show details */}
      {kycStatus === 1 && kycData && (
        <Card>
          <CardContent className="py-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Submitted Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {Object.entries(kycData).map(([key, value]) => (
                <div key={key} className="flex justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="text-gray-900 font-medium">{String(value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending - Info message */}
      {kycStatus === 2 && (
        <Card>
          <CardContent className="py-5">
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">Verification in Progress</p>
                <p className="text-xs text-amber-700 mt-1">
                  Our team is reviewing your documents. This usually takes 1-3 business days. 
                  You will be notified once the review is complete.
                </p>
              </div>
            </div>
            {kycData && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">Submitted data:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.entries(kycData).map(([key, value]) => (
                    <div key={key} className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="text-gray-700">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rejected - Show reason + allow resubmit */}
      {kycStatus === 3 && (
        <>
          <Card>
            <CardContent className="py-5">
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <XCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Submission Rejected</p>
                  <p className="text-xs text-red-700 mt-1">
                    Please correct the issues and resubmit your documents.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <KycForm />
        </>
      )}

      {/* Not submitted - Show form */}
      {kycStatus === 0 && <KycForm />}
    </div>
  );
}

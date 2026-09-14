import {
  Proposal,
  ProposalPaymentTracking,
  ProposalPaymentStage,
  PaymentStageKey,
  PaymentStageStatus,
  OverallPaymentStatus,
  PaymentTransactionRecord,
} from '../types';

/**
 * Calculates a standard 3-stage milestone payment tracking structure based on:
 * 1. Registration Fee: Payable at registration
 * 2. Onboarding: Balance 60% after student onboarding
 * 3. 2-Month Mark: Balance 40% after 2 months
 */
export function calculateDefaultPaymentStages(proposal: Proposal): ProposalPaymentTracking {
  const totalAmount = Number(proposal.totalAmount) || 0;
  
  // Registration fee from agreementDetails or sensible default
  let regFee = proposal.agreementDetails?.registrationFee;
  if (regFee === undefined || regFee === null || isNaN(regFee)) {
    regFee = totalAmount >= 30000 ? 30000 : Math.round(totalAmount * 0.3);
  }

  let stage1Target = Math.min(regFee, totalAmount);
  let remaining = Math.max(0, totalAmount - stage1Target);
  let stage2Target = Math.round(remaining * 0.6);
  let stage3Target = Math.max(0, totalAmount - stage1Target - stage2Target);

  // If proposal has no registration fee (e.g. 0), standard 60/40 or full
  if (stage1Target === 0 && totalAmount > 0) {
    stage2Target = Math.round(totalAmount * 0.6);
    stage3Target = totalAmount - stage2Target;
  }

  // Calculate standard milestone due dates from proposalDate
  const baseDate = proposal.proposalDate ? new Date(proposal.proposalDate) : new Date();
  const validBase = isNaN(baseDate.getTime()) ? new Date() : baseDate;

  const regDueDate = validBase.toISOString().split('T')[0];

  const onboardingDate = new Date(validBase);
  onboardingDate.setDate(onboardingDate.getDate() + 30);
  const onboardingDueDate = onboardingDate.toISOString().split('T')[0];

  const twoMonthsDate = new Date(validBase);
  twoMonthsDate.setDate(twoMonthsDate.getDate() + 90);
  const twoMonthsDueDate = twoMonthsDate.toISOString().split('T')[0];

  // Default seed: If proposal is already Approved, mock Stage 1 (Registration) as received
  const isApproved = proposal.proposalStatus === 'Approved';
  const stage1Paid = isApproved ? stage1Target : 0;
  const stage1Status: PaymentStageStatus = isApproved ? 'Paid' : 'Pending';

  const stages: ProposalPaymentStage[] = [
    {
      stageKey: 'registration',
      stageName: 'Registration Fee',
      title: 'Milestone 1 • Registration Fee',
      description: 'Payable upon proposal acceptance and institutional registration',
      targetAmount: stage1Target,
      paidAmount: stage1Paid,
      status: stage1Status,
      dueDate: regDueDate,
      paidDate: isApproved ? regDueDate : undefined,
      paymentMode: isApproved ? 'Bank Transfer' : undefined,
      referenceNumber: isApproved ? `REG-${proposal.proposalNumber.replace(/[^a-zA-Z0-9]/g, '')}` : undefined,
      notes: 'Initial registration deposit',
    },
    {
      stageKey: 'onboarding',
      stageName: 'Student Onboarding (60%)',
      title: 'Milestone 2 • Balance 60% Onboarding',
      description: 'Payable immediately after completion of student and campus onboarding',
      percentage: 60,
      targetAmount: stage2Target,
      paidAmount: 0,
      status: 'Pending',
      dueDate: onboardingDueDate,
      notes: '60% balance following active student roster & app onboarding',
    },
    {
      stageKey: 'two_months',
      stageName: '2-Month Mark (40%)',
      title: 'Milestone 3 • Balance 40% After 2 Months',
      description: 'Payable 2 months following successful deployment and onboarding',
      percentage: 40,
      targetAmount: stage3Target,
      paidAmount: 0,
      status: 'Pending',
      dueDate: twoMonthsDueDate,
      notes: 'Final 40% balance after two months of active operational support',
    },
  ];

  const totalPaid = stages.reduce((acc, s) => acc + s.paidAmount, 0);
  const balance = Math.max(0, totalAmount - totalPaid);

  let overallStatus: OverallPaymentStatus = 'Unpaid';
  if (totalPaid >= totalAmount && totalAmount > 0) {
    overallStatus = 'Fully Paid';
  } else if (totalPaid > 0) {
    overallStatus = 'Partially Paid';
  }

  const transactions: PaymentTransactionRecord[] = isApproved && stage1Paid > 0
    ? [
        {
          id: `TXN-${Date.now()}-1`,
          stageKey: 'registration',
          amount: stage1Paid,
          paidDate: regDueDate,
          paymentMode: 'Bank Transfer',
          referenceNumber: `TXN-REF-${proposal.id}`,
          receiptNumber: `REC-${proposal.id}-01`,
          recordedBy: proposal.createdBy || 'Finance Team',
          notes: 'Registration fee credited via NEFT/RTGS',
        },
      ]
    : [];

  return {
    totalAgreedAmount: totalAmount,
    totalPaidAmount: totalPaid,
    balanceAmount: balance,
    overallPaymentStatus: overallStatus,
    stages,
    transactions,
    lastUpdated: new Date().toISOString().split('T')[0],
  };
}

/**
 * Ensures a proposal always has active payment tracking data
 */
export function getProposalPaymentTracking(proposal: Proposal): ProposalPaymentTracking {
  if (
    proposal.paymentTracking &&
    Array.isArray(proposal.paymentTracking.stages) &&
    proposal.paymentTracking.stages.length >= 3
  ) {
    return proposal.paymentTracking;
  }
  return calculateDefaultPaymentStages(proposal);
}

/**
 * Updates a specific payment milestone stage and recalculates overall totals
 */
export function updateProposalStage(
  currentTracking: ProposalPaymentTracking,
  stageKey: PaymentStageKey,
  updates: Partial<ProposalPaymentStage>,
  recordedBy?: string
): ProposalPaymentTracking {
  const stages = currentTracking.stages.map((stage) => {
    if (stage.stageKey !== stageKey) return stage;

    const merged = { ...stage, ...updates };

    // Determine status automatically if paid amount changed
    if (updates.paidAmount !== undefined && updates.status === undefined) {
      if (merged.paidAmount >= merged.targetAmount && merged.targetAmount > 0) {
        merged.status = 'Paid';
      } else if (merged.paidAmount > 0) {
        merged.status = 'Partially Paid';
      } else {
        merged.status = 'Pending';
      }
    }

    return merged;
  });

  const totalAgreed = currentTracking.totalAgreedAmount;
  const totalPaid = stages.reduce((sum, s) => sum + (Number(s.paidAmount) || 0), 0);
  const balance = Math.max(0, totalAgreed - totalPaid);

  let overallStatus: OverallPaymentStatus = 'Unpaid';
  if (totalPaid >= totalAgreed && totalAgreed > 0) {
    overallStatus = 'Fully Paid';
  } else if (totalPaid > 0) {
    overallStatus = 'Partially Paid';
  }

  // Create an audit transaction if marked as paid or updated with an amount
  const updatedStage = stages.find((s) => s.stageKey === stageKey);
  const existingTransactions = currentTracking.transactions || [];
  let newTransactions = [...existingTransactions];

  if (updates.paidAmount && updates.paidAmount > 0) {
    const txn: PaymentTransactionRecord = {
      id: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      stageKey,
      amount: updates.paidAmount,
      paidDate: updates.paidDate || new Date().toISOString().split('T')[0],
      paymentMode: updates.paymentMode || 'Bank Transfer',
      referenceNumber: updates.referenceNumber || `REF-${stageKey.toUpperCase()}`,
      receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
      recordedBy: recordedBy || 'Accounts Team',
      notes: updates.notes || `Payment recorded for ${updatedStage?.stageName}`,
    };
    newTransactions.push(txn);
  }

  return {
    ...currentTracking,
    stages,
    totalPaidAmount: totalPaid,
    balanceAmount: balance,
    overallPaymentStatus: overallStatus,
    transactions: newTransactions,
    lastUpdated: new Date().toISOString().split('T')[0],
  };
}

/**
 * Returns Tailwind class names for a payment stage or overall status badge
 */
export function getPaymentBadgeClass(status: PaymentStageStatus | OverallPaymentStatus): string {
  switch (status) {
    case 'Paid':
    case 'Fully Paid':
      return 'bg-emerald-50 text-[#0B5D2A] border-emerald-300 font-bold';
    case 'Partially Paid':
      return 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
    case 'Pending':
    case 'Unpaid':
      return 'bg-slate-50 text-slate-600 border-slate-200 font-medium';
    case 'Overdue':
      return 'bg-red-50 text-red-700 border-red-200 font-bold';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}

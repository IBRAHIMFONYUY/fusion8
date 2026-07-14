'use server';

import { adminDb } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

// Public, unauthenticated forms (cohort application, teacher application) can't
// write directly from the client — firestore.rules requires an authenticated
// owner. These server actions write via the Admin SDK on the visitor's behalf,
// with minimal spam mitigation since there's no CAPTCHA/rate-limiting infra.
const MAX_DUPLICATE_SUBMISSIONS = 3;

const EMAIL_RE = /^\S+@\S+\.\S+$/;

type CohortApplicationInput = {
  fullName: string;
  email: string;
  phone: string;
  age: string;
  gender: string;
  location: string;
  educationLevel: string;
  occupation: string;
  currentSkills: string;
  previousHardware: string;
  howHeard: string;
  projectIdea: string;
  expectations: string;
  biggestChallenge: string;
  hasDevice: boolean;
  canCommit: boolean;
  emergencyName: string;
  emergencyPhone: string;
  paymentRef: string;
  // Honeypot — visually hidden on the form. A real visitor never fills this.
  website?: string;
};

export async function submitCohortApplication(
  data: CohortApplicationInput
): Promise<{ success: boolean; error?: string }> {
  if (data.website) {
    // Silently "succeed" so the bot doesn't learn the honeypot tripped.
    return { success: true };
  }

  const email = data.email?.trim().toLowerCase();
  const fullName = data.fullName?.trim();
  const phone = data.phone?.trim();

  if (
    !email || !fullName || !phone || !data.age || !data.gender ||
    !data.location || !data.educationLevel || !data.occupation
  ) {
    return { success: false, error: 'Please fill in all required fields.' };
  }
  if (!EMAIL_RE.test(email)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  try {
    const existing = await adminDb
      .collection('cohort_applications')
      .where('email', '==', email)
      .limit(MAX_DUPLICATE_SUBMISSIONS)
      .get();
    if (existing.size >= MAX_DUPLICATE_SUBMISSIONS) {
      return { success: false, error: "You've already applied with this email. We'll be in touch soon." };
    }

    // If this applicant already has an account, link it now so admin
    // approval can correctly auto-enroll them later instead of writing a
    // studentId: null enrollment.
    let studentId: string | null = null;
    const matchingUser = await adminDb.collection('users').where('email', '==', email).limit(1).get();
    if (!matchingUser.empty) {
      studentId = matchingUser.docs[0].id;
    }

    await adminDb.collection('cohort_applications').add({
      fullName,
      email,
      phone,
      age: data.age,
      gender: data.gender,
      location: data.location.trim(),
      educationLevel: data.educationLevel,
      occupation: data.occupation,
      ageLocation: `${data.age} yrs — ${data.location.trim()}`,
      currentSkills: data.currentSkills?.trim() ?? '',
      previousHardware: data.previousHardware?.trim() ?? '',
      howHeard: data.howHeard ?? '',
      projectIdea: data.projectIdea?.trim() ?? '',
      expectations: data.expectations?.trim() ?? '',
      biggestChallenge: data.biggestChallenge?.trim() ?? '',
      hasDevice: !!data.hasDevice,
      canCommit: !!data.canCommit,
      emergencyName: data.emergencyName?.trim() ?? '',
      emergencyPhone: data.emergencyPhone?.trim() ?? '',
      paymentRef: data.paymentRef?.trim() ?? '',
      studentId,
      status: 'pending',
      appliedAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error('[submitCohortApplication] Error:', error.message);
    return { success: false, error: 'Submission failed. Please try again.' };
  }
}

type TeacherApplicationInput = {
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  city: string;
  linkedIn: string;
  github: string;
  yearsExperience: string;
  currentOccupation: string;
  employer: string;
  expertise: string[];
  hasTaughtBefore: string;
  teachingHistory: string;
  proposedTopics: string;
  courseOutline: string;
  motivation: string;
  canWorkOnsite: string;
  hoursPerWeek: string;
  availableFrom: string;
  website?: string;
};

export async function submitTeacherApplication(
  data: TeacherApplicationInput
): Promise<{ success: boolean; error?: string }> {
  if (data.website) {
    return { success: true };
  }

  const email = data.email?.trim().toLowerCase();
  const fullName = data.fullName?.trim();

  if (
    !email || !fullName || !data.phone || !data.gender || !data.city ||
    !data.yearsExperience || !data.currentOccupation || !data.expertise?.length ||
    !data.hasTaughtBefore || !data.proposedTopics || !data.motivation ||
    !data.canWorkOnsite || !data.hoursPerWeek
  ) {
    return { success: false, error: 'Please fill in all required fields.' };
  }
  if (!EMAIL_RE.test(email)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  try {
    const existing = await adminDb
      .collection('teacher_applications')
      .where('email', '==', email)
      .limit(MAX_DUPLICATE_SUBMISSIONS)
      .get();
    if (existing.size >= MAX_DUPLICATE_SUBMISSIONS) {
      return { success: false, error: "You've already applied with this email. We'll be in touch soon." };
    }

    let userId: string | null = null;
    const matchingUser = await adminDb.collection('users').where('email', '==', email).limit(1).get();
    if (!matchingUser.empty) {
      userId = matchingUser.docs[0].id;
    }

    await adminDb.collection('teacher_applications').add({
      fullName,
      email,
      phone: data.phone.trim(),
      gender: data.gender,
      city: data.city.trim(),
      linkedIn: data.linkedIn?.trim() ?? '',
      github: data.github?.trim() ?? '',
      yearsExperience: data.yearsExperience,
      currentOccupation: data.currentOccupation.trim(),
      employer: data.employer?.trim() ?? '',
      expertise: data.expertise,
      subjects: data.expertise.join(', '),
      hasTaughtBefore: data.hasTaughtBefore,
      teachingHistory: data.teachingHistory?.trim() ?? '',
      proposedTopics: data.proposedTopics.trim(),
      courseOutline: data.courseOutline?.trim() ?? '',
      motivation: data.motivation.trim(),
      experience: `${data.yearsExperience} — ${data.teachingHistory ?? ''}`,
      canWorkOnsite: data.canWorkOnsite,
      hoursPerWeek: data.hoursPerWeek,
      availableFrom: data.availableFrom?.trim() ?? '',
      userId,
      status: 'pending',
      appliedAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error('[submitTeacherApplication] Error:', error.message);
    return { success: false, error: 'Submission failed. Please try again.' };
  }
}


import { setGlobalOptions } from "firebase-functions";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ maxInstances: 10 });

/**
 * Trigger: On Enrollment Created
 * Logic: Increment course enrollment count and initialize progress.
 */
export const onEnrollmentCreated = onDocumentCreated("enrollments/{enrollmentId}", async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const courseId = data.courseId;
  const courseRef = db.collection("courses").doc(courseId);

  await db.runTransaction(async (transaction) => {
    const courseDoc = await transaction.get(courseRef);
    const newCount = (courseDoc.data()?.enrolledCount || 0) + 1;
    transaction.update(courseRef, { enrolledCount: newCount });
  });
});

/**
 * Trigger: On Lesson Created
 * Logic: Notify all students enrolled in the course.
 */
export const onLessonCreated = onDocumentCreated("courses/{courseId}/lessons/{lessonId}", async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const courseId = event.params.courseId;
  const enrollments = await db.collection("enrollments")
    .where("courseId", "==", courseId)
    .get();

  const notifications = enrollments.docs.map(doc => {
    const studentId = doc.data().studentId;
    return db.collection("notifications").add({
      userId: studentId,
      type: "NEW_LESSON",
      message: `A new lesson "${data.title}" has been added.`,
      courseId: courseId,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await Promise.all(notifications);
});

/**
 * Trigger: On Grade Posted
 * Logic: Notify student of their new grade.
 */
export const onSubmissionUpdated = onDocumentUpdated("submissions/{submissionId}", async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  if (!before || !after) return;

  if (!before.grade && after.grade) {
    await db.collection("notifications").add({
      userId: after.studentId,
      type: "GRADE_POSTED",
      message: `Your assignment has been graded. Score: ${after.grade}`,
      assignmentId: after.assignmentId,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
});

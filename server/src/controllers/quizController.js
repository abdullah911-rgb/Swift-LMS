const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { computeFinalScore, issueCertificateWithMarks } = require('../utils/evaluationUtils');

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Strip correct answers from questions before sending to student */
function sanitizeQuestion(q, index, total) {
  return {
    id: q.id,
    question: q.question,
    options: q.options,
    order: q.order,
    index,
    total,
  };
}

/** Parse bulk question text into structured question objects */
function parseBulkQuestions(text) {
  const lines = text.split('\n').map((l) => l.trimEnd());
  const questions = [];
  const errors = [];

  let i = 0;
  let questionIndex = 0;

  while (i < lines.length) {
    // Skip empty lines between questions
    if (!lines[i].trim()) { i++; continue; }

    // Expect question line: "1. Question text" or "1) Question text"
    const qMatch = lines[i].match(/^(\d+)[.)]\s+(.+)$/);
    if (!qMatch) {
      errors.push(`Line ${i + 1}: Expected a numbered question (e.g. "1. Question text"), got: "${lines[i]}"`);
      // Skip until next numbered line
      i++;
      while (i < lines.length && !lines[i].match(/^\d+[.)]/)) i++;
      continue;
    }

    const qNum = parseInt(qMatch[1], 10);
    const questionText = qMatch[2].trim();
    if (!questionText) {
      errors.push(`Question ${qNum}: Question text is empty.`);
    }
    i++;

    // Parse options: "a) text" or "a. text"
    const options = [];
    const optionLetters = [];

    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line) { i++; break; }
      // Stop if it's the Correct: line or another question
      if (/^correct:/i.test(line) || /^\d+[.)]/.test(line)) break;

      const optMatch = line.match(/^([a-d])[.)]\s+(.+)$/i);
      if (!optMatch) {
        // Could be a continuation — ignore blank lines handled above
        errors.push(`Question ${qNum}: Unrecognised option line: "${line}"`);
        i++;
        break;
      }

      const letter = optMatch[1].toLowerCase();
      const text = optMatch[2].trim();
      if (!text) {
        errors.push(`Question ${qNum}: Option "${letter}" has empty text.`);
      }
      optionLetters.push(letter);
      options.push({ id: letter, text });
      i++;
    }

    if (options.length < 2) {
      errors.push(`Question ${qNum}: Must have at least 2 options (found ${options.length}).`);
    }
    if (options.length > 4) {
      errors.push(`Question ${qNum}: Must have at most 4 options (found ${options.length}).`);
    }

    // Validate sequential letters
    const expectedLetters = ['a', 'b', 'c', 'd'].slice(0, options.length);
    for (let k = 0; k < optionLetters.length; k++) {
      if (optionLetters[k] !== expectedLetters[k]) {
        errors.push(`Question ${qNum}: Option letters must be sequential (a, b, c, d). Got "${optionLetters[k]}" at position ${k + 1}.`);
      }
    }

    // Parse "Correct: b" or "Correct: b,c"
    let correctLetter = null;
    const trimmedLine = (lines[i] || '').trim();
    const correctMatch = trimmedLine.match(/^correct:\s*([a-d](?:,\s*[a-d])*)/i);
    if (!correctMatch) {
      errors.push(`Question ${qNum}: Missing or invalid "Correct:" line. Expected e.g. "Correct: b"`);
    } else {
      correctLetter = correctMatch[1].toLowerCase().replace(/\s/g, '');
      const correctLetters = correctLetter.split(',');
      for (const cl of correctLetters) {
        if (!optionLetters.includes(cl)) {
          errors.push(`Question ${qNum}: Correct answer "${cl}" does not match any option.`);
        }
      }
      i++;
    }

    questionIndex++;
    questions.push({
      questionNum: qNum,
      question: questionText,
      options,
      correctAnswer: correctLetter ? correctLetter.split(',') : [],
      order: questionIndex,
    });
  }

  // Check for duplicate question numbers
  const seenNums = new Set();
  for (const q of questions) {
    if (seenNums.has(q.questionNum)) {
      errors.push(`Duplicate question number: ${q.questionNum}`);
    }
    seenNums.add(q.questionNum);
  }

  return { questions, errors };
}

// ─── CONTROLLER ───────────────────────────────────────────────────────────────

const quizController = {

  // ── POST /api/quiz/course/:courseId ─────────────────────────────────────────
  // INSTRUCTOR: Create or update the final quiz for a course
  upsertQuiz: asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { title, description, passMark, timePerQuestion, maxAttempts } = req.body;

    if (!title || !title.trim()) return sendError(res, 'Quiz title is required.', 400);

    const course = await prisma.course.findFirst({
      where: { id: courseId, instructorId: req.user.id },
    });
    if (!course) return sendError(res, 'Course not found or not authorized.', 404);

    const data = {
      title: title.trim(),
      description: description?.trim() || null,
      passMark: passMark !== undefined ? parseInt(passMark, 10) : 60,
      timePerQuestion: timePerQuestion !== undefined ? parseInt(timePerQuestion, 10) : 60,
      maxAttempts: maxAttempts !== undefined ? parseInt(maxAttempts, 10) : 3,
    };

    // Validate ranges
    if (data.passMark < 1 || data.passMark > 100) return sendError(res, 'Pass mark must be 1–100.', 400);
    if (data.timePerQuestion < 10 || data.timePerQuestion > 300) return sendError(res, 'Time per question must be 10–300 seconds.', 400);
    if (data.maxAttempts < 1 || data.maxAttempts > 10) return sendError(res, 'Max attempts must be 1–10.', 400);

    const quiz = await prisma.quiz.upsert({
      where: { courseId },
      create: { courseId, ...data },
      update: { ...data },
      include: { _count: { select: { questions: true } } },
    });

    sendSuccess(res, 'Quiz saved.', { quiz }, quiz ? 200 : 201);
  }),

  // ── GET /api/quiz/course/:courseId ──────────────────────────────────────────
  // ALL: Get quiz info. Students get sanitized version; instructor gets full details.
  getQuiz: asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const isStudent = req.user.role === 'STUDENT';

    const quiz = await prisma.quiz.findUnique({
      where: { courseId },
      include: {
        _count: { select: { questions: true, attempts: true } },
      },
    });

    if (!quiz) return sendError(res, 'No final quiz found for this course.', 404);
    if (isStudent && !quiz.isPublished) {
      return sendError(res, 'The final quiz has not been published yet.', 403);
    }

    sendSuccess(res, 'Quiz fetched.', { quiz });
  }),

  // ── PUT /api/quiz/:quizId ────────────────────────────────────────────────────
  // INSTRUCTOR: Update quiz settings
  updateQuiz: asyncHandler(async (req, res) => {
    const { quizId } = req.params;
    const { title, description, passMark, timePerQuestion, maxAttempts } = req.body;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { course: { select: { instructorId: true } } },
    });
    if (!quiz) return sendError(res, 'Quiz not found.', 404);
    if (quiz.course.instructorId !== req.user.id) return sendError(res, 'Not authorized.', 403);

    const data = {};
    if (title !== undefined) data.title = title.trim();
    if (description !== undefined) data.description = description?.trim() || null;
    if (passMark !== undefined) {
      const pm = parseInt(passMark, 10);
      if (pm < 1 || pm > 100) return sendError(res, 'Pass mark must be 1–100.', 400);
      data.passMark = pm;
    }
    if (timePerQuestion !== undefined) {
      const tpq = parseInt(timePerQuestion, 10);
      if (tpq < 10 || tpq > 300) return sendError(res, 'Time per question must be 10–300 seconds.', 400);
      data.timePerQuestion = tpq;
    }
    if (maxAttempts !== undefined) {
      const ma = parseInt(maxAttempts, 10);
      if (ma < 1 || ma > 10) return sendError(res, 'Max attempts must be 1–10.', 400);
      data.maxAttempts = ma;
    }

    const updated = await prisma.quiz.update({ where: { id: quizId }, data });
    sendSuccess(res, 'Quiz updated.', { quiz: updated });
  }),

  // ── DELETE /api/quiz/:quizId ─────────────────────────────────────────────────
  // INSTRUCTOR: Delete quiz and all questions
  deleteQuiz: asyncHandler(async (req, res) => {
    const { quizId } = req.params;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { course: { select: { instructorId: true } } },
    });
    if (!quiz) return sendError(res, 'Quiz not found.', 404);
    if (quiz.course.instructorId !== req.user.id) return sendError(res, 'Not authorized.', 403);

    await prisma.quiz.delete({ where: { id: quizId } });
    sendSuccess(res, 'Quiz deleted.');
  }),

  // ── PATCH /api/quiz/:quizId/publish ─────────────────────────────────────────
  // INSTRUCTOR: Toggle publish/unpublish
  togglePublish: asyncHandler(async (req, res) => {
    const { quizId } = req.params;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        course: { select: { instructorId: true } },
        _count: { select: { questions: true } },
      },
    });
    if (!quiz) return sendError(res, 'Quiz not found.', 404);
    if (quiz.course.instructorId !== req.user.id) return sendError(res, 'Not authorized.', 403);

    if (!quiz.isPublished && quiz._count.questions < 1) {
      return sendError(res, 'Add at least 1 question before publishing.', 400);
    }

    const updated = await prisma.quiz.update({
      where: { id: quizId },
      data: { isPublished: !quiz.isPublished },
    });

    sendSuccess(res, `Quiz ${updated.isPublished ? 'published' : 'unpublished'}.`, { quiz: updated });
  }),

  // ── POST /api/quiz/:quizId/preview-import ────────────────────────────────────
  // INSTRUCTOR: Parse bulk question text and return preview without saving
  previewImport: asyncHandler(async (req, res) => {
    const { text } = req.body;
    if (!text?.trim()) return sendError(res, 'Question text is required.', 400);

    const { questions, errors } = parseBulkQuestions(text);
    sendSuccess(res, 'Preview ready.', { questions, errors, count: questions.length });
  }),

  // ── POST /api/quiz/:quizId/import ────────────────────────────────────────────
  // INSTRUCTOR: Parse, validate, and save bulk questions (replaces all existing questions)
  importQuestions: asyncHandler(async (req, res) => {
    const { quizId } = req.params;
    const { text, replace = true } = req.body;

    if (!text?.trim()) return sendError(res, 'Question text is required.', 400);

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { course: { select: { instructorId: true } } },
    });
    if (!quiz) return sendError(res, 'Quiz not found.', 404);
    if (quiz.course.instructorId !== req.user.id) return sendError(res, 'Not authorized.', 403);

    const { questions, errors } = parseBulkQuestions(text);

    if (errors.length > 0) {
      return sendError(res, 'Validation errors found. Fix them before importing.', 400, errors);
    }
    if (questions.length === 0) {
      return sendError(res, 'No valid questions found in the imported text.', 400);
    }

    // Replace or append
    await prisma.$transaction(async (tx) => {
      if (replace) {
        await tx.quizQuestion.deleteMany({ where: { quizId } });
      }

      // Get current max order if appending
      let startOrder = 0;
      if (!replace) {
        const last = await tx.quizQuestion.findFirst({
          where: { quizId },
          orderBy: { order: 'desc' },
          select: { order: true },
        });
        startOrder = last?.order ?? 0;
      }

      await tx.quizQuestion.createMany({
        data: questions.map((q, idx) => ({
          quizId,
          question: q.question,
          type: 'SINGLE_CHOICE',
          options: q.options,
          correctAnswer: q.correctAnswer,
          order: startOrder + idx + 1,
        })),
      });
    });

    const count = await prisma.quizQuestion.count({ where: { quizId } });
    sendSuccess(res, `${questions.length} question(s) imported successfully.`, { count });
  }),

  // ── DELETE /api/quiz/:quizId/questions ───────────────────────────────────────
  // INSTRUCTOR: Delete a single question
  deleteQuestion: asyncHandler(async (req, res) => {
    const { questionId } = req.params;

    const question = await prisma.quizQuestion.findUnique({
      where: { id: questionId },
      include: { quiz: { include: { course: { select: { instructorId: true } } } } },
    });
    if (!question) return sendError(res, 'Question not found.', 404);
    if (question.quiz.course.instructorId !== req.user.id) return sendError(res, 'Not authorized.', 403);

    await prisma.quizQuestion.delete({ where: { id: questionId } });
    sendSuccess(res, 'Question deleted.');
  }),

  // ── GET /api/quiz/:quizId/questions ─────────────────────────────────────────
  // INSTRUCTOR/ADMIN: Get all questions with correct answers
  getQuestions: asyncHandler(async (req, res) => {
    const { quizId } = req.params;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { course: { select: { instructorId: true } } },
    });
    if (!quiz) return sendError(res, 'Quiz not found.', 404);
    if (req.user.role === 'INSTRUCTOR' && quiz.course.instructorId !== req.user.id) {
      return sendError(res, 'Not authorized.', 403);
    }

    const questions = await prisma.quizQuestion.findMany({
      where: { quizId },
      orderBy: { order: 'asc' },
    });

    sendSuccess(res, 'Questions fetched.', { questions });
  }),

  // ── GET /api/quiz/course/:courseId/eligibility ───────────────────────────────
  // STUDENT: Check quiz eligibility before starting
  checkEligibility: asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const studentId = req.user.id;

    const result = await _checkStudentEligibility(studentId, courseId);
    sendSuccess(res, 'Eligibility checked.', result);
  }),

  // ── POST /api/quiz/course/:courseId/start ────────────────────────────────────
  // STUDENT: Start a new quiz attempt (or resume in-progress)
  startQuiz: asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const studentId = req.user.id;

    // Check eligibility
    const eligibility = await _checkStudentEligibility(studentId, courseId);
    if (!eligibility.eligible) {
      return sendError(res, eligibility.reason, 403);
    }

    const quiz = eligibility.quiz;
    const questions = await prisma.quizQuestion.findMany({
      where: { quizId: quiz.id },
      orderBy: { order: 'asc' },
    });
    const totalQuestions = questions.length;

    // Check for an existing active session (in-progress attempt)
    const existingSession = await prisma.quizSession.findUnique({
      where: { quizId_userId: { quizId: quiz.id, userId: studentId } },
      include: { attempt: true },
    });

    if (existingSession) {
      // Check session not expired
      if (new Date() > existingSession.expiresAt) {
        // Auto-submit the expired attempt
        await _autoSubmitExpiredAttempt(existingSession.attempt, quiz, questions);
        // Delete the expired session
        await prisma.quizSession.delete({ where: { id: existingSession.id } });

        // Re-check eligibility after auto-submit
        const recheck = await _checkStudentEligibility(studentId, courseId);
        if (!recheck.eligible) {
          return sendError(res, recheck.reason, 403);
        }
        // Fall through to create new attempt
      } else {
        // Resume in-progress attempt
        const attempt = existingSession.attempt;
        const currentIdx = attempt.currentQuestion;
        const currentQ = questions[currentIdx];
        const timeRemaining = Math.max(
          0,
          Math.round((existingSession.expiresAt - new Date()) / 1000)
        );

        return sendSuccess(res, 'Resuming in-progress attempt.', {
          attemptId: attempt.id,
          sessionId: existingSession.id,
          question: sanitizeQuestion(currentQ, currentIdx, totalQuestions),
          totalQuestions,
          currentIndex: currentIdx,
          attemptNumber: attempt.attemptNumber,
          attemptsUsed: eligibility.attemptsUsed,
          maxAttempts: quiz.maxAttempts,
          timePerQuestion: quiz.timePerQuestion,
          totalTimeRemaining: timeRemaining,
          resuming: true,
        });
      }
    }

    // Determine attempt number
    const completedAttempts = await prisma.quizAttempt.count({
      where: { quizId: quiz.id, userId: studentId, completedAt: { not: null } },
    });
    const attemptNumber = completedAttempts + 1;

    // Calculate session expiry: questions * timePerQuestion + 5 min grace
    const graceSecs = 300;
    const expiresAt = new Date(Date.now() + (totalQuestions * quiz.timePerQuestion + graceSecs) * 1000);

    // Create attempt and session in a transaction
    const { attempt, session } = await prisma.$transaction(async (tx) => {
      const newAttempt = await tx.quizAttempt.create({
        data: {
          quizId: quiz.id,
          userId: studentId,
          attemptNumber,
          answers: {},
          currentQuestion: 0,
        },
      });

      const newSession = await tx.quizSession.create({
        data: {
          quizId: quiz.id,
          userId: studentId,
          attemptId: newAttempt.id,
          expiresAt,
        },
      });

      return { attempt: newAttempt, session: newSession };
    });

    sendSuccess(res, 'Quiz started.', {
      attemptId: attempt.id,
      sessionId: session.id,
      question: sanitizeQuestion(questions[0], 0, totalQuestions),
      totalQuestions,
      currentIndex: 0,
      attemptNumber,
      attemptsUsed: completedAttempts,
      maxAttempts: quiz.maxAttempts,
      timePerQuestion: quiz.timePerQuestion,
      totalTimeRemaining: totalQuestions * quiz.timePerQuestion + graceSecs,
      resuming: false,
    });
  }),

  // ── POST /api/quiz/attempt/:attemptId/answer ─────────────────────────────────
  // STUDENT: Submit an answer for the current question and advance
  submitAnswer: asyncHandler(async (req, res) => {
    const { attemptId } = req.params;
    const { questionId, selectedOptionId } = req.body;
    const studentId = req.user.id;

    if (!questionId) return sendError(res, 'questionId is required.', 400);

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: { orderBy: { order: 'asc' } },
          },
        },
        session: true,
      },
    });

    if (!attempt) return sendError(res, 'Attempt not found.', 404);
    if (attempt.userId !== studentId) return sendError(res, 'Not authorized.', 403);
    if (attempt.completedAt) return sendError(res, 'This attempt has already been submitted.', 400);
    if (!attempt.session) return sendError(res, 'Quiz session not found. Please restart.', 400);

    // Check session expiry
    if (new Date() > attempt.session.expiresAt) {
      await _autoSubmitExpiredAttempt(attempt, attempt.quiz, attempt.quiz.questions);
      return sendError(res, 'Your quiz session has expired and has been auto-submitted.', 408);
    }

    const questions = attempt.quiz.questions;
    const totalQuestions = questions.length;

    // Validate the question belongs to this quiz
    const questionObj = questions.find((q) => q.id === questionId);
    if (!questionObj) return sendError(res, 'Question not found in this quiz.', 404);

    // Save the answer (allow overwrite for the current question only)
    const updatedAnswers = { ...(attempt.answers || {}), [questionId]: selectedOptionId || null };
    const nextIndex = attempt.currentQuestion + 1;
    const isLast = nextIndex >= totalQuestions;

    await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        answers: updatedAnswers,
        currentQuestion: Math.min(nextIndex, totalQuestions - 1),
      },
    });

    if (isLast) {
      return sendSuccess(res, 'Answer saved. Quiz complete — please submit.', {
        isLast: true,
        nextQuestion: null,
        currentIndex: totalQuestions - 1,
      });
    }

    const nextQ = questions[nextIndex];
    sendSuccess(res, 'Answer saved.', {
      isLast: false,
      nextQuestion: sanitizeQuestion(nextQ, nextIndex, totalQuestions),
      currentIndex: nextIndex,
    });
  }),

  // ── POST /api/quiz/attempt/:attemptId/submit ─────────────────────────────────
  // STUDENT: Final quiz submission — evaluate and return result
  submitQuiz: asyncHandler(async (req, res) => {
    const { attemptId } = req.params;
    const { finalAnswer } = req.body; // optional last answer if submitted on last question
    const studentId = req.user.id;

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: { orderBy: { order: 'asc' } },
            course: { select: { id: true, title: true } },
          },
        },
        session: true,
      },
    });

    if (!attempt) return sendError(res, 'Attempt not found.', 404);
    if (attempt.userId !== studentId) return sendError(res, 'Not authorized.', 403);
    if (attempt.completedAt) return sendError(res, 'This attempt has already been submitted.', 400);

    // Check session expiry — still allow submit within a short grace
    if (attempt.session && new Date() > new Date(attempt.session.expiresAt.getTime() + 30000)) {
      // 30 second extra grace for final submit
      return sendError(res, 'Your quiz session has expired.', 408);
    }

    const quiz = attempt.quiz;
    const questions = quiz.questions;
    const totalQuestions = questions.length;
    const completedAt = new Date();
    const timeTaken = Math.round((completedAt - attempt.startedAt) / 1000);

    // Save the last answer if provided
    let answers = { ...(attempt.answers || {}) };
    if (finalAnswer?.questionId) {
      answers[finalAnswer.questionId] = finalAnswer.selectedOptionId || null;
    }

    // Score the quiz
    let correctCount = 0;
    const questionResults = questions.map((q) => {
      const studentAnswer = answers[q.id];
      const correctAnswers = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
      const isCorrect = correctAnswers.includes(studentAnswer);
      if (isCorrect) correctCount++;
      return {
        questionId: q.id,
        question: q.question,
        options: q.options,
        selectedOption: studentAnswer,
        correctAnswer: correctAnswers[0],
        isCorrect,
      };
    });

    const percentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const mcqMarks = totalQuestions > 0 ? (correctCount / totalQuestions) * 60 : 0;
    const passed = percentage >= quiz.passMark;

    // Update attempt as completed
    await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        answers,
        score: Math.round(percentage * 100) / 100,
        rawScore: correctCount,
        mcqMarks: Math.round(mcqMarks * 100) / 100,
        passed,
        timeTaken,
        completedAt,
        currentQuestion: totalQuestions - 1,
      },
    });

    // Delete session
    if (attempt.session) {
      await prisma.quizSession.delete({ where: { id: attempt.session.id } }).catch(() => {});
    }

    // Compute full evaluation for certificate check
    let certificateStatus = null;
    try {
      const evaluation = await computeFinalScore(studentId, quiz.courseId);
      certificateStatus = {
        eligible: evaluation.eligible,
        reason: evaluation.reason,
        breakdown: evaluation.breakdown,
      };

      if (evaluation.eligible) {
        await issueCertificateWithMarks(studentId, quiz.courseId, evaluation.breakdown);
      }
    } catch (err) {
      console.error('[Quiz submit] Evaluation error:', err.message);
    }

    // Count remaining attempts
    const completedAttempts = await prisma.quizAttempt.count({
      where: { quizId: quiz.id, userId: studentId, completedAt: { not: null } },
    });
    const remainingAttempts = Math.max(0, quiz.maxAttempts - completedAttempts);

    sendSuccess(res, passed ? 'Quiz passed!' : 'Quiz submitted.', {
      passed,
      score: Math.round(percentage * 100) / 100,
      mcqMarks: Math.round(mcqMarks * 100) / 100,
      correctAnswers: correctCount,
      totalQuestions,
      passMark: quiz.passMark,
      attemptNumber: attempt.attemptNumber,
      remainingAttempts,
      timeTaken,
      questionResults,
      certificateStatus,
    });
  }),

  // ── GET /api/quiz/course/:courseId/attempts ──────────────────────────────────
  // STUDENT: Get all my completed attempts for this course's quiz
  getAttemptHistory: asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const studentId = req.user.id;

    const quiz = await prisma.quiz.findUnique({ where: { courseId } });
    if (!quiz) return sendError(res, 'No quiz found for this course.', 404);

    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId: quiz.id, userId: studentId, completedAt: { not: null } },
      orderBy: { attemptNumber: 'asc' },
      select: {
        id: true,
        attemptNumber: true,
        score: true,
        rawScore: true,
        mcqMarks: true,
        passed: true,
        timeTaken: true,
        startedAt: true,
        completedAt: true,
      },
    });

    sendSuccess(res, 'Attempt history fetched.', {
      attempts,
      attemptsUsed: attempts.length,
      maxAttempts: quiz.maxAttempts,
      remainingAttempts: Math.max(0, quiz.maxAttempts - attempts.length),
    });
  }),

  // ── GET /api/quiz/course/:courseId/stats ─────────────────────────────────────
  // INSTRUCTOR/ADMIN: Aggregate statistics for the quiz
  getStats: asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    const quiz = await prisma.quiz.findUnique({
      where: { courseId },
      include: {
        _count: { select: { questions: true } },
        course: { select: { instructorId: true, title: true } },
      },
    });
    if (!quiz) return sendError(res, 'No quiz found for this course.', 404);

    if (req.user.role === 'INSTRUCTOR' && quiz.course.instructorId !== req.user.id) {
      return sendError(res, 'Not authorized.', 403);
    }

    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId: quiz.id, completedAt: { not: null } },
      select: {
        id: true,
        userId: true,
        attemptNumber: true,
        score: true,
        mcqMarks: true,
        passed: true,
        timeTaken: true,
        completedAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { completedAt: 'desc' },
    });

    const totalAttempts = attempts.length;
    const passCount = attempts.filter((a) => a.passed).length;
    const avgScore = totalAttempts > 0
      ? attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts
      : 0;

    // Unique students who have attempted
    const uniqueStudents = new Set(attempts.map((a) => a.userId)).size;

    sendSuccess(res, 'Quiz statistics fetched.', {
      quiz: {
        id: quiz.id,
        title: quiz.title,
        isPublished: quiz.isPublished,
        passMark: quiz.passMark,
        maxAttempts: quiz.maxAttempts,
        timePerQuestion: quiz.timePerQuestion,
        questionCount: quiz._count.questions,
      },
      stats: {
        totalAttempts,
        uniqueStudents,
        passCount,
        failCount: totalAttempts - passCount,
        passRate: totalAttempts > 0 ? Math.round((passCount / totalAttempts) * 100) : 0,
        avgScore: Math.round(avgScore * 100) / 100,
      },
      attempts,
    });
  }),

  // ── GET /api/quiz/admin/all ──────────────────────────────────────────────────
  // ADMIN: Get all quizzes across all courses
  getAllQuizzes: asyncHandler(async (req, res) => {
    const quizzes = await prisma.quiz.findMany({
      include: {
        course: { select: { id: true, title: true, instructor: { select: { name: true, email: true } } } },
        _count: { select: { questions: true, attempts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, 'All quizzes fetched.', { quizzes });
  }),
};

// ─── PRIVATE HELPERS ──────────────────────────────────────────────────────────

async function _checkStudentEligibility(studentId, courseId) {
  // 1. Enrollment check
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
    include: { course: true },
  });

  if (!enrollment) return { eligible: false, reason: 'You are not enrolled in this course.' };
  if (enrollment.status === 'DROPPED') {
    return { eligible: false, reason: 'Your enrollment is inactive. Please contact admin.' };
  }

  // Check if student already claimed certificate or completed course
  const certificate = await prisma.certificate.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  if (enrollment.status === 'COMPLETED' || certificate) {
    return {
      eligible: false,
      reason: 'You have already completed this course and earned your certificate. The final assessment is closed.',
      completed: true,
    };
  }

  // 2. Course published
  if (enrollment.course.status !== 'PUBLISHED') {
    return { eligible: false, reason: 'This course is not yet published.' };
  }

  // 2.5 Admin explicit revocation check
  if (enrollment.certificateEligible === false) {
    return {
      eligible: false,
      reason: 'Your certificate eligibility has been placed on hold by the administrator.',
    };
  }

  // 3. Course progress = 100% (bypassed if admin explicitly granted certificateEligible === true)
  if (enrollment.certificateEligible !== true && enrollment.progress < 100) {
    return {
      eligible: false,
      reason: `Complete all course lessons first. Progress: ${Math.round(enrollment.progress)}%`,
    };
  }

  // 4. Quiz exists and published
  const quiz = await prisma.quiz.findUnique({
    where: { courseId },
    include: { _count: { select: { questions: true } } },
  });
  if (!quiz) return { eligible: false, reason: 'No final quiz has been set for this course yet.' };
  if (!quiz.isPublished) return { eligible: false, reason: 'The final quiz is not published yet.' };
  if (quiz._count.questions < 1) {
    return { eligible: false, reason: 'The quiz has no questions yet.' };
  }

  // 5. Attempts remaining
  const completedAttempts = await prisma.quizAttempt.count({
    where: { quizId: quiz.id, userId: studentId, completedAt: { not: null } },
  });
  if (completedAttempts >= quiz.maxAttempts) {
    return {
      eligible: false,
      reason: `You have used all ${quiz.maxAttempts} attempt(s). No retakes remaining.`,
      attemptsUsed: completedAttempts,
      maxAttempts: quiz.maxAttempts,
    };
  }

  return {
    eligible: true,
    quiz,
    attemptsUsed: completedAttempts,
    maxAttempts: quiz.maxAttempts,
    remainingAttempts: quiz.maxAttempts - completedAttempts,
  };
}

async function _autoSubmitExpiredAttempt(attempt, quiz, questions) {
  try {
    const answers = attempt.answers || {};
    let correctCount = 0;

    for (const q of questions) {
      const studentAnswer = answers[q.id];
      const correctAnswers = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
      if (correctAnswers.includes(studentAnswer)) correctCount++;
    }

    const totalQuestions = questions.length;
    const percentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const mcqMarks = totalQuestions > 0 ? (correctCount / totalQuestions) * 60 : 0;
    const passed = percentage >= quiz.passMark;
    const completedAt = new Date();
    const timeTaken = Math.round((completedAt - attempt.startedAt) / 1000);

    await prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        score: Math.round(percentage * 100) / 100,
        rawScore: correctCount,
        mcqMarks: Math.round(mcqMarks * 100) / 100,
        passed,
        timeTaken,
        completedAt,
      },
    });

    // Check certificate eligibility after auto-submit
    const { computeFinalScore, issueCertificateWithMarks } = require('../utils/evaluationUtils');
    const evaluation = await computeFinalScore(attempt.userId, quiz.courseId);
    if (evaluation.eligible) {
      await issueCertificateWithMarks(attempt.userId, quiz.courseId, evaluation.breakdown);
    }
  } catch (err) {
    console.error('[Auto-submit error]:', err.message);
  }
}

module.exports = quizController;

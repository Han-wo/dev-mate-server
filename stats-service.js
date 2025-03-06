const { firestore } = require("./firebase-admin-config");

/**
 * 파일 분석 기록을 추가합니다.
 */
async function recordFileAnalysis(userId, fileData) {
  try {
    const docRef = await firestore.collection("analyzedFiles").add({
      userId,
      fileName: fileData.fileName,
      fileType: fileData.fileType || "code",
      repoName: fileData.repoName || "",
      analyzedAt: firestore.FieldValue.serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("파일 분석 기록 추가 중 오류:", error);
    throw new Error("파일 분석 기록을 추가하는 중 오류가 발생했습니다.");
  }
}

/**
 * 퀴즈 완료 기록을 추가합니다.
 */
async function recordQuizCompletion(userId, quizData) {
  try {
    const docRef = await firestore.collection("quizAttempts").add({
      userId,
      noteId: quizData.noteId,
      score: quizData.score,
      totalQuestions: quizData.totalQuestions,
      completed: true,
      completedAt: firestore.FieldValue.serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("퀴즈 완료 기록 추가 중 오류:", error);
    throw new Error("퀴즈 완료 기록을 추가하는 중 오류가 발생했습니다.");
  }
}

/**
 * 사용자의 학습 통계 정보를 가져옵니다.
 */
async function getUserStats(userId) {
  try {
    // 1. 노트 수 계산
    const notesSnapshot = await firestore
      .collection("studyNotes")
      .where("userId", "==", userId)
      .get();
    const notesCount = notesSnapshot.size;

    // 2. 완료한 퀴즈 수 계산
    let completedQuizzesCount = 0;
    try {
      const quizzesSnapshot = await firestore
        .collection("quizAttempts")
        .where("userId", "==", userId)
        .where("completed", "==", true)
        .get();
      completedQuizzesCount = quizzesSnapshot.size;
    } catch (error) {
      console.log("퀴즈 컬렉션이 없거나 쿼리 오류:", error);
      // 오류 시 0으로 처리
    }

    // 3. 분석한 파일 수 계산
    let analyzedFilesCount = 0;
    try {
      const filesSnapshot = await firestore
        .collection("analyzedFiles")
        .where("userId", "==", userId)
        .get();
      analyzedFilesCount = filesSnapshot.size;
    } catch (error) {
      console.log("분석 파일 컬렉션이 없거나 쿼리 오류:", error);
      // 오류 시 0으로 처리
    }

    // 4. 최근 학습 노트 가져오기
    const recentNotesSnapshot = await firestore
      .collection("studyNotes")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(3)
      .get();

    const recentNotes = recentNotesSnapshot.docs.map((doc) => {
      const data = doc.data();

      // Firestore 타임스탬프를 ISO 문자열로 변환
      const createdAt = data.createdAt
        ? data.createdAt.toDate().toISOString()
        : null;
      const updatedAt = data.updatedAt
        ? data.updatedAt.toDate().toISOString()
        : null;

      return {
        id: doc.id,
        ...data,
        createdAt,
        updatedAt,
      };
    });

    return {
      notesCount,
      completedQuizzesCount,
      analyzedFilesCount,
      recentNotes,
    };
  } catch (error) {
    console.error("통계 정보 조회 중 오류:", error);
    throw new Error("사용자 통계 정보를 가져오는 중 오류가 발생했습니다.");
  }
}

module.exports = {
  recordFileAnalysis,
  recordQuizCompletion,
  getUserStats,
};

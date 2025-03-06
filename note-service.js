const { admin, firestore } = require("./firebase-admin-config");
const { FieldValue } = require("firebase-admin/firestore");

const NOTES_COLLECTION = "studyNotes";

/**
 * 학습 노트 생성
 */
async function createNote(note) {
  try {
    console.log("노트 저장 시도:", JSON.stringify(note));

    // 직렬화 가능한 형태로 데이터 정리
    const cleanedNote = JSON.parse(JSON.stringify(note));

    const docRef = await firestore.collection(NOTES_COLLECTION).add({
      ...cleanedNote,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    throw new Error(`노트 생성 중 오류가 발생했습니다: ${error.message}`);
  }
}

/**
 * 특정 사용자의 모든 학습 노트 조회
 */
async function getUserNotes(userId) {
  try {
    const snapshot = await firestore
      .collection(NOTES_COLLECTION)
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc") // 생성일 기준 내림차순
      .get();

    return snapshot.docs.map((doc) => {
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
  } catch (error) {
    console.error("노트 목록 조회 중 오류:", error);
    throw new Error("노트 목록을 가져오는 중 오류가 발생했습니다.");
  }
}

/**
 * 특정 학습 노트 조회
 */
async function getNoteById(noteId) {
  try {
    const docRef = firestore.collection(NOTES_COLLECTION).doc(noteId);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();

      // Firestore 타임스탬프를 ISO 문자열로 변환
      const createdAt = data.createdAt
        ? data.createdAt.toDate().toISOString()
        : null;
      const updatedAt = data.updatedAt
        ? data.updatedAt.toDate().toISOString()
        : null;

      return {
        id: docSnap.id,
        ...data,
        createdAt,
        updatedAt,
      };
    }
    return null;
  } catch (error) {
    console.error("노트 조회 중 오류:", error);
    throw new Error("노트를 가져오는 중 오류가 발생했습니다.");
  }
}

/**
 * 학습 노트 업데이트
 */
async function updateNote(noteId, noteData) {
  try {
    // 직렬화 가능한 형태로 데이터 정리
    const cleanedNoteData = JSON.parse(JSON.stringify(noteData));

    const docRef = firestore.collection(NOTES_COLLECTION).doc(noteId);
    await docRef.update({
      ...cleanedNoteData,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("노트 업데이트 중 오류:", error);
    throw new Error("노트 업데이트 중 오류가 발생했습니다.");
  }
}

/**
 * 학습 노트 삭제
 */
async function deleteNote(noteId) {
  try {
    const docRef = firestore.collection(NOTES_COLLECTION).doc(noteId);
    await docRef.delete();
    return true;
  } catch (error) {
    console.error("노트 삭제 중 오류:", error);
    throw new Error("노트 삭제 중 오류가 발생했습니다.");
  }
}

module.exports = {
  createNote,
  getUserNotes,
  getNoteById,
  updateNote,
  deleteNote,
};
